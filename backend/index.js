const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const geminiRoutes = require("./routes/gemini");
app.use("/api", geminiRoutes);

// Default
app.get("/", (req, res) => {
  res.send("✅ Backend is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
