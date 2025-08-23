// FILE: public/script.js

const BASE_URL = window.location.origin;

// --- Utility Functions ---


// --- Utility Functions ---
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<div class="message ${type}">${message}</div>`;
    }
}

function clearMessage(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = '';
    }
}

// --- Patient Dashboard Functions ---
function initPatientDashboard() {
    const uploadForm = document.getElementById("upload-form");
    const statusMessage = document.getElementById("status-message");
    const qrCodeDisplay = document.getElementById("qr-code-display");
    const qrCodeImg = document.getElementById("qr-code-img");
    const qrLink = document.getElementById("qr-link");
    const downloadQrBtn = document.getElementById("downloadQrBtn");

    if (uploadForm) {
        uploadForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage("status-message");
            if (qrCodeDisplay) qrCodeDisplay.style.display = "none";

            const name = document.getElementById("patientName").value;
            const email = document.getElementById("patientEmail").value;
            const pdfFile = document.getElementById("medicalData").files[0];

            if (!pdfFile) {
                showMessage("status-message", "Please select a PDF file to upload.", "danger");
                return;
            }

            showMessage("status-message", "Reading file and generating QR code...", "info");

            // Convert PDF file to a Base64 string
            const reader = new FileReader();
            reader.readAsDataURL(pdfFile);
            reader.onload = async () => {
                const base64Pdf = reader.result;

                try {
                    const response = await fetch(`${BASE_URL}/api/patient/records`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            patient: { name, email },
                            medicalData: { file: base64Pdf, fileName: pdfFile.name, fileType: pdfFile.type }
                        })
                    });
                    
                    const result = await response.json();

                    if (response.ok) {
                        showMessage("status-message", "✅ QR Code successfully generated! Share it with your doctor.", "success");
                        qrCodeImg.src = result.data.qrCodeDataUrl;
                        qrLink.href = result.data.accessUrl;
                        qrCodeDisplay.style.display = "block";
                    } else {
                        showMessage("status-message", `Error: ${result.error?.message || 'Unknown error'}`, "danger");
                    }
                } catch (error) {
                    console.error("Error generating QR code:", error);
                    showMessage("status-message", "❌ Failed to connect to the server.", "danger");
                }
            };
            reader.onerror = () => {
                showMessage("status-message", "❌ Failed to read the PDF file.", "danger");
            };
        });
    }

    // Download QR button
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', () => {
            if (qrCodeImg && qrCodeImg.src) {
                const link = document.createElement('a');
                link.href = qrCodeImg.src;
                link.download = `QR-Code-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("QR code is not available to download.");
            }
        });
    }

    // Logs
    const viewLogsBtn = document.getElementById("viewLogsBtn");
    const patientLogEmailInput = document.getElementById("patientLogEmail");
    const accessLogsDiv = document.getElementById("access-logs");

    if (viewLogsBtn) {
        viewLogsBtn.addEventListener("click", async () => {
            const email = patientLogEmailInput.value;
            if (!email) {
                showMessage("log-status-message", "Please enter your email to view logs.", "danger");
                return;
            }

            clearMessage("log-status-message");
            accessLogsDiv.innerHTML = "<p>Fetching logs...</p>";

            try {
                const patientResponse = await fetch(`${BASE_URL}/api/patient/find?email=${encodeURIComponent(email)}`);
                const patientData = await patientResponse.json();

                if (!patientResponse.ok || !patientData.data?._id) {
                    showMessage("log-status-message", "No records found for this email.", "warning");
                    accessLogsDiv.innerHTML = "<p>No logs to display.</p>";
                    return;
                }

                const logsResponse = await fetch(`${BASE_URL}/api/logs/patient/${patientData.data._id}`);
                const logsResult = await logsResponse.json();

                if (logsResponse.ok && logsResult.data?.length > 0) {
                    accessLogsDiv.innerHTML = "<h3>Recent Accesses:</h3><ul>" +
                        logsResult.data.map(log => `
                            <li>
                                <strong>Record ID:</strong> ${log.record._id}<br>
                                <strong>Accessed By:</strong> ${log.doctor?.name || 'Unknown'}<br>
                                <strong>When:</strong> ${new Date(log.createdAt).toLocaleString()}<br>
                                <strong>IP:</strong> ${log.ip || 'N/A'}<br>
                                <strong>User Agent:</strong> ${log.userAgent || 'N/A'}
                            </li>
                        `).join("") + "</ul>";
                } else {
                    accessLogsDiv.innerHTML = "<p>No logs to display.</p>";
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
                showMessage("log-status-message", "Failed to fetch logs.", "danger");
                accessLogsDiv.innerHTML = "<p>Error loading logs.</p>";
            }
        });
    }
}

// --- Doctor Scanner Functions ---
// (unchanged — only fixed minor cleanups)
function initDoctorScanner() {
    const readerDiv = document.getElementById("reader");
    const scanStatusMessage = document.getElementById("scan-status-message");
    const reportDisplayArea = document.getElementById("report-display-area");
    const reportIframe = document.getElementById("medical-report-iframe");
    const reportErrorMessage = document.getElementById("report-error-message");
    const startScanBtn = document.getElementById("startScanBtn");
    const stopScanBtn = document.getElementById("stopScanBtn");
    const qrFileInput = document.getElementById("qr-file-input");

    const html5QrCode = new Html5Qrcode("reader");

    const qrCodeSuccessCallback = async (decodedText) => {
        try {
            if (html5QrCode.isScanning) {
                await html5QrCode.stop();
                stopScanBtn.style.display = "none";
                startScanBtn.style.display = "block";
            }
        } catch {}

        scanStatusMessage.textContent = `QR Code scanned! Fetching report...`;
        scanStatusMessage.style.color = "green";

        let recordId, token;
        try {
            const url = new URL(decodedText);
            recordId = url.searchParams.get('id');
            token = url.searchParams.get('token');
        } catch {
            reportErrorMessage.textContent = "Invalid QR Code data.";
            reportErrorMessage.style.display = "block";
            return;
        }

        if (!recordId || !token) {
            reportErrorMessage.textContent = "Missing record ID or token.";
            reportErrorMessage.style.display = "block";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/records/${recordId}?token=${token}`);
            const result = await response.json();

            if (response.ok) {
                reportIframe.src = result.data.medicalData.file;
                reportIframe.style.display = "block";
                reportErrorMessage.style.display = "none";
            } else {
                reportErrorMessage.textContent = result.error?.message || "Access failed.";
                reportErrorMessage.style.display = "block";
                reportIframe.style.display = "none";
            }
        } catch {
            reportErrorMessage.textContent = "Network error.";
            reportErrorMessage.style.display = "block";
            reportIframe.style.display = "none";
        }
    };

    if (startScanBtn) startScanBtn.addEventListener("click", () => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices?.length) {
                html5QrCode.start(
                    devices[0].id, 
                    { fps: 10, qrbox: { width: 250, height: 250 } }, 
                    qrCodeSuccessCallback
                );
                scanStatusMessage.textContent = "Scanning...";
                startScanBtn.style.display = "none";
                stopScanBtn.style.display = "block";
            } else {
                scanStatusMessage.textContent = "No camera found.";
            }
        });
    });
    if (stopScanBtn) stopScanBtn.addEventListener("click", () => html5QrCode.stop());
    if (qrFileInput) qrFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) html5QrCode.scanFile(file, false).then(qrCodeSuccessCallback);
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("patient-app")) {
        initPatientDashboard();
    } else if (document.getElementById("doctor-app")) {
        initDoctorScanner();
    }
});
