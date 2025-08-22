import { Router } from "express";
import patientRoutes from "./patient.routes.js";
import recordsRoutes from "./records.routes.js";
import logsRoutes from "./logs.routes.js";

const router = Router();

router.use("/patient", patientRoutes);
router.use("/records", recordsRoutes);
router.use("/logs", logsRoutes);

export default router;
