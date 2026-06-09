import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { HttpError } from "../../common/utils/http-error";
import { authTokenBlacklist } from "../../common/utils/auth-token-blacklist";
import { UserModel } from "../users/user.model";
import { UserRepository } from "../users/user.repository";
import type { RegisterInput, LoginInput } from "./auth.schema";

const userRepository = new UserRepository();

const signToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
};

export class AuthService {
  async register(data: RegisterInput) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new HttpError(409, "Email is already in use.");
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new HttpError(409, "Username is already taken.");
    }

    const user = await UserModel.create({
      username: data.username,
      email: data.email,
      password: data.password,
    });

    const token = signToken(String(user._id), user.email);

    return { token, user };
  }

  async login(data: LoginInput) {
    // password is select:false on the schema — explicitly select it here
    const user = await UserModel.findOne({ email: data.email, deletedAt: null })
      .select("+password")
      .exec();

    if (!user) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new HttpError(401, "Invalid email or password.");
    }

    // Update online status
    user.status = "online";
    user.lastSeen = new Date();
    await user.save();

    const token = signToken(String(user._id), user.email);

    // Strip password from the returned object
    const userObject = user.toObject();

    return { token, user: userObject };
  }

  logout(token: string, expiresAt?: number): void {
    authTokenBlacklist.blacklistToken(token, expiresAt);
  }
}
