import { Router } from "express";
import { getPatientLogs } from "../controllers/logs.controller.js";

const router = Router();

// GET /api/logs/patient/:patientId
router.get("/patient/:patientId", getPatientLogs);

export default router;
