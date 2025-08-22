// FILE: middleware/requestLogger.js

import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
  // Log the request method, URL, and a timestamp
  logger.info({
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  }, "Incoming request");

  // Call the next middleware function in the stack
  next();
};

export default requestLogger;