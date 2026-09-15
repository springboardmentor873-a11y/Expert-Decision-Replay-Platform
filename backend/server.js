const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const decisionRoutes = require("./routes/decisionRoutes");
const express = require("express");
const documentRoutes = require("./routes/documentRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const alternativeRoutes = require("./routes/alternativeRoutes");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/decisions", decisionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/alternatives", alternativeRoutes);
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working" });
});
app.get("/", (req, res) => {
    res.json({
        message: "Expert Decision Replay API is running"
    });
});

const PORT = process.env.PORT || 5173;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});