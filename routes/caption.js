const express = require("express");
const router = express.Router();
const Caption = require("../models/Caption");

// 📌 Add or Update Captions for a Video
router.post("/captions", async (req, res) => {
  const { videoUrl, captions } = req.body;

  try {
    let existingEntry = await Caption.findOne({ videoUrl });

    if (existingEntry) {
      // 🔥 Handle overlapping captions: Replace or merge
      captions.forEach((newCaption) => {
        let found = false;
        existingEntry.captions = existingEntry.captions.map((existing) => {
          if (
            newCaption.startTime <= existing.endTime &&
            newCaption.endTime >= existing.startTime
          ) {
            found = true;
            return newCaption; // Replace overlapping caption
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

// 📌 Fetch Captions for a Video
router.get("/captions", async (req, res) => {
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

module.exports = router;
