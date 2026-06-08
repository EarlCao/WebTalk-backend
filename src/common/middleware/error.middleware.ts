import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

import { sendError } from "../response";
import { HttpError } from "../utils/http-error";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Internal server error.";
};

export const errorMiddleware: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    sendError(response, error.statusCode, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(response, 400, "Validation failed.", error.issues);
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    sendError(response, 400, "Validation failed.", error.errors);
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    sendError(response, 400, "Invalid resource identifier.");
    return;
  }

  const message = request.app.get("env") === "production" ? "Internal server error." : getErrorMessage(error);
  sendError(response, 500, message);
};
