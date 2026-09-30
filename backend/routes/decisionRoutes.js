const express = require("express");
const router = express.Router();

const Decision = require("../models/Decision");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// =====================================================
// HELPER - CREATE AUDIT LOG
// =====================================================

const createAuditLog = async ({
  decision,
  action,
  performedBy,
  previousStatus = null,
  newStatus = null,
  details = "",
}) => {
  try {
    await AuditLog.create({
      decision,
      action,
      performedBy,
      previousStatus,
      newStatus,
      details,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// =====================================================
// HELPER - CREATE NOTIFICATION
// =====================================================

const createNotification = async ({
  recipient,
  decision,
  type,
  message,
}) => {
  try {
    await Notification.create({
      recipient,
      decision,
      type,
      message,
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
};

// =====================================================
// HELPER - GET DECISIONS WITH DOCUMENTS
// =====================================================

const getDecisionsWithDocuments = async (decisions) => {
  return await Promise.all(
    decisions.map(async (decision) => {
      const documents = await Document.find({
        decision: decision._id,
      }).sort({
        createdAt: -1,
      });

      return {
        ...decision.toObject(),
        documents,
      };
    })
  );
};

// =====================================================
// GET ALL DECISIONS
// GET /api/decisions
//
// USED BY:
// - Knowledge Repository
// - Knowledge Graph
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const decisions = await Decision.find()
      .populate("createdBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({
        createdAt: -1,
      });

    const decisionsWithDocuments =
      await getDecisionsWithDocuments(decisions);

    return res.status(200).json(decisionsWithDocuments);
  } catch (error) {
    console.error("Get all decisions error:", error);

    return res.status(500).json({
      message: "Failed to fetch all decisions",
    });
  }
});

// =====================================================
// GET ALL DECISIONS FOR KNOWLEDGE GRAPH
// GET /api/decisions/all
//
// THIS IS THE ENDPOINT USED BY loadAllDecisions()
// =====================================================

router.get("/all", authMiddleware, async (req, res) => {
  try {
    const decisions = await Decision.find()
      .populate("createdBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({
        createdAt: -1,
      });

    const decisionsWithDocuments =
      await getDecisionsWithDocuments(decisions);

    return res.status(200).json({
      decisions: decisionsWithDocuments,
    });
  } catch (error) {
    console.error(
      "Knowledge graph decisions error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch decisions for knowledge graph",
    });
  }
});

// =====================================================
// CREATE NEW DECISION
// POST /api/decisions
// =====================================================

router.post(
  "/",
  authMiddleware,
  upload.array("documents", 10),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
      } = req.body;

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (!title || !description) {
        return res.status(400).json({
          message: "Title and description are required",
        });
      }

      // -------------------------------------------------
      // CREATE DECISION
      // -------------------------------------------------

      const decision = await Decision.create({
        title,
        description,
        category: category || "General",
        createdBy: req.user.id,
        status: "Pending Review",
      });

      // -------------------------------------------------
      // SAVE DOCUMENTS
      // -------------------------------------------------

      if (req.files && req.files.length > 0) {
        const documents = req.files.map((file) => ({
          decision: decision._id,
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          uploadedBy: req.user.id,
        }));

        await Document.insertMany(documents);
      }

      // -------------------------------------------------
      // CREATE AUDIT LOG
      // -------------------------------------------------

      await createAuditLog({
        decision: decision._id,
        action: "Decision Created",
        performedBy: req.user.id,
        previousStatus: null,
        newStatus: "Pending Review",
        details: "Decision created by employee.",
      });

      // -------------------------------------------------
      // NOTIFY REVIEWERS
      // -------------------------------------------------

      const reviewers = await User.find({
        role: "Reviewer",
      });

      for (const reviewer of reviewers) {
        await createNotification({
          recipient: reviewer._id,
          decision: decision._id,
          type: "Decision Created",
          message: `A new decision "${decision.title}" is waiting for your review.`,
        });
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

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
  }
);

// =====================================================
// GET MY DECISIONS
// GET /api/decisions/my-decisions
// =====================================================

