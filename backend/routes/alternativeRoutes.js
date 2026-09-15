const express = require("express");
const router = express.Router();

const Alternative = require("../models/Alternative");
const authMiddleware = require("../middleware/authMiddleware");

// Create an alternative
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      decision,
      cost,
      performance,
      scalability,
      risk,
    } = req.body;

    if (!name || !decision) {
      return res.status(400).json({
        message: "Alternative name and decision are required",
      });
    }

    const alternative = await Alternative.create({
      name,
      description,
      decision,
      cost,
      performance,
      scalability,
      risk,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Alternative created successfully",
      alternative,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create alternative",
    });
  }
});

// Get alternatives for a decision
router.get("/decision/:decisionId", authMiddleware, async (req, res) => {
  try {
    const alternatives = await Alternative.find({
      decision: req.params.decisionId,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(alternatives);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch alternatives",
    });
  }
});

// Delete an alternative
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const alternative = await Alternative.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!alternative) {
      return res.status(404).json({
        message: "Alternative not found or you cannot delete it",
      });
    }

    await alternative.deleteOne();

    res.json({
      message: "Alternative deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete alternative",
    });
  }
});

module.exports = router;