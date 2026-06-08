import mongoose from "mongoose";

import { env } from "./env";

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      dbName: env.DB_NAME,
    });

    console.log(`MongoDB connected: ${env.DB_NAME}`);
    return mongoose;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
};
