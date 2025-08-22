// FILE: utils/token.js

import jwt from "jsonwebtoken";
import logger from "../config/logger.js"; 

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not configured");
}

export const createToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error({ error }, "Token verification failed.");
    return null;
  }
};