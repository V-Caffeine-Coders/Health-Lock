import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    record: { type: mongoose.Schema.Types.ObjectId, ref: "Record", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }, // optional
    action: { type: String, enum: ["RECORD_VIEWED"], required: true },
    meta: { type: Object },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("AccessLog", accessLogSchema);
