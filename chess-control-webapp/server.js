import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join, normalize } from "path";
import { spawn } from "child_process";
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.WEBAPP_PORT || process.env.PORT || 3000;

// Promisify exec for ping command
const execAsync = promisify(exec);

// Host monitoring configuration
const MONITOR_CONFIG = {
  sshHost: process.env.SSH_HOST || "192.168.0.10",
  checkIntervalMinutes: 10,
  ntfyServer: process.env.NTFY_SERVER || "https://ntfy.sh",
  ntfyTopic: process.env.NTFY_TOPIC || "chess-control",
};

// Host status tracking
let hostStatus = {
  isUp: null,
  lastCheck: null,
  lastChange: null,
  consecutiveFailures: 0,
};

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
    // Use path.normalize for Windows compatibility
    const scriptPath = normalize(join(__dirname, "..", "suspend-chess.js"));
    console.log(`📋 Executing: node ${scriptPath} ${action}`);

    // Using node to run the ES module
    // On Windows, use 'node.exe' explicitly for better compatibility
    const nodeCmd = process.platform === "win32" ? "node.exe" : "node";
    const child = spawn(nodeCmd, [scriptPath, action], {
      cwd: normalize(join(__dirname, "..")),
      // Don't use shell option with arguments to avoid security vulnerability
      // Windows can handle paths with forward slashes in Node.js spawn
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
      console.log(`📊 Script closed with exit code: ${code}`);
      if (code === 0) {
        console.log(`✅ Script executed successfully (exit code: ${code})`);
        resolve({ stdout, stderr, code });
      } else {
        console.error(`❌ Script execution failed (exit code: ${code})`);
        console.error(`📝 Stdout: ${stdout}`);
        console.error(`📝 Stderr: ${stderr}`);
        reject({ stdout, stderr, code });
      }
    });

    child.on("error", (error) => {
      console.error(`💥 Failed to spawn script: ${error.message}`);
      console.error(`💥 Error code: ${error.code}`);
      console.error(`💥 Error syscall: ${error.syscall}`);
      reject({
        error: error.message,
        errorCode: error.code,
        syscall: error.syscall,
      });
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

    // Send ntfy notification for successful block action
    await sendActionNtfyNotification("block");

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

    // Send ntfy notification for successful allow action
    await sendActionNtfyNotification("allow");

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

// API endpoint to get host monitoring status
app.get("/api/host-status", (req, res) => {
  res.json({
    ...hostStatus,
    config: {
      host: MONITOR_CONFIG.sshHost,
      checkIntervalMinutes: MONITOR_CONFIG.checkIntervalMinutes,
    },
  });
});

// ============================================================================
// HOST MONITORING FUNCTIONS
// ============================================================================

/**
 * Ping a host to check if it's up
 * @param {string} host - Hostname or IP to ping
 * @returns {Promise<boolean>} True if host is up, false otherwise
 */
async function pingHost(host) {
  try {
    // Validate host to prevent command injection
    // Only allow alphanumeric characters, dots, and hyphens
    if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
      console.error(`❌ Invalid host format: ${host}`);
      return false;
    }

    // Use ping command with 1 packet, 2 second timeout
    // Windows uses different flags than Unix/Linux/macOS
    let command;
    if (process.platform === "win32") {
      // Windows: -n = count, -w = timeout in milliseconds
      command = `ping -n 1 -w 2000 ${host}`;
    } else {
      // Unix/Linux/macOS: -c = count, -W = timeout in seconds
      command = `ping -c 1 -W 2 ${host}`;
    }

    // On Windows, exec may need shell:true for built-in commands
    const options = process.platform === "win32" ? { shell: true } : {};
    await execAsync(command, options);
    return true;
  } catch (error) {
    // Log error for debugging (silenced in production if needed)
    console.debug(`Ping failed for ${host}: ${error.message}`);
    return false;
  }
}

/**
 * Send notification via ntfy when host status changes or on server start
 * @param {boolean} isUp - Whether the host is up
 * @param {number} consecutiveFailures - Number of consecutive ping failures
 * @param {boolean} isStartup - Whether this is a startup notification
 */
async function sendNtfyNotification(
  isUp,
  consecutiveFailures,
  isStartup = false,
) {
  try {
    const status = isUp ? "ONLINE" : "OFFLINE";
    const emoji = isUp ? "✅" : "🚫";

    let title, message, tags;

    if (isStartup) {
      title = `🚀 Chess Control Monitor Started`;
      message = `${emoji} Host monitoring started for ${MONITOR_CONFIG.sshHost}. Initial status: ${status}`;
      tags = ["rocket", "host", "monitoring", "startup"];
    } else {
      title = `Host ${MONITOR_CONFIG.sshHost} is ${status}`;
      message = isUp
        ? `${emoji} Host ${MONITOR_CONFIG.sshHost} has come back online.`
        : `${emoji} Host ${MONITOR_CONFIG.sshHost} is offline. Consecutive failures: ${consecutiveFailures}`;
      tags = [isUp ? "white_check_mark" : "x", "host", "monitoring"];
    }

    const url = `${MONITOR_CONFIG.ntfyServer}/${MONITOR_CONFIG.ntfyTopic}`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        message: message,
        tags: tags,
        priority: isStartup ? 2 : isUp ? 2 : 4,
      }),
    });

    console.log(`📬 ntfy notification sent: ${title}`);
  } catch (error) {
    console.error(`❌ Failed to send ntfy notification: ${error.message}`);
  }
}

