import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getNumberEnv = (key: string, fallback?: number): number => {
  const rawValue = process.env[key];

  if (!rawValue) {
    if (fallback === undefined) {
      throw new Error(`Missing required numeric environment variable: ${key}`);
    }

    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsedValue;
};

const getOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key];

  return value && value.trim().length > 0 ? value : undefined;
};

const supportedDbConnections = ["mongodb", "mongoose"] as const;
type DbConnection = (typeof supportedDbConnections)[number];

const dbConnection = (process.env.DB_CONNECTION ?? "mongoose").toLowerCase();

if (!supportedDbConnections.includes(dbConnection as DbConnection)) {
  throw new Error(
    `Unsupported DB_CONNECTION "${dbConnection}". Only "mongodb" and "mongoose" are supported.`,
  );
}

const mongoPort = getNumberEnv("DB_PORT", 27017);
const mongoUri =
  getOptionalEnv("MONGODB_URI") ??
  getOptionalEnv("MONGO_URI") ??
  (() => {
    const host = getRequiredEnv("DB_HOST");
    const name = getRequiredEnv("DB_NAME");
    const user = getOptionalEnv("DB_USER");
    const pass = getOptionalEnv("DB_PASS");
    const credentials = user
      ? `${encodeURIComponent(user)}${pass ? `:${encodeURIComponent(pass)}` : ""}@`
      : "";

    return `mongodb://${credentials}${host}:${mongoPort}/${name}`;
  })();

export const env = {
  PORT: getNumberEnv("PORT", 5555),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "http://localhost:3030")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  DB_CONNECTION: dbConnection as DbConnection,
  DB_HOST: getRequiredEnv("DB_HOST"),
  DB_USER: process.env.DB_USER ?? "",
  DB_PASS: process.env.DB_PASS ?? "",
  DB_NAME: getRequiredEnv("DB_NAME"),
  DB_PORT: mongoPort,
  MONGO_URI: mongoUri,
  MONGODB_URI: mongoUri,
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
} as const;
