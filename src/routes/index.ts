import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";
import { conversationRoutes } from "../modules/conversations/conversation.routes";
import { friendRoutes } from "../modules/friends/friend.routes";
import { messageRoutes } from "../modules/messages/message.routes";
import { notificationRoutes } from "../modules/notifications/notification.routes";
import { userRoutes } from "../modules/users/user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/friends", friendRoutes);
router.use("/notifications", notificationRoutes);

export default router;
