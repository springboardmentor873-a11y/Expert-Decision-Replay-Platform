const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const decisionRoutes = require("./routes/decisionRoutes");
const documentRoutes = require("./routes/documentRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const alternativeRoutes = require("./routes/alternativeRoutes");
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const teamRoutes = require("./routes/teamRoutes");
// ==================== ROUTES ====================


const app = express();

// ==================== DATABASE ====================

connectDB();

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==================== ROUTES ====================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/audit-logs", auditRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/decisions", decisionRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/discussions", discussionRoutes);

app.use("/api/alternatives", alternativeRoutes);

app.use("/api/teams", teamRoutes);

// ==================== TEST ROUTE ====================

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend is working"
    });
});

// ==================== ROOT ROUTE ====================

app.get("/", (req, res) => {
    res.json({
        message: "Expert Decision Replay API is running"
    });
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 5173;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});