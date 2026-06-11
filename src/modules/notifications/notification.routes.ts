import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async.handler";
import { notificationController } from "./notification.controller";

const notificationRouter = Router();

notificationRouter.use(authMiddleware);

notificationRouter.get("/", asyncHandler(notificationController.getNotifications));

// read-all must be before /:id so Express doesn't treat "read-all" as an id param
notificationRouter.patch("/read-all", asyncHandler(notificationController.markAllAsRead));
notificationRouter.patch("/:id/read", asyncHandler(notificationController.markAsRead));

notificationRouter.delete("/:id", asyncHandler(notificationController.deleteNotification));

export default notificationRouter;
