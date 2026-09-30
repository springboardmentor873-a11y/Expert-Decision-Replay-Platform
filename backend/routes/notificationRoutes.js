const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");

const authMiddleware = require("../middleware/authMiddleware");

// ============================================================
// GET CURRENT USER NOTIFICATIONS
// ============================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate("decision", "title status")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      count,
    });
  } catch (error) {
    console.error("Unread notification count error:", error);

    res.status(500).json({
      message: "Failed to fetch unread notification count",
    });
  }
});

// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
});

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    res.status(500).json({
      message: "Failed to mark all notifications as read",
    });
  }
});

module.exports = router;