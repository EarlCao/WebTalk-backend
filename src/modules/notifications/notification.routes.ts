import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { NotificationController } from "./notification.controller";

const router = Router();
const notificationController = new NotificationController();

// All notification routes require a valid JWT
router.get("/", authMiddleware, notificationController.getNotifications);

// read-all must be before /:id so Express doesn't treat "read-all" as an id param
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

router.delete("/:id", authMiddleware, notificationController.deleteNotification);

export const notificationRoutes = router;
