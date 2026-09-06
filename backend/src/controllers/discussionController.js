import prisma from "../db/prisma.js";

const discussionInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  attachments: true,
};

const createDiscussion = async (req, res) => {
  try {
    const { decisionId } = req.params;
    const { content, type = "Comment", parentId = null } = req.body;

    const parsedDecisionId = Number(decisionId);
    const parsedParentId = parentId ? Number(parentId) : null;

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Discussion content is required",
      });
    }

    const decision = await prisma.decision.findUnique({
      where: {
        id: parsedDecisionId,
      },
      select: {
        id: true,
      },
    });

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    if (parsedParentId) {
      const parent = await prisma.discussion.findFirst({
        where: {
          id: parsedParentId,
          decisionId: parsedDecisionId,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        return res.status(400).json({
          message: "Parent discussion not found for this decision",
        });
      }
    }

    const discussion = await prisma.discussion.create({
      data: {
        content: content.trim(),
        type,
        decisionId: parsedDecisionId,
        createdById: req.user.userId,
        parentId: parsedParentId,
      },
      include: discussionInclude,
    });

    return res.status(201).json({
      discussion,
    });
  } catch (error) {
    console.error("Create discussion error:", error);

    return res.status(500).json({
      message: "Failed to create discussion",
    });
  }
};

const getDiscussions = async (req, res) => {
  try {
    const { decisionId } = req.params;

    const discussions = await prisma.discussion.findMany({
      where: {
        decisionId: Number(decisionId),
      },
      orderBy: {
        createdAt: "asc",
      },
      include: discussionInclude,
    });

    return res.status(200).json({
      discussions,
    });
  } catch (error) {
    console.error("Get discussions error:", error);

    return res.status(500).json({
      message: "Failed to fetch discussions",
    });
  }
};

const updateDiscussion = async (req, res) => {
  try {
    const { decisionId, discussionId } = req.params;
    const parsedDiscussionId = Number(discussionId);

    const { content, type } = req.body;

    const existing = await prisma.discussion.findFirst({
      where: {
        id: parsedDiscussionId,
        decisionId: Number(decisionId),
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Discussion not found",
      });
    }

    const data = {};

    if (content !== undefined) {
      data.content = content.trim();
    }

    if (type !== undefined) {
      data.type = type;
    }

    const discussion = await prisma.discussion.update({
      where: {
        id: parsedDiscussionId,
      },
      data,
      include: discussionInclude,
    });

    return res.status(200).json({
      discussion,
    });
  } catch (error) {
    console.error("Update discussion error:", error);

    return res.status(500).json({
      message: "Failed to update discussion",
    });
  }
};

const deleteDiscussion = async (req, res) => {
  try {
    const { decisionId, discussionId } = req.params;
    const parsedDiscussionId = Number(discussionId);

    const existing = await prisma.discussion.findFirst({
      where: {
        id: parsedDiscussionId,
        decisionId: Number(decisionId),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Discussion not found",
      });
    }

    await prisma.discussion.delete({
      where: {
        id: parsedDiscussionId,
      },
    });

    return res.status(200).json({
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    console.error("Delete discussion error:", error);

    return res.status(500).json({
      message: "Failed to delete discussion",
    });
  }
};

const uploadDiscussionAttachment = async (req, res) => {
  try {
    const { discussionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const discussion = await prisma.discussion.findUnique({
      where: {
        id: Number(discussionId),
      },
      select: {
        id: true,
      },
    });

    if (!discussion) {
      return res.status(404).json({
        message: "Discussion not found",
      });
    }

    const attachment = await prisma.discussionAttachment.create({
      data: {
        filename: req.file.originalname,
        filePath: req.file.path,
        discussionId: Number(discussionId),
      },
    });

    return res.status(201).json({
      attachment,
    });
  } catch (error) {
    console.error("Upload discussion attachment error:", error);

    return res.status(500).json({
      message: "Failed to upload discussion attachment",
    });
  }
};

export {
  createDiscussion,
  getDiscussions,
  updateDiscussion,
  deleteDiscussion,
  uploadDiscussionAttachment,
};
