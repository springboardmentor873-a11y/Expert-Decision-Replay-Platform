import prisma from "../db/prisma.js";

const VALID_STATUSES = [
  "Draft",
  "UnderReview",
  "Approved",
  "Rejected",
  "Archived",
];

const getUserId = (req) => req.user?.userId;

const parseDecisionId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const getOwnedDecision = async (decisionId, userId) => {
  const id = parseDecisionId(decisionId);

  if (!id || !userId) {
    return null;
  }

  return prisma.decision.findFirst({
    where: {
      id,
      createdById: userId,
    },
  });
};

const createDecision = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { title, problemStatement, status = "Draft" } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: "Decision title is required",
      });
    }

    if (!problemStatement?.trim()) {
      return res.status(400).json({
        message: "Problem statement is required",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid decision status",
        validStatuses: VALID_STATUSES,
      });
    }

    const decision = await prisma.decision.create({
      data: {
        title: title.trim(),
        problemStatement: problemStatement.trim(),
        status,
        createdById: userId,
      },
      include: {
        createdBy: true,
        alternatives: true,
      },
    });

    return res.status(201).json({
      message: "Decision created successfully",
      decision,
    });
  } catch (error) {
    console.error("Create decision error:", error);

    return res.status(500).json({
      message: "Failed to create decision",
    });
  }
};

const getDecisions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decisions = await prisma.decision.findMany({
      include: {
        createdBy: true,
        alternatives: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      decisions,
    });
  } catch (error) {
    console.error("Get decisions error:", error);

    return res.status(500).json({
      message: "Failed to fetch decisions",
    });
  }
};

const getDecisionById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const decisionId = parseDecisionId(req.params.decisionId);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!decisionId) {
      return res.status(400).json({
        message: "Invalid decision ID",
      });
    }

    const decision = await prisma.decision.findFirst({
      where: {
        id: decisionId,
      },
      include: {
        createdBy: true,
        alternatives: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    return res.status(200).json({
      decision,
    });
  } catch (error) {
    console.error("Get decision error:", error);

    return res.status(500).json({
      message: "Failed to fetch decision",
    });
  }
};

const updateDecision = async (req, res) => {
  try {
    const userId = getUserId(req);
    const decisionId = parseDecisionId(req.params.decisionId);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!decisionId) {
      return res.status(400).json({
        message: "Invalid decision ID",
      });
    }

    const existingDecision = await getOwnedDecision(decisionId, userId);

    if (!existingDecision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const { title, problemStatement, status } = req.body;

    const data = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Decision title cannot be empty",
        });
      }

      data.title = title.trim();
    }

    if (problemStatement !== undefined) {
      if (!problemStatement.trim()) {
        return res.status(400).json({
          message: "Problem statement cannot be empty",
        });
      }

      data.problemStatement = problemStatement.trim();
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid decision status",
          validStatuses: VALID_STATUSES,
        });
      }

      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "No changes provided",
      });
    }

    const decision = await prisma.decision.update({
      where: {
        id: existingDecision.id,
      },
      data,
      include: {
        createdBy: true,
        alternatives: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return res.status(200).json({
      message: "Decision updated successfully",
      decision,
    });
  } catch (error) {
    console.error("Update decision error:", error);

    return res.status(500).json({
      message: "Failed to update decision",
    });
  }
};

const deleteDecision = async (req, res) => {
  try {
    const userId = getUserId(req);
    const decisionId = parseDecisionId(req.params.decisionId);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!decisionId) {
      return res.status(400).json({
        message: "Invalid decision ID",
      });
    }

    const existingDecision = await getOwnedDecision(decisionId, userId);

    if (!existingDecision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    await prisma.decision.delete({
      where: {
        id: existingDecision.id,
      },
    });

    return res.status(200).json({
      message: "Decision deleted successfully",
    });
  } catch (error) {
    console.error("Delete decision error:", error);

    return res.status(500).json({
      message: "Failed to delete decision",
    });
  }
};

export {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
};
