import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { FriendController } from "./friend.controller";

const router = Router();
const friendController = new FriendController();

// All friend routes require a valid JWT.
//
// IMPORTANT: static sub-routes (/requests/incoming, /requests/outgoing, /requests)
// are registered BEFORE the dynamic /:id route to prevent Express from treating
// "requests" as a wildcard param value.

// ── Friend requests ───────────────────────────────────────────────────────────

router.get("/requests/incoming", authMiddleware, friendController.getIncomingRequests);
router.get("/requests/outgoing", authMiddleware, friendController.getOutgoingRequests);
router.post("/requests", authMiddleware, friendController.sendRequest);
router.patch("/requests/:id/accept", authMiddleware, friendController.acceptRequest);
router.patch("/requests/:id/decline", authMiddleware, friendController.declineRequest);
router.delete("/requests/:id", authMiddleware, friendController.cancelRequest);

// ── Friendship management ─────────────────────────────────────────────────────

router.get("/", authMiddleware, friendController.getFriends);
router.delete("/:id", authMiddleware, friendController.removeFriend);

export const friendRoutes = router;
