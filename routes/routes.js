import express from "express";
const router = express.Router();

router.post("/upload", (req, res) => {
  console.log("Body received:", req.body);
  res.json({ message: "Form data received successfully!" });
});

export default router;
