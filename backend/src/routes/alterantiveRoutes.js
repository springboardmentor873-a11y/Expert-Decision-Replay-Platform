import { Router } from "express";
import {
  createAlternative,
  getAlternative,
  updateAlternative,
  deleteAlternative,
} from "../controllers/alternativeController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const alternativeRouter = Router();

alternativeRouter.get(
  "/:decisionId/alternatives",
  authMiddleware,
  getAlternative,
);

alternativeRouter.post(
  "/:decisionId/alternatives",
  authMiddleware,
  createAlternative,
);

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
