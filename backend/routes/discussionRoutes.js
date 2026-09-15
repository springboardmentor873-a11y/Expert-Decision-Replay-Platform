const express = require("express");
const router = express.Router();

const Discussion = require("../models/Discussion");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CREATE A DISCUSSION MESSAGE
// All authenticated users can participate
// =====================================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message, decision } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Discussion message is required",
      });
    }

    if (!decision) {
      return res.status(400).json({
        message: "Decision ID is required",
      });
    }

    const discussion = await Discussion.create({
      message: message.trim(),
      createdBy: req.user.id,
      decision,
    });

    const populatedDiscussion = await discussion.populate(
      "createdBy",
      "name email role"
    );

    res.status(201).json({
      message: "Discussion created successfully",
      discussion: populatedDiscussion,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create discussion",
    });
  }
});

// =====================================================
// GET ALL DISCUSSIONS
// =====================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("createdBy", "name email role")
      .populate("decision", "title")
      .sort({ createdAt: 1 });

    res.status(200).json(discussions);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch discussions",
    });
  }
});

// =====================================================
// GET DISCUSSIONS FOR A SPECIFIC DECISION
// All roles can view the discussion
// =====================================================
router.get("/decision/:decisionId", authMiddleware, async (req, res) => {
  try {
    const discussions = await Discussion.find({
      decision: req.params.decisionId,
    })
      .populate("createdBy", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json(discussions);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch decision discussions",
    });
  }
});

// =====================================================
// DELETE OWN DISCUSSION MESSAGE
// =====================================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const discussion = await Discussion.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!discussion) {
      return res.status(404).json({
        message: "Discussion not found or you cannot delete it",
      });
    }

    await discussion.deleteOne();

    res.json({
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete discussion",
    });
  }
});

module.exports = router;