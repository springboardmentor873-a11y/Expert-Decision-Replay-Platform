import prisma from "../db/prisma.js";

const getOwnedDecision = async (decisionId, userId) => {
  return prisma.decision.findFirst({
    where: {
      id: Number(decisionId),
      createdById: userId,
    },
  });
};

const createAlternative = async (req, res) => {
  try {
    const { name, pros = "", cons = "", cost = "", feasibility = "", risk = "" } = req.body;
    const { decisionId } = req.params;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Alternative name is required",
      });
    }

    const decision = await getOwnedDecision(decisionId, req.user.userId);

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const alternative = await prisma.alternative.create({
      data: {
        name: name.trim(),
        pros,
        cons,
        cost,
        feasibility,
        risk,
        decisionId: decision.id,
      },
    });

    return res.status(201).json(alternative);
  } catch (error) {
    console.error("Create alternative error:", error);

    return res.status(500).json({
      message: "Failed to create alternative",
    });
  }
};

const getAlternative = async (req, res) => {
  try {
    const { decisionId } = req.params;

    const decision = await prisma.decision.findUnique({
      where: { id: Number(decisionId) },
      select: { id: true },
    });

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const alternatives = await prisma.alternative.findMany({
      where: {
        decisionId: decision.id,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json(alternatives);
  } catch (error) {
    console.error("Get alternatives error:", error);

    return res.status(500).json({
      message: "Failed to fetch alternatives",
    });
  }
};

const updateAlternative = async (req, res) => {
  try {
    const { decisionId, alternativeId } = req.params;
    const { name, pros, cons, cost, feasibility, risk } = req.body;

    const decision = await getOwnedDecision(decisionId, req.user.userId);

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const existingAlternative = await prisma.alternative.findFirst({
      where: {
        id: Number(alternativeId),
        decisionId: decision.id,
      },
    });

    if (!existingAlternative) {
      return res.status(404).json({
        message: "Alternative not found",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Alternative name cannot be empty",
        });
      }
      data.name = name.trim();
    }

    if (pros !== undefined) data.pros = pros;
    if (cons !== undefined) data.cons = cons;
    if (cost !== undefined) data.cost = cost;
    if (feasibility !== undefined) data.feasibility = feasibility;
    if (risk !== undefined) data.risk = risk;

    const alternative = await prisma.alternative.update({
      where: {
        id: existingAlternative.id,
      },
      data,
    });

    return res.status(200).json(alternative);
  } catch (error) {
    console.error("Update alternative error:", error);

    return res.status(500).json({
      message: "Failed to update alternative",
    });
  }
};

const deleteAlternative = async (req, res) => {
  try {
    const { decisionId, alternativeId } = req.params;

    const decision = await getOwnedDecision(decisionId, req.user.userId);

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const existingAlternative = await prisma.alternative.findFirst({
      where: {
        id: Number(alternativeId),
        decisionId: decision.id,
      },
    });

    if (!existingAlternative) {
      return res.status(404).json({
        message: "Alternative not found",
      });
    }

    await prisma.alternative.delete({
      where: {
        id: existingAlternative.id,
      },
    });

    return res.status(200).json({
      message: "Alternative deleted successfully",
    });
  } catch (error) {
    console.error("Delete alternative error:", error);

    return res.status(500).json({
      message: "Failed to delete alternative",
    });
  }
};

export {
  createAlternative,
  getAlternative,
  updateAlternative,
  deleteAlternative,
};
