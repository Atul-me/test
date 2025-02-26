const express = require("express");
const next = require("next");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const Caption = require("./models/Caption");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Next.js Server
const nextApp = next({ dev: process.env.NODE_ENV !== "production" });
const handle = nextApp.getRequestHandler();

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🔥 Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads")); // Serve uploaded videos

// Multer for file uploads (MP4)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 📌 API Routes
app.post("/api/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ videoUrl: `/uploads/${req.file.filename}` });
});

app.post("/api/captions", async (req, res) => {
  const { videoUrl, captions } = req.body;
  try {
    let existingEntry = await Caption.findOne({ videoUrl });

    if (existingEntry) {
      captions.forEach((newCaption) => {
        let found = false;
        existingEntry.captions = existingEntry.captions.map((existing) => {
          if (
            newCaption.startTime <= existing.endTime &&
            newCaption.endTime >= existing.startTime
          ) {
            found = true;
            return newCaption;
          }
          return existing;
        });

        if (!found) {
          existingEntry.captions.push(newCaption);
        }
      });

      await existingEntry.save();
      return res.json({ message: "Captions updated!", captions: existingEntry.captions });
    } else {
      const newCaptionEntry = new Caption({ videoUrl, captions });
      await newCaptionEntry.save();
      return res.json({ message: "Captions saved!", captions: newCaptionEntry.captions });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/captions", async (req, res) => {
  const { videoUrl } = req.query;
  try {
    const entry = await Caption.findOne({ videoUrl });

    if (!entry) {
      return res.json({ message: "No captions found", captions: [] });
    }

    res.json({ captions: entry.captions });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Wait for Next.js to prepare before starting the server
nextApp.prepare().then(() => {
  // 📌 Handle all frontend requests through Next.js
  app.all("*", (req, res) => {
    return handle(req, res);
  });

  // Start Server
  app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
});
