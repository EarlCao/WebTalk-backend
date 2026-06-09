import { QueryFilter } from "mongoose";
import { IUser } from "./user.model";
import { UserRepository } from "./user.repository";
import { UpdateProfileInput } from "./user.schema";

export class UserService {
  private userRepository = new UserRepository();

  async getUserProfile(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }

  async updateUserProfile(userId: string, data: UpdateProfileInput): Promise<IUser | null> {
    return this.userRepository.updateById(userId, data);
  }

  async softDeleteUser(userId: string): Promise<IUser | null> {
    return this.userRepository.softDeleteById(userId);
  }

  async restoreUser(userId: string): Promise<IUser | null> {
    return this.userRepository.restoreById(userId);
  }

  async searchUsers(
    username?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const filter: QueryFilter<IUser> = username
      ? { username: { $regex: username, $options: "i" } }
      : {};

    const skip = (page - 1) * limit;
    const { users, total } = await this.userRepository.searchUsers(filter, skip, limit);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }
}
