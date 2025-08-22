import * as patientService from "../services/patient.service.js";
import { generateRecordAccessToken } from "../utils/token.js";
import { generateQRCodeDataUrl } from "../utils/qrcode.js";

export const uploadHistory = async (req, res, next) => {
  try {
    const { patient: patientInput, medicalData } = req.body;
    if (!medicalData || !medicalData.file) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "medicalData and its file property are required" },
        });
    }
    const patient = await patientService.ensurePatient(patientInput || {});
    const record = await patientService.saveRecord({ patient, medicalData });
    const token = generateRecordAccessToken(record._id);
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    // Correct URL to point to the doctor's frontend page
    const accessUrl = `${baseUrl}/doctor-scanner.html?id=${
      record._id
    }&token=${encodeURIComponent(token)}`;
    const qrCode = await generateQRCodeDataUrl(accessUrl);
    return res.status(201).json({
      success: true,
      data: {
        recordId: record._id,
        accessUrl,
        qrCodeDataUrl: qrCode,
        tokenExpiresIn: "10m",
      },
    });
  } catch (err) {
    next(err);
  }
};

// Add this function to your file
export const getPatientByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: "Email parameter is required" },
      });
    }
    const patient = await patientService.findPatientByEmail(email);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Patient not found" } });
    }
    return res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};
