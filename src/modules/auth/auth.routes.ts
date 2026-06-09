import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { AuthController } from "./auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);

export const authRoutes = router;
