import { Router } from "express";

import {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
} from "../controllers/decisionController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const decisionRouter = Router();

decisionRouter.get("/", authMiddleware, getDecisions);
decisionRouter.get("/:decisionId", authMiddleware, getDecisionById);
decisionRouter.post("/", authMiddleware, createDecision);
decisionRouter.patch("/:decisionId", authMiddleware, updateDecision);
decisionRouter.delete("/:decisionId", authMiddleware, deleteDecision);

export default decisionRouter;
