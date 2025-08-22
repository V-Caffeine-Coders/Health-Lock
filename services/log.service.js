import AccessLog from "../models/log.model.js";

export const logRecordViewed = async ({ patientId, recordId, doctorId, ip, userAgent, meta }) => {
  return await AccessLog.create({
    patient: patientId,
    record: recordId,
    doctor: doctorId || undefined,
    action: "RECORD_VIEWED",
    meta,
    ip,
    userAgent,
  });
};

export const getLogsForPatient = async (patientId) => {
  return await AccessLog.find({ patient: patientId })
    .sort({ createdAt: -1 })
    .populate("doctor")
    .populate("record");
};
