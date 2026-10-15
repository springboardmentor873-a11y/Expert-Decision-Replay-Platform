const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const Decision = require("../models/Decision");
const Team = require("../models/Team");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

/*
============================================================
DECISION REPORT
============================================================
GET /api/reports/decisions
*/

router.get("/decisions", protect, async (req, res) => {
  try {
    const decisions = await Decision.find()
      .populate("createdBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ createdAt: -1 });

    const statistics = {
      total: decisions.length,

      pendingReview: decisions.filter(
        (decision) =>
          decision.status === "Pending Review"
      ).length,

      underReview: decisions.filter(
        (decision) =>
          decision.status === "Under Review"
      ).length,

      approved: decisions.filter(
        (decision) =>
          decision.status === "Approved"
      ).length,

      rejected: decisions.filter(
        (decision) =>
          decision.status === "Rejected"
      ).length,
    };

    res.status(200).json({
      success: true,
      reportType: "Decision Report",
      generatedAt: new Date(),
      statistics,
      decisions,
    });
  } catch (error) {
    console.error(
      "Decision Report Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate decision report",
    });
  }
});


/*
============================================================
APPROVAL REPORT
============================================================
GET /api/reports/approvals
*/

router.get("/approvals", protect, async (req, res) => {
  try {
    const decisions = await Decision.find({
      status: {
        $in: [
          "Approved",
          "Rejected",
          "Under Review",
        ],
      },
    })
      .populate("createdBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ updatedAt: -1 });

    const statistics = {
      total: decisions.length,

      approved: decisions.filter(
        (decision) =>
          decision.status === "Approved"
      ).length,

      rejected: decisions.filter(
        (decision) =>
          decision.status === "Rejected"
      ).length,

      underReview: decisions.filter(
        (decision) =>
          decision.status === "Under Review"
      ).length,
    };

    res.status(200).json({
      success: true,
      reportType: "Approval Report",
      generatedAt: new Date(),
      statistics,

      // IMPORTANT:
      // Frontend expects reportData.approvals
      approvals: decisions,
    });
  } catch (error) {
    console.error(
      "Approval Report Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate approval report",
    });
  }
});


/*
============================================================
TEAM REPORT
============================================================
GET /api/reports/teams
*/

router.get("/teams", protect, async (req, res) => {
  try {
    const teams = await Team.find({
      status: "active",
    })
      .populate("manager", "name email role")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    const teamReports = await Promise.all(
      teams.map(async (team) => {
        const memberIds = team.members.map(
          (member) => member._id
        );

        const decisions = await Decision.find({
          createdBy: {
            $in: memberIds,
          },
        });

        return {
          _id: team._id,
          name: team.name,
          description: team.description,
          icon: team.icon,
          status: team.status,

          manager: team.manager,

          memberCount:
            team.members.length,

          members:
            team.members,

          decisionCount:
            decisions.length,

          approved: decisions.filter(
            (decision) =>
              decision.status === "Approved"
          ).length,

          pendingReview: decisions.filter(
            (decision) =>
              decision.status === "Pending Review"
          ).length,

          underReview: decisions.filter(
            (decision) =>
              decision.status === "Under Review"
          ).length,

          rejected: decisions.filter(
            (decision) =>
              decision.status === "Rejected"
          ).length,

          createdAt:
            team.createdAt,
        };
      })
    );

    const statistics = {
      totalTeams:
        teamReports.length,

      totalMembers:
        teamReports.reduce(
          (sum, team) =>
            sum + team.memberCount,
          0
        ),

      totalDecisions:
        teamReports.reduce(
          (sum, team) =>
            sum + team.decisionCount,
          0
        ),

      totalApproved:
        teamReports.reduce(
          (sum, team) =>
            sum + team.approved,
          0
        ),
    };

    res.status(200).json({
      success: true,
      reportType: "Team Report",
      generatedAt: new Date(),
      statistics,
      teams: teamReports,
    });
  } catch (error) {
    console.error(
      "Team Report Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate team report",
    });
  }
});


/*
============================================================
AUDIT REPORT
============================================================
GET /api/reports/audit
*/

router.get("/audit", protect, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate(
        "performedBy",
        "name email role"
      )
      .populate(
        "decision",
        "title category status"
      )
      .sort({ createdAt: -1 });

    const uniqueUsers = new Set(
      logs
        .filter(
          (log) => log.performedBy
        )
        .map(
          (log) =>
            log.performedBy._id.toString()
        )
    );

    const uniqueDecisions = new Set(
      logs
        .filter(
          (log) => log.decision
        )
        .map(
          (log) =>
            log.decision._id.toString()
        )
    );

    res.status(200).json({
      success: true,
      reportType: "Audit Report",
      generatedAt: new Date(),

      summary: {
        totalActions:
          logs.length,

        uniqueUsers:
          uniqueUsers.size,

        uniqueDecisions:
          uniqueDecisions.size,
      },

      logs,
    });
  } catch (error) {
    console.error(
      "Audit Report Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate audit report",
    });
  }
});


module.exports = router;