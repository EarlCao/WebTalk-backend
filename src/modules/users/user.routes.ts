import { Router } from "express";

import { authMiddleware } from "../../common/middleware/auth.middleware";
import { asyncHandler } from "../../common/utils/async.handler";
import { userController } from "./user.controller";

const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.get("/me", asyncHandler(userController.getProfile));
userRouter.patch("/me", asyncHandler(userController.updateProfile));
userRouter.delete("/me", asyncHandler(userController.deleteAccount));
userRouter.get("/", asyncHandler(userController.searchUsers));
userRouter.get("/:id", asyncHandler(userController.getUserById));

export default userRouter;
