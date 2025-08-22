// FILE: notification.js

import nodemailer from "nodemailer";
import logger from "../config/logger.js";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // Use SSL for port 465
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

export const notifyPatientAccess = async ({ email, patientName, recordId, when, accessUrl }) => {
    // Return early if transporter is not set up
    if (!transporter) {
        logger.warn("Email transporter not configured. Skipping email notification.");
        return;
    }

    // Return early if email is not provided
    if (!email) {
        logger.warn("Patient email not provided. Skipping email notification.");
        return;
    }

    try {
        const mailOptions = {
            from: `"QR Med" <no-reply@qrmed.local>`,
            to: email,
            subject: "Your Medical Record Was Accessed",
            html: `
                <p>Hello ${patientName || "Patient"},</p>
                <p>Your medical record has been accessed.</p>
                <p><strong>Record ID:</strong> ${recordId}</p>
                <p><strong>Access Time:</strong> ${new Date(when).toLocaleString()}</p>
                <p>If you did not authorize this access, please contact the clinic immediately.</p>
                <p>For your reference, you can view your report again by accessing this link:</p>
                <a href="${accessUrl}">${accessUrl}</a>
                <p>Best regards,<br/>The QR Med Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Email notification sent to ${email} for record ${recordId}`);
    } catch (err) {
        logger.error({ err, email, recordId }, "Failed to send email notification.");
    }
};