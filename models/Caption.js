const mongoose = require("mongoose");

const CaptionSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true, unique: true },
  captions: [
    {
      text: String,
      startTime: Number,
      endTime: Number,
    },
  ],
});

module.exports = mongoose.model("Caption", CaptionSchema);
