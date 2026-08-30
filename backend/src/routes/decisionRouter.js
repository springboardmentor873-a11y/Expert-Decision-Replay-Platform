import { Router } from "express";
import { createDecision } from "../controllers/decisionController.js";
const decisionRouter = Router();

decisionRouter.post("/", createDecision);

export default decisionRouter
