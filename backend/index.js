const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://chipper-lamington-91e93f.netlify.app", // your Netlify frontend
    ],
    credentials: true, // if you're using cookies or auth headers
  })
);
app.use(express.json());

// Routes
const geminiRoutes = require("./routes/gemini");
app.use("/api", geminiRoutes);

const realEstateRoutes = require("./routes/realEstate");
app.use("/api2", realEstateRoutes);

// app.use(express.static(path.join(__dirname, "public")));
// app.use("/videos", express.static(path.join(__dirname, "public/videos")));

app.use(
  "/videos",
  express.static(path.join(__dirname, "public/videos"), {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", "no-store");
    },
  })
);

// Default
app.get("/", (req, res) => {
  res.send("✅ Backend is up and running!");
});

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
