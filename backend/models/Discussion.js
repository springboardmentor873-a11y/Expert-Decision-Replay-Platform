const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Discussion", discussionSchema);