import Patient from "../models/patient.model.js";
import Record from "../models/record.model.js";

export const ensurePatient = async ({ name, email, phone }) => {
  if (!email) {
    // For demo we allow missing email; but email helps notifications.
  }
  let patient = email ? await Patient.findOne({ email }) : null;
  if (!patient) {
    patient = await Patient.create({ name, email, phone });
  }
  return patient;
};

export const saveRecord = async ({ patient, medicalData }) => {
  if (!patient || !patient._id) throw new Error("Patient is required");
  const record = await Record.create({ patient: patient._id, medicalData });
  return record;
};
export const findPatientByEmail = async (email) => {
    if (!email) throw new Error("Email is required");
    return await Patient.findOne({ email });
};
