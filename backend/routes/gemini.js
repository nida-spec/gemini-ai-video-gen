const express = require("express");
const router = express.Router();

// Example route
router.post("/generate-video", async (req, res) => {
  res.json({ message: "Video generation endpoint working" });
});

module.exports = router;