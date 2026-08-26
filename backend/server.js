const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Expert Decision Replay API is running"
    });
});

const PORT = process.env.PORT || 5173;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});