import { Router } from "express";

const router = Router();

router.post("/api/test", (req, res) => {
  const response = req.body;
  console.log(response);

  res.status(201).json({
    Message: "Message recieved successfully",
  });
});

router.get("/", (req, res) => {
  res.send("Yup!! am Alive");
});
export default router;
