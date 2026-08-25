import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./src/app.js";

app.listen(process.env.PORT, (req, res) => {
  console.log(`Server is running at port ${process.env.PORT}`);
});
