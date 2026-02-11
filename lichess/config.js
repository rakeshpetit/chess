/**
 * Lichess Monitor Configuration
 *
 * Modify these settings to customize your monitoring preferences
 */

import dotenv from "dotenv";
dotenv.config();

export const MONITOR_CONFIG = {
  // Your Lichess username
  username: process.env.LICHESS_USERNAME || "LichessUser",

  // How often to check (in minutes)
  checkIntervalMinutes: 5,

  // Daily limits
  limits: {
    maxGamesPerDay: 10, // Maximum games per day
    maxHoursPerDay: 2, // Maximum hours per day
    maxMinutesPerGame: 15, // Alert if any game exceeds this
  },

  // Alert settings
  alerts: {
    showProgressUpdates: true, // Show progress bars
    showGameByGameBreakdown: false, // Show detailed game analysis
    warningThreshold: 80, // Show warning at 80% of limit
  },

  // Display settings
  display: {
    showTimestamps: true,
    showEmojis: true,
    compactMode: false,
  },
};

// Helper function to convert config to internal format
export function getInternalConfig() {
  return {
    username: MONITOR_CONFIG.username,
    checkInterval: MONITOR_CONFIG.checkIntervalMinutes * 60 * 1000,
    limits: {
      maxGamesPerDay: MONITOR_CONFIG.limits.maxGamesPerDay,
      maxTimePerDay: MONITOR_CONFIG.limits.maxHoursPerDay * 60 * 60,
      maxTimePerGame: MONITOR_CONFIG.limits.maxMinutesPerGame * 60,
    },
    alerts: MONITOR_CONFIG.alerts,
    display: MONITOR_CONFIG.display,
  };
}
