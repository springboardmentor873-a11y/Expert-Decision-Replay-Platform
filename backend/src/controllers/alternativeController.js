import prisma from "../db/prisma.js";

const createAlternative = async (req, res) => {
  try {
    const { name, pros, cons, cost, feasibility, risk } = req.body;
    const { decisionId } = req.params;

    if (!name) {
      return res.status(400).json({
        message: "Alternative name is required",
      });
    }

    const alternative = await prisma.alternative.create({
      data: {
        name,
        pros,
        cons,
        cost,
        feasibility,
        risk,
        decisionId: Number(decisionId),
      },
    });

    res.status(201).json(alternative);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create alternative",
    });
  }
};

const getAlternative = async (req, res) => {
  try {
    const { decisionId } = req.params;

    const alternatives = await prisma.alternative.findMany({
      where: {
        decisionId: Number(decisionId),
      },
    });
    res.status(200).json(alternatives);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch alternatives",
    });
  }
};

const updateAlternative = async (req, res) => {
  try {
    const { alternativeId } = req.params;
    const { name, pros, cons, cost, feasibility, risk } = req.body;

    const data = {};

    if (name !== undefined) data.name = name;
    if (pros !== undefined) data.pros = pros;
    if (cons !== undefined) data.cons = cons;
    if (cost !== undefined) data.cost = cost;
    if (feasibility !== undefined) data.feasibility = feasibility;
    if (risk !== undefined) data.risk = risk;

    const alternative = await prisma.alternative.update({
      where: {
        id: Number(alternativeId),
      },
      data,
    });

    res.status(200).json(alternative);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update alternative",
    });
  }
};

const deleteAlternative = async (req, res) => {
  try {
    const { alternativeId } = req.params;

    await prisma.alternative.delete({
      where: {
        id: Number(alternativeId),
      },
    });

    res.status(200).json({
      message: "Alternative deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete alternative",
    });
  }
};

export { createAlternative, getAlternative, updateAlternative, deleteAlternative };
