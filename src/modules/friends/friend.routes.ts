import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async.handler";
import { friendController } from "./friend.controller";

const friendRouter = Router();

friendRouter.use(authMiddleware);

// IMPORTANT: static sub-routes (/requests/incoming, /requests/outgoing, /requests)
// are registered BEFORE the dynamic /:id route to prevent Express from treating
// "requests" as a wildcard param value.

// ── Friend requests ───────────────────────────────────────────────────────────

friendRouter.get("/requests/incoming", asyncHandler(friendController.getIncomingRequests));
friendRouter.get("/requests/outgoing", asyncHandler(friendController.getOutgoingRequests));
friendRouter.post("/requests", asyncHandler(friendController.sendRequest));
friendRouter.patch("/requests/:id/accept", asyncHandler(friendController.acceptRequest));
friendRouter.patch("/requests/:id/decline", asyncHandler(friendController.declineRequest));
friendRouter.delete("/requests/:id", asyncHandler(friendController.cancelRequest));

// ── Friendship management ─────────────────────────────────────────────────────

friendRouter.get("/", asyncHandler(friendController.getFriends));
friendRouter.delete("/:id", asyncHandler(friendController.removeFriend));

export default friendRouter;
