import express from "express";
import router from "./routes/authRouter.js";

const app = new express();
app.use(express.json());

app.use("/api/auth", router)

export default app;
