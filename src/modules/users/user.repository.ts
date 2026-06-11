import { QueryFilter } from "mongoose";
import { IUser, UserModel } from "./user.model";
import { UpdateProfileInput } from "./user.schema";

// Applied to every query so soft-deleted users are always invisible
const ACTIVE_FILTER = { deletedAt: null } as const;

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return UserModel.findOne({ _id: id, ...ACTIVE_FILTER }).exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username, ...ACTIVE_FILTER }).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email, ...ACTIVE_FILTER }).exec();
  }

  async updateById(id: string, data: UpdateProfileInput): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: data },
      { new: true }
    ).exec();
  }

  async updateStatus(id: string, status: string, lastSeen: Date): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { status, lastSeen } },
      { new: true }
    ).exec();
  }

  async softDeleteById(id: string): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: id, ...ACTIVE_FILTER },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).exec();
  }

  async restoreById(id: string): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { new: true }
    ).exec();
  }

  async searchUsers(
    query: QueryFilter<IUser>,
    skip: number,
    limit: number
  ): Promise<{ users: IUser[]; total: number }> {
    const filter = { ...query, ...ACTIVE_FILTER };
    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).exec(),
      UserModel.countDocuments(filter).exec(),
    ]);

    return { users, total };
  }
}
