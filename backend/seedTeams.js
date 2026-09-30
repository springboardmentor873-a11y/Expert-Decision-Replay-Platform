const mongoose = require("mongoose");
const Team = require("./models/Team");

require("dotenv").config();

const teams = [
  {
    name: "Engineering Team",
    description:
      "Software engineering, technical planning and development decisions.",
    icon: "👥",
    status: "active",
    decisions: 12,
  },

  {
    name: "AI Research Team",
    description:
      "Research, evaluation and decision-making related to artificial intelligence projects.",
    icon: "🤖",
    status: "active",
    decisions: 9,
  },

  {
    name: "Data & Analytics Team",
    description:
      "Data analysis, reporting and analytics-driven organizational decisions.",
    icon: "📊",
    status: "active",
    decisions: 7,
  },

  {
    name: "Compliance Team",
    description:
      "Governance, compliance reviews and organizational policy decisions.",
    icon: "🛡️",
    status: "archived",
    decisions: 5,
  },
];

const seedTeams = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Team.deleteMany({});

    await Team.insertMany(teams);

    console.log("Teams inserted successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding teams:", error);

    process.exit(1);
  }
};

seedTeams();