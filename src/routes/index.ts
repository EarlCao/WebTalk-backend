import { Router } from "express";

import authRouter from "../modules/auth/auth.routes";
import conversationRouter from "../modules/conversations/conversation.routes";
import friendRouter from "../modules/friends/friend.routes";
import messageRouter from "../modules/messages/message.routes";
import notificationRouter from "../modules/notifications/notification.routes";
import userRouter from "../modules/users/user.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/conversations", conversationRouter);
router.use("/messages", messageRouter);
router.use("/friends", friendRouter);
router.use("/notifications", notificationRouter);

export default router;
