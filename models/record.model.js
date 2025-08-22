// FILE: /models/record.model.js
import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    medicalData: {
      file: { type: String, required: true }, // <-- Correct data type for Base64 string
      fileName: { type: String },
      fileType: { type: String },
    },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Record", recordSchema);
