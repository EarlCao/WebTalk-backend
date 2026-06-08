import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorMiddleware } from "./common/middleware/error.middleware";
import { notFoundMiddleware } from "./common/middleware/not-found.middleware";
import { sendSuccess } from "./common/response";
import { env } from "./config/env";

export const createApp = (): express.Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_request, response) => {
    sendSuccess(response, 200, "Server is healthy.", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
