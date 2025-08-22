import * as logService from "../services/log.service.js";

export const getPatientLogs = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const logs = await logService.getLogsForPatient(patientId);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};
