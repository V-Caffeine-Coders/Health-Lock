import QRCode from "qrcode";

export const generateQRCodeDataUrl = async (text) => {
  return await QRCode.toDataURL(text, { errorCorrectionLevel: "M" });
};
