/**
 * Chess Control Commands
 * Shared utility for parsing chess control commands
 */

/**
 * Parse the message to determine the action
 * @param {string} message - The message to parse
 * @param {string[]} tags - Array of tags
 * @returns {boolean|null} true to block, false to allow, null if no valid command
 */
export function parseChessCommand(message, tags = []) {
  const messageLower = message?.toLowerCase() || "";
  const tagsList = (tags || []).map((t) => t.toLowerCase());

  // Check tags first
  if (tagsList.includes("block") || tagsList.includes("suspend")) {
    return true;
  }
  if (tagsList.includes("allow") || tagsList.includes("unblock")) {
    return false;
  }

  // Check message content
  if (
    messageLower.includes("block") ||
    messageLower.includes("suspend") ||
    messageLower.includes("stop chess") ||
    messageLower.includes("disable chess")
  ) {
    return true;
  }

  if (
    messageLower.includes("allow") ||
    messageLower.includes("unblock") ||
    messageLower.includes("enable chess") ||
    messageLower.includes("start chess")
  ) {
    return false;
  }

  // Return null if no valid command found
  return null;
}
