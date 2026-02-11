import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.WEBAPP_PORT || process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.path} from ${clientIp}`);
  next();
});

// Store last action status
let lastAction = {
  type: null,
  status: null,
  message: null,
  timestamp: null,
};

// Helper function to run suspend-chess.js
function runSuspendChess(action) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, "..", "suspend-chess.js");
    console.log(`📋 Executing: node ${scriptPath} ${action}`);

    // Using node to run the ES module
    const child = spawn("node", [scriptPath, action], {
      cwd: join(__dirname, ".."),
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;
      // Log script output in real-time
      console.log(`📤 [suspend-chess.js stdout]: ${chunk.trim()}`);
    });

    child.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;
      // Log script errors in real-time
      console.error(`❌ [suspend-chess.js stderr]: ${chunk.trim()}`);
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Script executed successfully (exit code: ${code})`);
        resolve({ stdout, stderr, code });
      } else {
        console.error(`❌ Script execution failed (exit code: ${code})`);
        reject({ stdout, stderr, code });
      }
    });

    child.on("error", (error) => {
      console.error(`💥 Failed to spawn script: ${error.message}`);
      reject({ error: error.message, code: -1 });
    });
  });
}

// API endpoint to block chess
app.post("/api/block", async (req, res) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚫 BLOCK REQUEST received from ${clientIp} at ${timestamp}`);
  console.log(`${"=".repeat(60)}`);

  try {
    lastAction = {
      type: "block",
      status: "running",
      message: "Blocking chess sites...",
      timestamp: new Date().toISOString(),
    };

    const result = await runSuspendChess("block");

    lastAction = {
      type: "block",
      status: "success",
      message: "Chess sites blocked successfully!",
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ BLOCK request completed successfully`);
    console.log(`${"=".repeat(60)}\n`);

    res.json({
      success: true,
      message: "Chess sites blocked successfully!",
      output: result.stdout,
    });
  } catch (error) {
    lastAction = {
      type: "block",
      status: "error",
      message: "Failed to block chess sites",
      timestamp: new Date().toISOString(),
    };

    console.error(
      `❌ BLOCK request failed: ${error.stderr || error.error || "Unknown error"}`,
    );
    console.log(`${"=".repeat(60)}\n`);

    res.status(500).json({
      success: false,
      message: "Failed to block chess sites",
      error: error.stderr || error.error || "Unknown error",
    });
  }
});

// API endpoint to allow chess
app.post("/api/allow", async (req, res) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ ALLOW REQUEST received from ${clientIp} at ${timestamp}`);
  console.log(`${"=".repeat(60)}`);

  try {
    lastAction = {
      type: "allow",
      status: "running",
      message: "Allowing chess sites...",
      timestamp: new Date().toISOString(),
    };

    const result = await runSuspendChess("allow");

    lastAction = {
      type: "allow",
      status: "success",
      message: "Chess sites allowed successfully!",
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ ALLOW request completed successfully`);
    console.log(`${"=".repeat(60)}\n`);

    res.json({
      success: true,
      message: "Chess sites allowed successfully!",
      output: result.stdout,
    });
  } catch (error) {
    lastAction = {
      type: "allow",
      status: "error",
      message: "Failed to allow chess sites",
      timestamp: new Date().toISOString(),
    };

    console.error(
      `❌ ALLOW request failed: ${error.stderr || error.error || "Unknown error"}`,
    );
    console.log(`${"=".repeat(60)}\n`);

    res.status(500).json({
      success: false,
      message: "Failed to allow chess sites",
      error: error.stderr || error.error || "Unknown error",
    });
  }
});

// API endpoint to get last action status
app.get("/api/status", (req, res) => {
  res.json(lastAction);
});

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Chess Control Web App running on http://0.0.0.0:${PORT}`);
  console.log(
    `📱 Access from your local network using your computer's IP address`,
  );
});
