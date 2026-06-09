import bcrypt from "bcrypt";
import { Document, Schema, model } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  status?: string;
  lastSeen?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    status: { type: String, enum: ["online", "offline", "away", "busy"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving — only runs when the password field is new or modified
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Used during login to verify the candidate password against the stored hash
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Speeds up all active-user queries
UserSchema.index({ deletedAt: 1 });

export const UserModel = model<IUser>("User", UserSchema);