/**
 * Send notification via ntfy for block/allow actions
 * @param {string} action - The action performed ('block' or 'allow')
 */
async function sendActionNtfyNotification(action) {
  try {
    const emoji = action === "block" ? "🚫" : "✅";
    const actionText = action === "block" ? "Blocked" : "Allowed";
    const title = `${emoji} Chess Sites ${actionText}`;
    const message = `Chess sites have been ${action.toLowerCase()} via Chess Control Web App`;
    const tags = [
      action === "block" ? "no_entry" : "white_check_mark",
      "chess",
      "control",
    ];

    const url = `${MONITOR_CONFIG.ntfyServer}/${MONITOR_CONFIG.ntfyTopic}`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        message: message,
        tags: tags,
        priority: 3,
      }),
    });

    console.log(`📬 ntfy notification sent: ${title}`);
  } catch (error) {
    console.error(`❌ Failed to send ntfy notification: ${error.message}`);
  }
}

/**
 * Check host status and handle state changes
 */
async function checkHostStatus() {
  const timestamp = new Date().toISOString();
  const wasUp = hostStatus.isUp;

  console.log(`\n🔍 [${timestamp}] Pinging ${MONITOR_CONFIG.sshHost}...`);

  const isUp = await pingHost(MONITOR_CONFIG.sshHost);

  hostStatus.lastCheck = timestamp;
  hostStatus.isUp = isUp;

  if (!isUp) {
    hostStatus.consecutiveFailures++;
  } else {
    hostStatus.consecutiveFailures = 0;
  }

  // Detect status change (after initial check)
  if (wasUp !== null && wasUp !== isUp) {
    hostStatus.lastChange = timestamp;

    if (isUp) {
      console.log(
        `💚 [${timestamp}] Host ${MONITOR_CONFIG.sshHost} came back ONLINE`,
      );
    } else {
      console.log(
        `❤️ [${timestamp}] Host ${MONITOR_CONFIG.sshHost} went OFFLINE`,
      );
    }

    // Send ntfy notification on status change
    await sendNtfyNotification(isUp, hostStatus.consecutiveFailures);
  } else if (wasUp === null) {
    // Initial check
    console.log(
      `📊 [${timestamp}] Initial host status: ${isUp ? "ONLINE" : "OFFLINE"}`,
    );
    hostStatus.lastChange = timestamp;

    // Send startup notification
    await sendNtfyNotification(isUp, hostStatus.consecutiveFailures, true);
  } else {
    // No change
    const statusStr = isUp ? "ONLINE" : "OFFLINE";
    console.log(`📊 [${timestamp}] Host status unchanged: ${statusStr}`);
  }
}

/**
 * Start the host monitoring interval
 */
async function startHostMonitoring() {
  const intervalMs = MONITOR_CONFIG.checkIntervalMinutes * 60 * 1000;

  console.log(`\n🔍 Host monitoring started:`);
  console.log(`   Host: ${MONITOR_CONFIG.sshHost}`);
  console.log(
    `   Check interval: ${MONITOR_CONFIG.checkIntervalMinutes} minutes`,
  );
  console.log(`   ntfy topic: ${MONITOR_CONFIG.ntfyTopic}\n`);

  // Run initial check immediately
  await checkHostStatus();

  // Then run at regular intervals
  setInterval(checkHostStatus, intervalMs);
}

// Start host monitoring when server starts
startHostMonitoring();

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
