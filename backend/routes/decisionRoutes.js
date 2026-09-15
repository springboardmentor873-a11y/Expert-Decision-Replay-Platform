const express = require("express");
const router = express.Router();

const Decision = require("../models/Decision");
const Document = require("../models/Document");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// =====================================================
// CREATE A NEW DECISION + OPTIONAL DOCUMENTS
// =====================================================

router.post(
  "/",
  authMiddleware,
  upload.array("documents", 10),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      // Validate title and description
      if (!title || !description) {
        return res.status(400).json({
          message: "Title and description are required",
        });
      }

      // Create decision
      const decision = await Decision.create({
        title,
        description,
        createdBy: req.user.id,
        status: "Pending Review",
      });

      // Documents are OPTIONAL
      let documents = [];

      if (req.files && req.files.length > 0) {
        documents = await Document.insertMany(
          req.files.map((file) => ({
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            uploadedBy: req.user.id,
            decision: decision._id,
          }))
        );
      }

      res.status(201).json({
        message: "Decision created successfully",
        decision,
        documents,
      });
    } catch (error) {
      console.error("Create decision error:", error);

      res.status(500).json({
        message:
          error.message || "Failed to create decision",
      });
    }
  }
);

// =====================================================
// GET DECISIONS CREATED BY LOGGED-IN USER
// =====================================================

router.get(
  "/my-decisions",
  authMiddleware,
  async (req, res) => {
    try {
      const decisions = await Decision.find({
        createdBy: req.user.id,
      }).sort({ createdAt: -1 });

      // Attach documents to every decision
      const decisionsWithDocuments = await Promise.all(
        decisions.map(async (decision) => {
          const documents = await Document.find({
            decision: decision._id,
          }).sort({ createdAt: -1 });

          return {
            ...decision.toObject(),
            documents,
          };
        })
      );

      res.status(200).json(decisionsWithDocuments);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch decisions",
      });
    }
  }
);

// =====================================================
// GET DECISIONS WAITING FOR REVIEWER
// =====================================================

router.get(
  "/review",
  authMiddleware,
  async (req, res) => {
    try {
      const decisions = await Decision.find({
        status: "Pending Review",
      })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

      // Attach documents
      const decisionsWithDocuments = await Promise.all(
        decisions.map(async (decision) => {
          const documents = await Document.find({
            decision: decision._id,
          }).sort({ createdAt: -1 });

          return {
            ...decision.toObject(),
            documents,
          };
        })
      );

      res.status(200).json(decisionsWithDocuments);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch decisions for review",
      });
    }
  }
);

// =====================================================
// REVIEWER SUBMITS FEEDBACK
// =====================================================

router.put(
  "/:id/review",
  authMiddleware,
  async (req, res) => {
    try {
      const { reviewerFeedback } = req.body;

      if (!reviewerFeedback) {
        return res.status(400).json({
          message: "Reviewer feedback is required",
        });
      }

      const decision = await Decision.findById(
        req.params.id
      );

      if (!decision) {
        return res.status(404).json({
          message: "Decision not found",
        });
      }

      decision.reviewerFeedback =
        reviewerFeedback;

      decision.reviewedBy = req.user.id;

      decision.status = "Under Review";

      await decision.save();

      // Get documents associated with this decision
      const documents = await Document.find({
        decision: decision._id,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        message: "Review submitted successfully",

        decision: {
          ...decision.toObject(),
          documents,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to submit review",
      });
    }
  }
);

// =====================================================
// GET DECISIONS READY FOR MANAGER REVIEW
// =====================================================

router.get(
  "/manager",
  authMiddleware,
  async (req, res) => {
    try {
      const decisions = await Decision.find({
        status: "Under Review",
      })
        .populate("createdBy", "name email")
        .populate("reviewedBy", "name email")
        .sort({ updatedAt: -1 });

      // Attach documents to every decision
      const decisionsWithDocuments = await Promise.all(
        decisions.map(async (decision) => {
          const documents = await Document.find({
            decision: decision._id,
          }).sort({ createdAt: -1 });

          return {
            ...decision.toObject(),
            documents,
          };
        })
      );

      res.status(200).json(decisionsWithDocuments);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to fetch decisions for manager",
      });
    }
  }
);

// =====================================================
// MANAGER APPROVES OR REJECTS A DECISION
// =====================================================

router.put(
  "/:id/manager",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        managerFeedback,
        status,
      } = req.body;

      // Validate status
      if (
        status !== "Approved" &&
        status !== "Rejected"
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected",
        });
      }

      const decision = await Decision.findById(
        req.params.id
      );

      if (!decision) {
        return res.status(404).json({
          message: "Decision not found",
        });
      }

      // Update decision
      decision.managerFeedback =
        managerFeedback || "";

      decision.approvedBy = req.user.id;

      decision.status = status;

      await decision.save();

      // Get associated documents
      const documents = await Document.find({
        decision: decision._id,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        message: `Decision ${status.toLowerCase()} successfully`,

        decision: {
          ...decision.toObject(),
          documents,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to update decision",
      });
    }
  }
);

module.exports = router;