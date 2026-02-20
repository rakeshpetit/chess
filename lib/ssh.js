/**
 * SSH Client Utilities
 * Handles SSH connection and command execution with proper separation of concerns
 */

import { Client } from "ssh2";

/**
 * Creates a new SSH client instance
 * @returns {Client} A new SSH client
 */
export function createSSHClient() {
  return new Client();
}

/**
 * Executes a command on a remote SSH server
 * @param {Client} conn - SSH client connection
 * @param {string} command - Command to execute
 * @returns {Promise<{code: number, output: string}>} Command execution result
 */
export function executeSSHCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        return reject(err);
      }

      let output = "";

      stream.on("data", (data) => {
        output += data.toString();
      });

      stream.on("close", (code) => {
        resolve({ code, output });
      });

      stream.on("error", (err) => {
        reject(err);
      });
    });
  });
}

/**
 * Escapes a string for safe shell usage
 * @param {string} str - String to escape
 * @returns {string} Shell-escaped string
 */
export function escapeForShell(str) {
  return str.replace(/'/g, "'\\''");
}

/**
 * Builds a sudo command with password authentication
 * @param {string} password - The sudo password
 * @param {string} command - The command to run with sudo
 * @returns {string} The complete sudo command string
 */
export function buildSudoCommand(password, command) {
  // Escape single quotes in the command for use inside single-quoted bash -c string
  const escapedCommand = command.replace(/'/g, "'\\''");
  return `echo '${escapeForShell(password)}' | sudo -S bash -c '${escapedCommand}'`;
}

/**
 * Builds a hosts file upload command
 * @param {string} remoteHostsPath - Path to remote hosts file
 * @param {string} remoteBackupPath - Path to remote backup file
 * @param {string} hostsContent - Content to write to hosts file
 * @returns {string} The complete upload command
 */
export function buildHostsUploadCommand(remoteHostsPath, remoteBackupPath, hostsContent) {
  // Use tee with a here-document to handle multi-line content properly
  const escapedContent = hostsContent.replace(/'/g, "'\\''");
  return `cp ${remoteHostsPath} ${remoteBackupPath} && printf '%s\\n' '${escapedContent}' > ${remoteHostsPath}`;
}

/**
 * Builds a browser kill command
 * @param {string[]} browsers - Array of browser names to kill
 * @returns {string} The complete kill command
 */
export function buildBrowserKillCommand(browsers) {
  const browserList = browsers.join(" ");
  return `pkill -f '${browserList}' || true`;
}