router.get(
  "/my-decisions",
  authMiddleware,
  async (req, res) => {
    try {
      const decisions = await Decision.find({
        createdBy: req.user.id,
      })
        .populate("createdBy", "name email role")
        .populate("reviewedBy", "name email role")
        .populate("approvedBy", "name email role")
        .sort({
          createdAt: -1,
        });

      const decisionsWithDocuments =
        await getDecisionsWithDocuments(decisions);

      return res.status(200).json(
        decisionsWithDocuments
      );
    } catch (error) {
      console.error(
        "Get my decisions error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch decisions",
      });
    }
  }
);

// =====================================================
// SEARCH DECISIONS
// GET /api/decisions/search
// =====================================================

router.get(
  "/search",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        query,
        category,
      } = req.query;

      const searchText = query
        ? query.trim()
        : "";

      const searchConditions = [];

      // -------------------------------------------------
      // SEARCH TITLE OR DESCRIPTION
      // -------------------------------------------------

      if (searchText) {
        searchConditions.push({
          $or: [
            {
              title: {
                $regex: searchText,
                $options: "i",
              },
            },
            {
              description: {
                $regex: searchText,
                $options: "i",
              },
            },
          ],
        });
      }

      // -------------------------------------------------
      // CATEGORY FILTER
      // -------------------------------------------------

      if (
        category &&
        category !== "All"
      ) {
        searchConditions.push({
          category: category,
        });
      }

      // -------------------------------------------------
      // GET DECISIONS
      // -------------------------------------------------

      const decisions = await Decision.find(
        searchConditions.length > 0
          ? {
              $and: searchConditions,
            }
          : {}
      )
        .populate("createdBy", "name email role")
        .populate("reviewedBy", "name email role")
        .populate("approvedBy", "name email role")
        .sort({
          createdAt: -1,
        });

      const decisionsWithDocuments =
        await getDecisionsWithDocuments(decisions);

      return res.status(200).json({
        query: searchText,
        category: category || "All",
        count: decisionsWithDocuments.length,
        decisions: decisionsWithDocuments,
      });
    } catch (error) {
      console.error(
        "Search decisions error:",
        error
      );

      return res.status(500).json({
        message: "Failed to search decisions",
      });
    }
  }
);

// =====================================================
// GET DECISION ANALYTICS
// GET /api/decisions/analytics
// =====================================================

router.get(
  "/analytics",
  authMiddleware,
  async (req, res) => {
    try {
      const decisions = await Decision.find()
        .populate("createdBy", "name email role")
        .populate("reviewedBy", "name email role")
        .populate("approvedBy", "name email role");

      // -------------------------------------------------
      // BASIC COUNTS
      // -------------------------------------------------

      const totalDecisions = decisions.length;

      const pendingReview = decisions.filter(
        (decision) =>
          decision.status === "Pending Review"
      ).length;

      const underReview = decisions.filter(
        (decision) =>
          decision.status === "Under Review"
      ).length;

      const approved = decisions.filter(
        (decision) =>
          decision.status === "Approved"
      ).length;

      const rejected = decisions.filter(
        (decision) =>
          decision.status === "Rejected"
      ).length;

      const completedDecisions =
        approved + rejected;

      const approvalRate =
        completedDecisions > 0
          ? Math.round(
              (approved /
                completedDecisions) *
                100
            )
          : 0;

      // -------------------------------------------------
      // MONTHLY DECISIONS
      // -------------------------------------------------

      const monthlyMap = {};

      decisions.forEach((decision) => {
        const date = new Date(
          decision.createdAt
        );

        const month = date.toLocaleString(
          "default",
          {
            month: "short",
          }
        );

        if (!monthlyMap[month]) {
          monthlyMap[month] = 0;
        }

        monthlyMap[month]++;
      });

      const monthlyDecisions =
        Object.entries(monthlyMap).map(
          ([month, count]) => ({
            month,
            count,
          })
        );

      // -------------------------------------------------
      // REVIEWER DATA
      // -------------------------------------------------

      const reviewerMap = {};

      decisions.forEach((decision) => {
        if (decision.reviewedBy) {
          const reviewerName =
            decision.reviewedBy.name ||
            decision.reviewedBy.email;

          if (!reviewerMap[reviewerName]) {
            reviewerMap[reviewerName] = 0;
          }

          reviewerMap[reviewerName]++;
        }
      });

      const reviewerData =
        Object.entries(reviewerMap).map(
          ([name, count]) => ({
            name,
            count,
          })
        );

      // -------------------------------------------------
      // MANAGER DATA
      // -------------------------------------------------

      const managerMap = {};

      decisions.forEach((decision) => {
        if (decision.approvedBy) {
          const managerName =
            decision.approvedBy.name ||
            decision.approvedBy.email;

          if (!managerMap[managerName]) {
            managerMap[managerName] = 0;
          }

          managerMap[managerName]++;
        }
      });

      const managerData =
        Object.entries(managerMap).map(
          ([name, count]) => ({
            name,
            count,
          })
        );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        summary: {
          totalDecisions,
          pendingReview,
          underReview,
          approved,
          rejected,
          approvalRate,
        },

        statusDistribution: [
          {
            name: "Pending Review",
            value: pendingReview,
          },
          {
            name: "Under Review",
            value: underReview,
          },
          {
            name: "Approved",
            value: approved,
          },
          {
            name: "Rejected",
            value: rejected,
          },
        ],

        monthlyDecisions,

        reviewerData,

        managerData,
      });
    } catch (error) {
      console.error(
        "Analytics error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch analytics",
      });
    }
  }
);

