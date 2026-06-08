import type { Response } from "express";

type SuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

type ErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

export const sendSuccess = <T>(
  response: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response<SuccessResponse<T>> => {
  const payload: SuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return response.status(statusCode).json(payload);
};

export const sendError = (
  response: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
): Response<ErrorResponse> => {
  const payload: ErrorResponse = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    payload.errors = errors;
  }

  return response.status(statusCode).json(payload);
};