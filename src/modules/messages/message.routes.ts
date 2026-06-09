import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { MessageController } from "./message.controller";

const router = Router();
const messageController = new MessageController();

// All message routes require a valid JWT
router.get("/", authMiddleware, messageController.getMessages);
router.post("/", authMiddleware, messageController.sendMessage);

router.patch("/:id", authMiddleware, messageController.editMessage);
router.delete("/:id", authMiddleware, messageController.deleteMessage);

router.post("/:id/read", authMiddleware, messageController.markAsRead);

export const messageRoutes = router;
