import mongoose from "mongoose";
import logger from "./logger.js";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not configured");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("✅ MongoDB connected");
};
