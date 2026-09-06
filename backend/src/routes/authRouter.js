import { Router } from "express";
import { register, login, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, getMe);

export default authRouter;
