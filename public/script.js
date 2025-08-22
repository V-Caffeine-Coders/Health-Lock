// FILE: public/script.js

const BASE_URL = window.location.origin;

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
    // NEW: Get a reference to the download button
    const downloadQrBtn = document.getElementById("downloadQrBtn");

    if (uploadForm) {
        uploadForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearMessage("status-message");
            qrCodeDisplay.style.display = "none";

            const name = document.getElementById("patientName").value;
            const email = document.getElementById("patientEmail").value;
            const pdfFile = document.getElementById("medicalData").files[0];

            if (!pdfFile) {
                showMessage("status-message", "Please select a PDF file to upload.", "error");
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
                        showMessage("status-message", "QR Code successfully generated! Share it with your doctor.", "success");
                        qrCodeImg.src = result.data.qrCodeDataUrl;
                        qrLink.href = result.data.accessUrl;
                        qrCodeDisplay.style.display = "block";
                    } else {
                        showMessage("status-message", `Error: ${result.error.message || 'Unknown error'}`, "error");
                    }
                } catch (error) {
                    console.error("Error generating QR code:", error);
                    showMessage("status-message", "Failed to connect to the server or process request.", "error");
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                showMessage("status-message", "Failed to read the PDF file.", "error");
            };
        });
    }

    // NEW: Add event listener for the download button
    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', () => {
            const qrCodeDataUrl = qrCodeImg.src;
            if (qrCodeDataUrl && qrCodeDataUrl !== "") {
                const link = document.createElement('a');
                link.href = qrCodeDataUrl;
                link.download = `QR-Code-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("QR code is not available to download.");
            }
        });
    }


    const viewLogsBtn = document.getElementById("viewLogsBtn");
    const patientLogEmailInput = document.getElementById("patientLogEmail");
    const accessLogsDiv = document.getElementById("access-logs");
    const logStatusMessage = document.getElementById("log-status-message");

    if (viewLogsBtn) {
        viewLogsBtn.addEventListener("click", async () => {
            const email = patientLogEmailInput.value;
            if (!email) {
                showMessage("log-status-message", "Please enter your email to view logs.", "error");
                return;
            }
            clearMessage("log-status-message");
            accessLogsDiv.innerHTML = "<p>Fetching logs...</p>";

            try {
                const patientResponse = await fetch(`${BASE_URL}/api/patient/find?email=${encodeURIComponent(email)}`);
                const patientData = await patientResponse.json();

                if (!patientResponse.ok || !patientData.data || !patientData.data._id) {
                    showMessage("log-status-message", "Patient not found or no records associated with this email.", "error");
                    accessLogsDiv.innerHTML = "<p>No logs to display.</p>";
                    return;
                }

                const patientId = patientData.data._id;
                const logsResponse = await fetch(`${BASE_URL}/api/logs/patient/${patientId}`);
                const logsResult = await logsResponse.json();

                if (logsResponse.ok && logsResult.data && logsResult.data.length > 0) {
                    accessLogsDiv.innerHTML = "<h3>Recent Accesses:</h3><ul>" +
                        logsResult.data.map(log => `
                            <li>
                                <strong>Record ID:</strong> ${log.record._id}<br>
                                <strong>Accessed By:</strong> ${log.doctor ? log.doctor.name : 'Unknown Doctor'}<br>
                                <strong>When:</strong> ${new Date(log.createdAt).toLocaleString()}<br>
                                <strong>IP:</strong> ${log.ip || 'N/A'}<br>
                                <strong>User Agent:</strong> ${log.userAgent || 'N/A'}
                            </li>
                        `).join("") + "</ul>";
                } else {
                    showMessage("log-status-message", "No access logs found for this patient.", "info");
                    accessLogsDiv.innerHTML = "<p>No logs to display.</p>";
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
                showMessage("log-status-message", "Failed to fetch logs. Please try again.", "error");
                accessLogsDiv.innerHTML = "<p>Error loading logs.</p>";
            }
        });
    }
}

// --- Doctor Scanner Functions ---
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

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        try {
            if (html5QrCode.isScanning) {
                await html5QrCode.stop();
                stopScanBtn.style.display = "none";
                startScanBtn.style.display = "block";
            }
        } catch (err) {
            console.error("Failed to stop scanning:", err);
        }

        scanStatusMessage.textContent = `QR Code scanned! Attempting to fetch report...`;
        scanStatusMessage.style.color = "green";

        let recordId, token;
        try {
            const url = new URL(decodedText);
            recordId = url.searchParams.get('id');
            token = url.searchParams.get('token');
        } catch (e) {
            reportDisplayArea.style.display = "block";
            reportErrorMessage.style.display = "block";
            reportErrorMessage.textContent = "Error: Invalid QR Code data (Not a valid URL).";
            return;
        }

        if (!recordId || !token) {
            reportDisplayArea.style.display = "block";
            reportErrorMessage.style.display = "block";
            reportErrorMessage.textContent = "Error: Invalid QR Code data. Missing record ID or token.";
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/records/${recordId}?token=${token}`);
            const result = await response.json();

            reportDisplayArea.style.display = "block";
            reportErrorMessage.style.display = "none";

            if (response.ok) {
                const { file } = result.data.medicalData;
                
                reportIframe.src = file;
                reportIframe.style.display = "block";
            } else {
                reportIframe.style.display = "none";
                reportErrorMessage.style.display = "block";
                reportErrorMessage.textContent = `Error: ${result.error.message || 'Report access failed.'}`;
            }
        } catch (error) {   
            console.error("Error fetching report:", error);
            reportIframe.style.display = "none";
            reportErrorMessage.style.display = "block";
            reportErrorMessage.textContent = "Network error or server unavailable.";
        }
    };

    const qrCodeErrorCallback = (errorMessage) => {
        // console.warn(`QR Code scanning error: ${errorMessage}`);
    };

    const startScanner = () => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                const cameraId = devices[0].id;
                html5QrCode.start(
                    cameraId, 
                    { fps: 10, qrbox: { width: 250, height: 250 } }, 
                    qrCodeSuccessCallback, 
                    qrCodeErrorCallback
                ).then(() => {
                    scanStatusMessage.textContent = "Scanning for QR Code...";
                    scanStatusMessage.style.color = "var(--primary-color)";
                    startScanBtn.style.display = "none";
                    stopScanBtn.style.display = "block";
                }).catch(err => {
                    scanStatusMessage.textContent = `Error starting camera: ${err.message}`;
                    scanStatusMessage.style.color = "var(--error-color)";
                    startScanBtn.style.display = "block";
                    stopScanBtn.style.display = "none";
                });
            } else {
                scanStatusMessage.textContent = "No cameras found.";
                scanStatusMessage.style.color = "var(--error-color)";
                startScanBtn.style.display = "none";
                stopScanBtn.style.display = "none";
            }
        }).catch(err => {
            console.error("Error getting camera devices:", err);
            scanStatusMessage.textContent = `Error accessing camera: ${err.message}`;
            scanStatusMessage.style.color = "var(--error-color)";
            startScanBtn.style.display = "block";
            stopScanBtn.style.display = "none";
        });
    };

    const stopScanner = () => {
        html5QrCode.stop().then(() => {
            scanStatusMessage.textContent = "Scanner stopped.";
            scanStatusMessage.style.color = "var(--secondary-color)";
            startScanBtn.style.display = "block";
            stopScanBtn.style.display = "none";
        }).catch(err => {
            console.error("Failed to stop scanning:", err);
        });
    };

    const scanFromFile = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        try {
            scanStatusMessage.textContent = "Scanning QR code from image...";
            const decodedText = await html5QrCode.scanFile(file, false);
            qrCodeSuccessCallback(decodedText);
        } catch (err) {
            console.error("Error scanning file:", err);
            scanStatusMessage.textContent = `Error: No QR code found in the image.`;
        }
    };

    if (startScanBtn) {
        startScanBtn.style.display = "block";
        startScanBtn.addEventListener("click", startScanner);
    }
    if (stopScanBtn) {
        stopScanBtn.addEventListener("click", stopScanner);
    }
    if (qrFileInput) {
        qrFileInput.addEventListener("change", scanFromFile);
    }
}

// Call the appropriate initialization function based on the page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("patient-app")) {
        initPatientDashboard();
    } else if (document.getElementById("doctor-app")) {
        initDoctorScanner();
    }
});