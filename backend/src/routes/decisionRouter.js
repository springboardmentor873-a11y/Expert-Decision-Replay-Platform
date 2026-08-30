import { Router } from "express";
import { createDecision } from "../controllers/decisionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const decisionRouter = Router();

decisionRouter.post("/", authMiddleware, createDecision);

export default decisionRouter
