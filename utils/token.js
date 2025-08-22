import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || "qr-med-backend";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not configured");
}

export const generateRecordAccessToken = (recordId) => {
  const payload = { sub: String(recordId), scope: "record:read" };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "10m",
    issuer: JWT_ISSUER,
  });
};

export const verifyRecordAccessToken = (token, recordId) => {
  const decoded = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
  if (String(decoded.sub) !== String(recordId) || decoded.scope !== "record:read") {
    throw new Error("Invalid token subject or scope");
  }
  return decoded;
};
