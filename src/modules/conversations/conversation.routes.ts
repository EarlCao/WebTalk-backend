import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { ConversationController } from "./conversation.controller";

const router = Router();
const conversationController = new ConversationController();

// All conversation routes require a valid JWT
router.get("/", authMiddleware, conversationController.getConversations);
router.get("/:id", authMiddleware, conversationController.getConversationById);

router.post("/direct", authMiddleware, conversationController.createDirect);
router.post("/group", authMiddleware, conversationController.createGroup);

router.patch("/:id", authMiddleware, conversationController.updateGroup);

router.post("/:id/participants", authMiddleware, conversationController.addParticipants);
router.delete(
  "/:id/participants/:participantId",
  authMiddleware,
  conversationController.removeParticipant,
);

router.delete("/:id", authMiddleware, conversationController.deleteConversation);

export const conversationRoutes = router;
