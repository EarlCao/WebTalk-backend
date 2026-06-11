import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async.handler";
import { messageController } from "./message.controller";

const messageRouter = Router();

messageRouter.use(authMiddleware);

messageRouter.get("/", asyncHandler(messageController.getMessages));
messageRouter.post("/", asyncHandler(messageController.sendMessage));

messageRouter.patch("/:id", asyncHandler(messageController.editMessage));
messageRouter.delete("/:id", asyncHandler(messageController.deleteMessage));

messageRouter.post("/:id/read", asyncHandler(messageController.markAsRead));

export default messageRouter;