// =====================================================
// GET DECISIONS WAITING FOR REVIEW
// GET /api/decisions/review
// REVIEWER ONLY
// =====================================================

router.get(
  "/review",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Reviewer") {
        return res.status(403).json({
          message:
            "Only reviewers can access this section",
        });
      }

      const decisions = await Decision.find({
        status: "Pending Review",
      })
        .populate("createdBy", "name email role")
        .populate("reviewedBy", "name email role")
        .sort({
          createdAt: -1,
        });

      const decisionsWithDocuments =
        await getDecisionsWithDocuments(decisions);

      return res.status(200).json(
        decisionsWithDocuments
      );
    } catch (error) {
      console.error(
        "Get review decisions error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch review decisions",
      });
    }
  }
);

// =====================================================
// REVIEW DECISION
// PUT /api/decisions/:id/review
// REVIEWER ONLY
// =====================================================

router.put(
  "/:id/review",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Reviewer") {
        return res.status(403).json({
          message:
            "Only reviewers can review decisions",
        });
      }

      const {
        reviewerFeedback,
      } = req.body;

      const decision =
        await Decision.findById(
          req.params.id
        );

      if (!decision) {
        return res.status(404).json({
          message: "Decision not found",
        });
      }

      // -------------------------------------------------
      // PREVENT SELF REVIEW
      // -------------------------------------------------

      if (
        decision.createdBy.toString() ===
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You cannot review your own decision",
        });
      }

      // -------------------------------------------------
      // CHECK STATUS
      // -------------------------------------------------

      if (
        decision.status !==
        "Pending Review"
      ) {
        return res.status(400).json({
          message:
            "This decision is not pending review",
        });
      }

      const previousStatus =
        decision.status;

      decision.reviewerFeedback =
        reviewerFeedback || "";

      decision.reviewedBy =
        req.user.id;

      decision.status =
        "Under Review";

      await decision.save();

      // -------------------------------------------------
      // AUDIT LOG
      // -------------------------------------------------

      await createAuditLog({
        decision: decision._id,
        action: "Decision Reviewed",
        performedBy: req.user.id,
        previousStatus,
        newStatus: "Under Review",
        details:
          reviewerFeedback ||
          "Decision reviewed by reviewer.",
      });

      // -------------------------------------------------
      // NOTIFY MANAGERS
      // -------------------------------------------------

      const managers =
        await User.find({
          role: "Manager",
        });

      for (const manager of managers) {
        await createNotification({
          recipient: manager._id,
          decision: decision._id,
          type: "Decision Reviewed",
          message: `Decision "${decision.title}" has been reviewed and is ready for your review.`,
        });
      }

      // -------------------------------------------------
      // GET DOCUMENTS
      // -------------------------------------------------

      const documents =
        await Document.find({
          decision: decision._id,
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json({
        message:
          "Decision reviewed successfully",

        decision: {
          ...decision.toObject(),
          documents,
        },
      });
    } catch (error) {
      console.error(
        "Review decision error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to review decision",
      });
    }
  }
);

