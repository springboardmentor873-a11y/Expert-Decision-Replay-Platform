import express from "express";
import cors from "cors"
import router from "./routes/authRouter.js";

const app = new express();

app.use(cors())
app.use(express.json());

app.use("/api/auth", router)

export default app;
