import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  getDocuments,
} from "../controllers/documentController.js";

const documentRouter = Router();

documentRouter.post(
  "/:decisionId/documents",
  authMiddleware,
  upload.single("file"),
  uploadDocument,
);

documentRouter.get("/:decisionId/documents", authMiddleware, getDocuments);

export default documentRouter;
