// FILE: routes/records.routes.js

import { Router } from "express";
import MedicalRecord from "../models/record.model.js";
import { verifyToken } from "../utils/token.js";

const router = Router();

router.get("/:recordId", async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const { token } = req.query;

        // Verify the token
        const decodedToken = verifyToken(token);

        // Check if the token is valid and links to the correct record ID
        if (!decodedToken || decodedToken.sub.toString() !== recordId) {
            return res.status(401).json({ error: { message: "Invalid access token." } });
        }
        
        // Find the record and send it back without verifying the patient
        const record = await MedicalRecord.findById(recordId);
        if (!record) {
            return res.status(404).json({ error: { message: "Medical record not found." } });
        }

        // Send the record data directly to the client
        res.status(200).json({ data: record });

    } catch (error) {
        next(error);
    }
});

export default router;