// =====================================================
// GET DECISIONS WAITING FOR MANAGER APPROVAL
// GET /api/decisions/manager
// MANAGER ONLY
// =====================================================

router.get(
  "/manager",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Manager") {
        return res.status(403).json({
          message:
            "Only managers can access this section",
        });
      }

      const decisions =
        await Decision.find({
          status: "Under Review",
        })
          .populate(
            "createdBy",
            "name email role"
          )
          .populate(
            "reviewedBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          });

      const decisionsWithDocuments =
        await getDecisionsWithDocuments(
          decisions
        );

      return res.status(200).json(
        decisionsWithDocuments
      );
    } catch (error) {
      console.error(
        "Get manager decisions error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch manager decisions",
      });
    }
  }
);

// =====================================================
// MANAGER APPROVE / REJECT DECISION
// PUT /api/decisions/:id/manager
// MANAGER ONLY
// =====================================================

router.put(
  "/:id/manager",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "Manager") {
        return res.status(403).json({
          message:
            "Only managers can approve or reject decisions",
        });
      }

      const {
        status,
        managerFeedback,
      } = req.body;

      // -------------------------------------------------
      // VALIDATE STATUS
      // -------------------------------------------------

      if (
        status !== "Approved" &&
        status !== "Rejected"
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected",
        });
      }

      // -------------------------------------------------
      // FIND DECISION
      // -------------------------------------------------

      const decision =
        await Decision.findById(
          req.params.id
        );

      if (!decision) {
        return res.status(404).json({
          message:
            "Decision not found",
        });
      }

      // -------------------------------------------------
      // PREVENT SELF APPROVAL
      // -------------------------------------------------

      if (
        decision.createdBy.toString() ===
        req.user.id.toString()
      ) {
        return res.status(403).json({
          message:
            "You cannot approve or reject your own decision",
        });
      }

      // -------------------------------------------------
      // CHECK STATUS
      // -------------------------------------------------

      if (
        decision.status !==
        "Under Review"
      ) {
        return res.status(400).json({
          message:
            "This decision is not ready for manager review",
        });
      }

      const previousStatus =
        decision.status;

      // -------------------------------------------------
      // UPDATE DECISION
      // -------------------------------------------------

      decision.managerFeedback =
        managerFeedback || "";

      decision.approvedBy =
        req.user.id;

      decision.status =
        status;

      await decision.save();

      // -------------------------------------------------
      // AUDIT LOG
      // -------------------------------------------------

      await createAuditLog({
        decision: decision._id,

        action:
          status === "Approved"
            ? "Decision Approved"
            : "Decision Rejected",

        performedBy: req.user.id,

        previousStatus,

        newStatus: status,

        details:
          managerFeedback ||
          `Decision ${status.toLowerCase()} by manager.`,
      });

      // -------------------------------------------------
      // NOTIFY EMPLOYEE
      // -------------------------------------------------

      await createNotification({
        recipient:
          decision.createdBy,

        decision:
          decision._id,

        type:
          status === "Approved"
            ? "Decision Approved"
            : "Decision Rejected",

        message:
          status === "Approved"
            ? `Your decision "${decision.title}" has been approved by the manager.`
            : `Your decision "${decision.title}" has been rejected by the manager.`,
      });

      // -------------------------------------------------
      // GET DOCUMENTS
      // -------------------------------------------------

      const documents =
        await Document.find({
          decision: decision._id,
        }).sort({
          createdAt: -1,
        });

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        message:
          status === "Approved"
            ? "Decision approved successfully"
            : "Decision rejected successfully",

        decision: {
          ...decision.toObject(),
          documents,
        },
      });
    } catch (error) {
      console.error(
        "Manager decision error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to process manager decision",
      });
    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;