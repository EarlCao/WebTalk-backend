import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async.handler";
import { conversationController } from "./conversation.controller";

const conversationRouter = Router();

conversationRouter.use(authMiddleware);

conversationRouter.get("/", asyncHandler(conversationController.getConversations));
conversationRouter.get("/:id", asyncHandler(conversationController.getConversationById));

conversationRouter.post("/direct", asyncHandler(conversationController.createDirect));
conversationRouter.post("/group", asyncHandler(conversationController.createGroup));

conversationRouter.patch("/:id", asyncHandler(conversationController.updateGroup));

conversationRouter.post(
  "/:id/participants",
  asyncHandler(conversationController.addParticipants),
);
conversationRouter.delete(
  "/:id/participants/:participantId",
  asyncHandler(conversationController.removeParticipant),
);

conversationRouter.delete("/:id", asyncHandler(conversationController.deleteConversation));

export default conversationRouter;
