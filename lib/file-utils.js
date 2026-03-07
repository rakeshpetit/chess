/**
 * File Utilities
 * Handles file reading operations for hosts files
 * Windows-compatible version with proper line ending handling
 */

import fs from "fs";
import path from "path";
import os from "os";

/**
 * Reads the local hosts file content
 * @param {Object} config - Configuration object
 * @param {string} config.configDir - Directory containing config files
 * @param {string} config.blockedFileName - Name of blocking hosts file
 * @param {string} config.allowedFileName - Name of allowed hosts file
 * @param {boolean} isBlocking - Whether to use the blocking hosts file
 * @returns {Promise<string>} Content of the hosts file
 * @throws {Error} If file cannot be read
 */
export async function readLocalHostsFile(config, isBlocking) {
  const fileName = isBlocking ? config.blockedFileName : config.allowedFileName;
  const localPath = path.join(config.configDir, fileName);

  try {
    const content = fs.readFileSync(localPath, "utf8");
    // Normalize line endings to Unix-style (LF) for consistent SSH upload
    // This ensures Windows CRLF files work correctly with Linux remote servers
    return content.replace(/\r\n/g, "\n");
  } catch (error) {
    throw new Error(
      `Failed to read hosts file at ${localPath}: ${error.message}`,
    );
  }
}

/**
 * Gets file size information
 * @param {string} filePath - Path to the file
 * @returns {Promise<{size: number, string} | null>} File size info or null if file doesn't exist
 */
export function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      content: fs.readFileSync(filePath, "utf8"),
    };
  } catch (error) {
    return null;
  }
}
