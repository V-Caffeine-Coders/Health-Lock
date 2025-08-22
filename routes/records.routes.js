// FILE: routes/records.routes.js

import { Router } from "express";
import { notifyPatientAccess } from "../services/notification.js";
import MedicalRecord from "../models/record.model.js";
import Patient from "../models/patient.model.js";
import Log from "../models/log.model.js";

const router = Router();

router.get("/:recordId", async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const { token } = req.query;

        // Find the record
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ error: { message: "Medical record not found." } });
        }

        // Validate token
        // THIS IS THE CORRECTED LOGIC
        if (record.accessUrl && record.accessUrl.includes(token)) {
            // Find the patient to get their email and name
            const patient = await Patient.findById(record.patientId);

            // Handle case where patient is not found
            if (!patient) {
                return res.status(404).json({ error: { message: "Patient not found for this record." } });
            }

            // Create a log entry for the access
            await Log.create({
                record: record._id,
                doctor: req.user ? req.user.doctor : null,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Call the notification service
            notifyPatientAccess({
                email: patient.email,
                patientName: patient.name,
                recordId: record._id,
                when: new Date(),
                accessUrl: record.accessUrl
            });

            res.status(200).json({ data: record });
        } else {
            res.status(401).json({ error: { message: "Invalid access token." } });
        }
    } catch (error) {
        next(error);
    }
});

export default router;