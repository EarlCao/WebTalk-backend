import { Router } from "express";

import { authRoutes } from "../modules/auth/auth.routes";
import { conversationRoutes } from "../modules/conversations/conversation.routes";
import { userRoutes } from "../modules/users/user.routes";

// Future routes — uncomment as you build them out:
// import { messageRoutes } from "../modules/messages/message.routes";
// import { friendRoutes } from "../modules/friends/friend.routes";
// import { notificationRoutes } from "../modules/notifications/notification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);

// Future routes:
// router.use("/messages", messageRoutes);
// router.use("/friends", friendRoutes);
// router.use("/notifications", notificationRoutes);

export default router;
