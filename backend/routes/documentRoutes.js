const express = require("express");
const router = express.Router();

const Document = require("../models/Document");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload document
router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select a document",
        });
      }

      const document = await Document.create({
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        uploadedBy: req.user.id,
        decision: req.body.decision || null,
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: error.message || "Document upload failed",
      });
    }
  }
);

// Get documents uploaded by logged-in user
router.get("/my-documents", authMiddleware, async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user.id,
    })
      .populate("decision", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
});

// Delete document
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    await document.deleteOne();

    res.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete document",
    });
  }
});

module.exports = router;