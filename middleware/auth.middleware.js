/**
 * For demo purposes, we accept an optional X-Doctor-Id header to associate access logs.
 * In a real system, replace this with proper doctor authentication (JWT/OAuth).
 */
export const attachDoctorContext = (req, _res, next) => {
  const docId = req.header("x-doctor-id");
  if (docId) {
    req.doctorContext = { id: docId };
  }
  next();
};
