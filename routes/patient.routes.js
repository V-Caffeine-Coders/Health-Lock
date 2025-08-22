// FILE: /routes/patient.routes.js
import { Router } from "express";
import { uploadHistory, getPatientByEmail } from "../controllers/patient.controller.js"; 

const router = Router();

// POST /api/patient/records
router.post("/records", uploadHistory);

// GET /api/patient/find?email=... <-- Add this new route
router.get("/find", getPatientByEmail);

export default router;