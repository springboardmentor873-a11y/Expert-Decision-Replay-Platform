const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Employee who created the decision
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Current status of the decision
    status: {
      type: String,
      enum: [
        "Pending Review",
        "Under Review",
        "Approved",
        "Rejected",
      ],
      default: "Pending Review",
    },

    // Reviewer's feedback
    reviewerFeedback: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Manager's final comments
    managerFeedback: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Decision", decisionSchema);