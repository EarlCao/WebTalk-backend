import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { UserController } from "./user.controller";

const router = Router();
const userController = new UserController();

// All user routes require a valid JWT
router.get("/me", authMiddleware, userController.getProfile);
router.patch("/me", authMiddleware, userController.updateProfile);
router.delete("/me", authMiddleware, userController.deleteAccount);
router.get("/", authMiddleware, userController.searchUsers);
router.get("/:id", authMiddleware, userController.getUserById);

export const userRoutes = router;
