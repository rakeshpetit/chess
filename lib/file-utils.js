/**
 * File Utilities
 * Handles file reading operations for hosts files
 */

import fs from "fs";
import path from "path";

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
  const fileName = isBlocking
    ? config.blockedFileName
    : config.allowedFileName;
  const localPath = path.join(config.configDir, fileName);

  try {
    const content = fs.readFileSync(localPath, "utf8");
    return content;
  } catch (error) {
    throw new Error(`Failed to read hosts file at ${localPath}: ${error.message}`);
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
      content: fs.readFileSync(filePath, "utf8")
    };
  } catch (error) {
    return null;
  }
}
