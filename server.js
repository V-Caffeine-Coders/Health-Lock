// FILE: server.js

import 'dotenv/config'; // This is the corrected line
import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Fatal: failed to start server");
    process.exit(1);
  }
})();