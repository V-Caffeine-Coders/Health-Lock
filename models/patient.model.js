import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, index: true },
    phone: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
