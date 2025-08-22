import logger from "../config/logger.js";

export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";
  logger.error({ err, path: req.path }, "Unhandled error");

  res.status(status).json({
    success: false,
    error: { message, code },
  });
}
