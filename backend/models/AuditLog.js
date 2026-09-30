const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    previousStatus: {
      type: String,
      default: null,
    },

    newStatus: {
      type: String,
      default: null,
    },

    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);