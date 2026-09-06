import prisma from "../db/prisma.js";


//Helpers


const parseId = (value) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const getOwnedDecision = async (decisionId, userId) => {
  const id = parseId(decisionId);

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


//CREATE ALTERNATIVE


const createAlternative = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const decisionId = parseId(req.params.decisionId);

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

    const {
      name,
      pros = "",
      cons = "",
      cost = "",
      feasibility = "",
      risk = "",
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Alternative name is required",
      });
    }

    const decision = await getOwnedDecision(decisionId, userId);

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


//GET ALTERNATIVES


const getAlternative = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const decisionId = parseId(req.params.decisionId);

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

    const decision = await getOwnedDecision(decisionId, userId);

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


//UPDATE ALTERNATIVE


const updateAlternative = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const decisionId = parseId(req.params.decisionId);
    const alternativeId = parseId(req.params.alternativeId);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!decisionId || !alternativeId) {
      return res.status(400).json({
        message: "Invalid decision or alternative ID",
      });
    }

    const decision = await getOwnedDecision(decisionId, userId);

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const existingAlternative = await prisma.alternative.findFirst({
      where: {
        id: alternativeId,
        decisionId: decision.id,
      },
    });

    if (!existingAlternative) {
      return res.status(404).json({
        message: "Alternative not found",
      });
    }

    const { name, pros, cons, cost, feasibility, risk } = req.body;

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Alternative name cannot be empty",
        });
      }

      data.name = name.trim();
    }

    if (pros !== undefined) {
      data.pros = pros;
    }

    if (cons !== undefined) {
      data.cons = cons;
    }

    if (cost !== undefined) {
      data.cost = cost;
    }

    if (feasibility !== undefined) {
      data.feasibility = feasibility;
    }

    if (risk !== undefined) {
      data.risk = risk;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "No changes provided",
      });
    }

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


//DELETE ALTERNATIVE


const deleteAlternative = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const decisionId = parseId(req.params.decisionId);
    const alternativeId = parseId(req.params.alternativeId);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!decisionId || !alternativeId) {
      return res.status(400).json({
        message: "Invalid decision or alternative ID",
      });
    }

    const decision = await getOwnedDecision(decisionId, userId);

    if (!decision) {
      return res.status(404).json({
        message: "Decision not found",
      });
    }

    const existingAlternative = await prisma.alternative.findFirst({
      where: {
        id: alternativeId,
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
