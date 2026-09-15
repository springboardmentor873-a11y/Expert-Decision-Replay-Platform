const mongoose = require("mongoose");

const alternativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      required: true,
    },

    cost: {
      type: Number,
      default: 0,
    },

    performance: {
      type: Number,
      default: 0,
    },

    scalability: {
      type: Number,
      default: 0,
    },

    risk: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alternative", alternativeSchema);