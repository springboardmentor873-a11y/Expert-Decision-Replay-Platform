import express from "express";
import router from "./routes/testRouter.js";

const app = new express();
app.use(express.json());

app.use("/", router)

export default app;
