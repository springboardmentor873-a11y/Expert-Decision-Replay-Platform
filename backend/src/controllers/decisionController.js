import prisma from "../db/prisma.js"

const createDecision = async (req, res) => {
  const { title, problemStatement } = req.body;
  if (!title || !problemStatement) {
    return res.status(400).json({
      message: "Both fields required"
    });
  }
  const decision = await prisma.decision.create({
    data:{
        title,
        problemStatement,
        createdById : req.user.userId
    }
  })
  res.status(201).json({
    message: "Data recieved",
    decision
  })
};

export { createDecision };
