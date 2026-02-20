import {
  createSSHClient,
  executeSSHCommand,
  buildSudoCommand,
  buildHostsUploadCommand,
  buildBrowserKillCommand,
} from "./lib/ssh.js";
import { readLocalHostsFile as readHostsFile } from "./lib/file-utils.js";
import readline from "readline";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONSTANTS
// ============================================================================

const SSH_CONFIG = {
  host: process.env.SSH_HOST || "192.168.0.10",
  username: process.env.SSH_USERNAME || "user",
  suspendChess: true,
  password: process.env.SSH_PASSWORD || "password",
  readyTimeout: 30000,
  keepaliveInterval: 10000,
  keepaliveCountMax: 3,
};

const TIMER_CONFIG = {
  waitTimeMinutes: 0,
  updateIntervalSeconds: 2,
};

const PROGRESS_BAR_WIDTH = 30;
const REMOTE_HOSTS_PATH = "/etc/hosts";
const REMOTE_HOSTS_BACKUP_PATH = "/etc/hosts.backup";
const BROWSERS_TO_KILL = ["firefox", "brave"];
const PKILL_SUCCESS_CODE = 0;
const PKILL_NO_PROCESSES_CODE = 1;

const HOSTS_FILE_NAMES = {
  BLOCKED: "hostsuncommented",
  ALLOWED: "hostscommented",
};

const EMOJI = {
  SUCCESS: "✅",
  ERROR: "❌",
  INFO: "ℹ️",
  TIMER: "⏱️",
  CLOCK: "⏰",
  HOURGLASS: "⏳",
  BLOCK: "🚫",
  FIRE: "🔥",
  FILE: "📄",
  FOLDER: "📁",
  WRITE: "📝",
  CONNECTION: "🔌",
  LOCK: "🔐",
  ROCKET: "🚀",
  SPARKLES: "✨",
  PARTY: "🎉",
  STOP: "🛑",
  CHART: "📊",
  BOOM: "💥",
};

const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
};

const COMMAND_LINE_ARGS = {
  BLOCK: "block",
  ALLOW: "allow",
};

// ============================================================================
// UTILITIES
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Promisifies the readline question method
 * @param {string} prompt - The prompt to display
 * @returns {Promise<string>} The user's input
 */
