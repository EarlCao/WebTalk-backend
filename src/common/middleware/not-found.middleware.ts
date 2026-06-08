import type { Request, Response } from "express";

import { sendError } from "../response";

export const notFoundMiddleware = (request: Request, response: Response): void => {
  sendError(response, 404, `Route not found: ${request.method} ${request.originalUrl}`);
};