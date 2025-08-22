// FILE: app.js

import express from "express";
import { spawn } from "child_process";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';

const app = express();

// --- Middleware Setup ---
// Use the correct path for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up Multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Serve static files from a downloads directory (where the PDFs will be saved)
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// --- API Route to Generate Report ---
app.post('/generate-report', upload.single('report_file'), (req, res) => {
    // 1. Check if a file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const uploadedFilePath = req.file.path;

    // Use a unique filename for the generated report PDF
    const outputFilename = `master_report_${Date.now()}.pdf`;
    const pythonScriptPath = path.join(__dirname, 'your_python_script.py');

    // 2. Spawn the Python script
    const pythonProcess = spawn('python', [
        pythonScriptPath,
        uploadedFilePath,
        outputFilename
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data.toString()}`);
    });

    // 3. Handle the completion of the Python process
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            // Success: Python script generated the PDF
            const downloadUrl = `/downloads/${outputFilename}`;
            res.status(200).json({
                message: 'Report generated successfully!',
                downloadUrl: downloadUrl,
            });
        } else {
            // Error: Python script failed
            res.status(500).send('Failed to generate report.');
        }
    });
});

export default app;