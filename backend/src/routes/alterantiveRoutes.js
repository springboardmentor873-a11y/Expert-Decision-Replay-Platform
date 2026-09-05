import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createAlternative,
  getAlternative,
  updateAlternative,
  deleteAlternative
} from "../controllers/alternativeController.js";

const alternativeRouter = Router();

alternativeRouter.post(
  "/:decisionId/alternatives",
  authMiddleware,
  createAlternative,
);
alternativeRouter.get("/:decisionId/alternatives", getAlternative);
alternativeRouter.patch(
  "/:decisionId/alternatives/:alternativeId",
  authMiddleware,
  updateAlternative,
);
alternativeRouter.delete(
  "/:decisionId/alternatives/:alternativeId",
  authMiddleware,
  deleteAlternative,
);

export default alternativeRouter;
