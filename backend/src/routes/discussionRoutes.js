import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createDiscussion,
  getDiscussions,
  updateDiscussion,
  deleteDiscussion,
  uploadDiscussionAttachment,
} from "../controllers/discussionController.js";

const discussionRouter = Router();

discussionRouter.get(
  "/decisions/:decisionId/discussions",
  authMiddleware,
  getDiscussions,
);

discussionRouter.post(
  "/decisions/:decisionId/discussions",
  authMiddleware,
  createDiscussion,
);

discussionRouter.patch(
  "/decisions/:decisionId/discussions/:discussionId",
  authMiddleware,
  updateDiscussion,
);

discussionRouter.delete(
  "/decisions/:decisionId/discussions/:discussionId",
  authMiddleware,
  deleteDiscussion,
);

discussionRouter.post(
  "/discussions/:discussionId/attachments",
  authMiddleware,
  upload.single("file"),
  uploadDiscussionAttachment,
);

export default discussionRouter;
