import express from "express";
import cors from "cors"
import authRouter from "./routes/authRouter.js";
import decisionRouter from "./routes/decisionRouter.js"

const app = new express();

app.use(cors())
app.use(express.json());

app.use("/api/auth", authRouter)
app.use("/api/decisions", decisionRouter)

export default app;