function promptPassword(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Clears the current line in the terminal
 */
function clearLine() {
  process.stdout.write("\r\x1b[K");
}

/**
 * Formats seconds into a human-readable time string
 * @param {number} seconds - Total seconds to format
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Creates a progress bar string
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} width - Width of the progress bar in characters
 * @returns {string} Progress bar string
 */
function createProgressBar(progress, width = PROGRESS_BAR_WIDTH) {
  const filledWidth = Math.floor(width * (progress / 100));
  const filled = "█".repeat(filledWidth);
  const empty = "░".repeat(width - filledWidth);
  return `${filled}${empty}`;
}

/**
 * Logs a message with an emoji prefix
 * @param {string} emoji - Emoji to prefix the message
 * @param {string} message - Message to log
 */
function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

/**
 * Logs an error message
 * @param {string} message - Error message to log
 */
function logError(message) {
  console.error(`${EMOJI.ERROR} ${message}`);
}

/**
 * Logs a success message
 * @param {string} message - Success message to log
 */
function logSuccess(message) {
  console.log(`${EMOJI.SUCCESS} ${message}`);
}

/**
 * Logs SSH command output with emoji prefix
 * @param {string} output - Command output to log
 */
function logSSHOutput(output) {
  log(EMOJI.WRITE, `Command output: ${output.trim()}`);
}

/**
 * Creates a wrapped SSH command executor with logging
 * @param {Client} conn - SSH client connection
 * @returns {Function} Command executor function
 */
function createLoggedCommandExecutor(conn) {
  return async (command) => {
    const result = await executeSSHCommand(conn, command);
    if (result.output) {
      logSSHOutput(result.output);
    }
    return result;
  };
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Reads the appropriate local hosts file based on blocking mode
 * @param {boolean} isBlocking - Whether to use the blocking hosts file
 * @returns {Promise<string>} Content of the hosts file
 */
async function readLocalHostsFile(isBlocking) {
  const config = {
    configDir: path.join(process.cwd(), "config"),
    blockedFileName: HOSTS_FILE_NAMES.BLOCKED,
    allowedFileName: HOSTS_FILE_NAMES.ALLOWED,
  };

  const hostsFileName = isBlocking
    ? HOSTS_FILE_NAMES.BLOCKED
    : HOSTS_FILE_NAMES.ALLOWED;

  log(EMOJI.FILE, `Using hosts file: ${hostsFileName}`);
  log(EMOJI.FOLDER, `Local path: ${path.join(config.configDir, hostsFileName)}`);

  try {
    const hostsContent = await readHostsFile(config, isBlocking);
    logSuccess(`Read local hosts file (${hostsContent.length} characters)`);
    return hostsContent;
  } catch (error) {
    logError(`Error reading local hosts file: ${error.message}`);
    throw error;
  }
}

/**
 * Builds the full hosts file upload command with sudo
 * @param {string} password - sudo password
 * @param {string} hostsContent - Content to write
 * @returns {string} Complete sudo-enabled upload command
 */
function buildCompleteUploadCommand(password, hostsContent) {
  const uploadPart = buildHostsUploadCommand(
    REMOTE_HOSTS_PATH,
    REMOTE_HOSTS_BACKUP_PATH,
    hostsContent
  );
  return buildSudoCommand(password, uploadPart);
}

// ============================================================================
// SSH CONNECTION FUNCTIONS
// ============================================================================

/**
 * Sets up SSH connection event handlers
 * @param {Client} conn - SSH client connection
 * @param {Function} onReady - Callback when connection is ready
 * @param {Function} onError - Callback on error
 * @param {Function} onTimeout - Callback on timeout
 */
function setupSSHHandlers(conn, onReady, onError, onTimeout) {
  conn.on("ready", onReady);
  conn.on("error", onError);
  conn.on("timeout", onTimeout);
}

/**
 * Establishes SSH connection with authentication
 * @param {Client} conn - SSH client connection
 * @returns {Promise<void>}
 */
async function establishSSHConnection(conn) {
  log(
    EMOJI.CONNECTION,
    `Attempting SSH connection to ${SSH_CONFIG.username}@${SSH_CONFIG.host}...`,
  );

  if (!SSH_CONFIG.password && !SSH_CONFIG.privateKey) {
    const password = await promptPassword(
      `${EMOJI.LOCK} Enter password for ${SSH_CONFIG.username}@${SSH_CONFIG.host}: `,
    );
    SSH_CONFIG.password = password;
  }

  return new Promise((resolve, reject) => {
    setupSSHHandlers(
      conn,
      () => {
        logSuccess("SSH connection established");
        resolve();
      },
      (err) => {
        logError(`SSH connection error: ${err.message}`);
        reject(err);
      },
      () => {
        logError("SSH connection timed out");
        reject(new Error("SSH connection timeout"));
      },
    );

    conn.connect(SSH_CONFIG);
  });
}

/**
 * Kills browser processes on the remote machine
 * @param {Client} conn - SSH client connection
 * @param {string} browserName - Name of the browser process to kill
 * @param {Function} executeCommand - Command executor function
 * @returns {Promise<void>}
 */
async function killBrowserProcess(conn, browserName, executeCommand) {
  try {
    const command = buildBrowserKillCommand([browserName]);
    const { code } = await executeCommand(command);

    if (code === PKILL_SUCCESS_CODE) {
      logSuccess(`${browserName} processes killed successfully`);
    } else if (code === PKILL_NO_PROCESSES_CODE) {
      log(EMOJI.INFO, `No ${browserName} processes found to kill`);
    } else {
      logError(`Failed to kill ${browserName}, exit code: ${code}`);
    }
  } catch (error) {
    logError(`Error killing ${browserName}: ${error.message}`);
    throw error;
  }
}

/**
 * Kills all configured browser processes
 * @param {Client} conn - SSH client connection
 * @param {Function} executeCommand - Command executor function
 * @returns {Promise<void>}
 */
async function killAllBrowsers(conn, executeCommand) {
  for (const browser of BROWSERS_TO_KILL) {
    await killBrowserProcess(conn, browser, executeCommand);
  }
}

/**
 * Uploads the hosts file to the remote server using the modular utilities
 * @param {Client} conn - SSH client connection
 * @param {string} hostsContent - Content of the hosts file
 * @param {Function} executeCommand - Command executor function
 * @returns {Promise<void>}
 */
async function uploadHostsFile(conn, hostsContent, executeCommand) {
  const uploadCommand = buildCompleteUploadCommand(SSH_CONFIG.password, hostsContent);
  const { code } = await executeCommand(uploadCommand);

  if (code !== 0) {
    throw new Error(`Upload failed with exit code ${code}`);
  }

  logSuccess("Hosts file updated successfully");
}

/**
 * Executes all remote commands via SSH
 * @returns {Promise<void>}
 */
async function executeRemoteCommands() {
  const conn = createSSHClient();

  try {
    await establishSSHConnection(conn);

    // Create a logged command executor
    const executeCommand = createLoggedCommandExecutor(conn);

    const hostsContent = await readLocalHostsFile(SSH_CONFIG.suspendChess);
    await uploadHostsFile(conn, hostsContent, executeCommand);
    await killAllBrowsers(conn, executeCommand);

    log(EMOJI.PARTY, "All commands executed successfully!");
  } finally {
    conn.end();
  }
}

// ============================================================================
// TIMER FUNCTIONS
// ============================================================================

/**
 * Gets the timer action description based on blocking mode
 * @param {boolean} isBlocking - Whether in blocking mode
 * @returns {{action: string, emoji: string}} Action description and emoji
 */
function getTimerAction(isBlocking) {
  return {
    action: isBlocking ? "blocking" : "unblocking",
    emoji: isBlocking ? EMOJI.BLOCK : EMOJI.SUCCESS,
  };
}

/**
 * Displays timer progress with progress bar
 * @param {number} elapsedSeconds - Elapsed time in seconds
 * @param {number} totalSeconds - Total time in seconds
 * @param {string} emoji - Emoji to display
 */
function displayTimerProgress(elapsedSeconds, totalSeconds, emoji) {
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const elapsedTime = formatTime(elapsedSeconds);
  const remainingTime = formatTime(remainingSeconds);
  const progress = ((elapsedSeconds / totalSeconds) * 100).toFixed(1);
  const progressBar = createProgressBar(parseFloat(progress));

  clearLine();
  process.stdout.write(
    `${EMOJI.HOURGLASS} ${emoji} Progress: [${progressBar}] ${progress}% | ` +
      `Elapsed: ${elapsedTime} | Remaining: ${remainingTime}`,
  );
}

/**
 * Starts a countdown timer with progress display
 * @param {boolean} isBlocking - Whether in blocking mode
 * @returns {Promise<void>}
 */
function startTimer(isBlocking = true) {
  return new Promise((resolve) => {
    const totalSeconds = TIMER_CONFIG.waitTimeMinutes * 60;
    const updateInterval = TIMER_CONFIG.updateIntervalSeconds * 1000;
    let elapsedSeconds = 0;

    const { action, emoji } = getTimerAction(isBlocking);

    log(
      EMOJI.TIMER,
      `Timer started: Waiting ${TIMER_CONFIG.waitTimeMinutes} minutes before ${action} chess sites`,
    );
    log(
      EMOJI.CHART,
      `Display updates every ${TIMER_CONFIG.updateIntervalSeconds} seconds\n`,
    );

    const timer = setInterval(() => {
      elapsedSeconds += TIMER_CONFIG.updateIntervalSeconds;
      const remainingSeconds = totalSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        clearInterval(timer);
        process.off("SIGINT", sigintHandler);
        clearLine();
        log(
          EMOJI.CLOCK,
          `Timer completed! Proceeding to ${action} chess sites...\n`,
        );
        resolve();
        return;
      }

      displayTimerProgress(elapsedSeconds, totalSeconds, emoji);
    }, updateInterval);

    // Handle Ctrl+C gracefully
    const sigintHandler = () => {
      clearInterval(timer);
      clearLine();
      log(EMOJI.STOP, "Timer cancelled by user");
      process.exit(EXIT_CODES.SUCCESS);
    };

    process.on("SIGINT", sigintHandler);
  });
}

// ============================================================================
// MAIN EXECUTION FUNCTIONS
// ============================================================================

/**
 * Logs the script mode based on blocking setting
 * @param {boolean} isBlocking - Whether in blocking mode
 */
function logScriptMode(isBlocking) {
  if (isBlocking) {
    log(
      EMOJI.BLOCK,
      "Mode: BLOCKING chess sites (lichess.org will be blocked)",
    );
  } else {
    log(
      EMOJI.SUCCESS,
      "Mode: ALLOWING chess sites (lichess.org will be accessible)",
    );
  }
}

/**
 * Parses command-line arguments to determine blocking mode
 * @param {string[]} args - Command-line arguments
 * @returns {boolean|null} Whether to block, or null if invalid
 */
function parseCommandLineArgs(args) {
  if (args.length === 0) {
    return SSH_CONFIG.suspendChess;
  }

  if (args.length === 1) {
    const command = args[0].toLowerCase();

    if (command === COMMAND_LINE_ARGS.BLOCK) {
      return true;
    }

    if (command === COMMAND_LINE_ARGS.ALLOW) {
      return false;
    }

    logError(`Invalid argument: ${command}`);
    return null;
  }

  logError("Too many arguments");
  return null;
}

/**
 * Displays usage information
 */
function displayUsage() {
  logError("Usage: node suspend-chess.js [block|allow]");
  console.error(`  ${COMMAND_LINE_ARGS.BLOCK} - Block chess sites`);
  console.error(`  ${COMMAND_LINE_ARGS.ALLOW} - Allow chess sites`);
  console.error("  (no argument) - Use default from config");
}

/**
 * Main execution function that can be called programmatically
 * @param {boolean} shouldBlock - Whether to block chess sites
 * @returns {Promise<boolean>} True if successful
 */
export async function suspendChess(shouldBlock = SSH_CONFIG.suspendChess) {
  const originalSetting = SSH_CONFIG.suspendChess;
  SSH_CONFIG.suspendChess = shouldBlock;

  try {
    log(EMOJI.ROCKET, "Starting chess suspension script...");
    logScriptMode(SSH_CONFIG.suspendChess);

    log(
      EMOJI.TIMER,
      `Timer configured for ${TIMER_CONFIG.waitTimeMinutes} minutes\n`,
    );

    await startTimer(SSH_CONFIG.suspendChess);

    log(
      EMOJI.CONNECTION,
      `Connecting to ${SSH_CONFIG.username}@${SSH_CONFIG.host}...`,
    );

    await executeRemoteCommands();

    log(EMOJI.SPARKLES, "Script completed successfully!");
    return true;
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    throw error;
  } finally {
    SSH_CONFIG.suspendChess = originalSetting;
  }
}

/**
 * Main entry point for the script
 * @returns {Promise<void>}
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const shouldBlock = parseCommandLineArgs(args);

    if (shouldBlock === null) {
      displayUsage();
      process.exit(EXIT_CODES.ERROR);
    }

    await suspendChess(shouldBlock);
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
