import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./config/logger.js";
import requestLogger from "./middleware/requestLogger.js";
import { spawn } from 'child_process';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const upload = multer({ dest: 'uploads/' });  

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This route will handle the PDF upload and process it
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    // Use a child process to run the Python script
    const pythonProcess = spawn('python', ['D:\\my_code_profile\\Sunhacks\\Health-Lock\\AIworking\\main.py', filePath]);

    let pythonOutput = '';
    let pythonError = '';

    pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            return res.status(500).send(`Error processing the file. Python output: ${pythonError}`);
        }
        
        try {
            // The python script will print the JSON dashboard data at the end
            const dashboardData = JSON.parse(pythonOutput);
            res.status(200).json(dashboardData);
        } catch (e) {
            console.error('Failed to parse Python output as JSON:', e);
            res.status(500).send('Failed to parse Python output.');
        } finally {
            // Clean up the uploaded file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });
});

// A route to serve static files (like your PDF reports)
app.use('/reports', express.static(path.join(__dirname, 'master_reports')));

// This route will fetch the latest report files for the dashboard
app.get('/reports-list', (req, res) => {
    const reportsPath = path.join(__dirname, 'master_reports');
    fs.readdir(reportsPath, (err, files) => {
        if (err) {
            console.error('Failed to read reports directory:', err);
            return res.status(500).json({ error: 'Failed to retrieve reports.' });
        }
        // Filter for PDF files and send them
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        res.status(200).json(pdfFiles);
    });
});


// Set up security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // ADDED Cloudflare access wildcard to script-src
        scriptSrc: [
          "'self'", 
          "https://unpkg.com", 
          "https://*.cloudflare.com",
          "https://*.cloudflareaccess.com", 
          "'unsafe-inline'"],
        frameSrc: ["'self'", "data:", "blob:"],
      },
    },
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use(requestLogger);

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Your API routes
app.use("/api", routes);

// 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Global Error Handler
app.use(errorHandler);

export default app;