require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const validator = require("validator"); // For data validation

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));

// Detection schema with additional fields
const detectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Remove leading/trailing whitespace
    validate(value) {
      if (!validator.isLength(value, { min: 1, max: 50 })) {
        throw new Error("Name must be between 1 and 50 characters");
      }
    },
  },
  dateDetected: {
    type: Date,
    required: true,
  },
  boundingBox: {
    // Add bounding box information (optional)
    type: {
      type: String,
      enum: ["xywh", "x1y1x2y2"], // Supported formats
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  confidenceScore: {
    // Add confidence score (optional)
    type: Number,
    min: 0,
    max: 1,
  },
});
const Detection = mongoose.model("Detection", detectionSchema);

// API endpoint with data validation
app.post("/detections", async (req, res) => {
  try {
    const { name, dateDetected, boundingBox, confidenceScore } = req.body;

    // Data validation using validator library or custom logic
    if (!name || !validator.isLength(name, { min: 1, max: 50 })) {
      return res.status(400).json({ message: "Invalid name" });
    }
    if (!dateDetected || !validator.isDate(dateDetected)) {
      return res.status(400).json({ message: "Invalid date" });
    }
    // Add validation for boundingBox and confidenceScore if used

    const newDetection = new Detection({
      name,
      dateDetected: new Date(dateDetected),
      boundingBox, // Optional
      confidenceScore, // Optional
    });
    await newDetection.save();

    res
      .status(201)
      .json({ success: true, message: "Detection saved successfully" });
  } catch (error) {
    console.error(error);
    let errorMessage = "Internal server error";
    if (error.name === "ValidationError") {
      errorMessage = "Validation error: " + error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
