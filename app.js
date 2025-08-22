import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./config/logger.js";
import requestLogger from "./middleware/requestLogger.js";

const app = express();

// Set up security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "https://unpkg.com"],
        // THIS IS THE NEW DIRECTIVE TO ALLOW IFRAMES
        frameSrc: ["'self'", "data:", "blob:"], 
      },
    },
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use(requestLogger);

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Your API routes
app.use("/api", routes);

// 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;