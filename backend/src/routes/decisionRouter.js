import { Router } from "express";
import { createDecision } from "../controllers/decisionController.js";
const decisionRouter = Router();

decisionRouter.post("/create", createDecision);

export default decisionRouter
