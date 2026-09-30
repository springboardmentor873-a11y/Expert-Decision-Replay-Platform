const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const Decision = require("../models/Decision");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// GET AUDIT HISTORY FOR ONE DECISION
// =====================================================

router.get(
  "/decision/:decisionId",
  authMiddleware,
  async (req, res) => {
    try {
      const { decisionId } = req.params;

      const decision = await Decision.findById(decisionId);

      if (!decision) {
        return res.status(404).json({
          message: "Decision not found",
        });
      }

      const logs = await AuditLog.find({
        decision: decisionId,
      })
        .populate("performedBy", "name email role")
        .populate("decision", "title status")
        .sort({ createdAt: 1 });

      res.status(200).json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);

      res.status(500).json({
        message: "Failed to fetch audit logs",
      });
    }
  }
);

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("performedBy", "name email role")
      .populate("decision", "title status")
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Get all audit logs error:", error);

    res.status(500).json({
      message: "Failed to fetch audit logs",
    });
  }
});

module.exports = router;