/**
 * Lichess Profile Monitor
 *
 * This script monitors your Lichess profile every 5 minutes to track:
 * - Number of games played today
 * - Total time played today
 * - Time spent per game
 *
 * It will alert you when you exceed configurable limits to help manage your chess playing time.
 *
 * Usage: node chess/monitor.js
 */

import {
  fetchTodaysGames,
  calculateTotalTimePlayedToday,
  formatTime,
} from "./index.js";
import { getInternalConfig } from "./config.js";

// Load configuration
const CONFIG = getInternalConfig();

// Store previous state to detect changes
let previousState = {
  gameCount: 0,
  totalTimeSeconds: 0,
  lastGameId: null,
};

// Alert tracking to avoid spam
let alertState = {
  gameCountExceeded: false,
  totalTimeExceeded: false,
  longGameAlerted: new Set(), // Track which games we've already alerted about
};

/**
 * Check current daily stats and compare against limits
 */
async function checkDailyLimits() {
  try {
    console.log(
      `\n⏰ ${new Date().toLocaleTimeString()} - Checking daily limits...`
    );

    // Get today's games
    const todaysGames = await fetchTodaysGames(CONFIG.username);
    const timeStats = await calculateTotalTimePlayedToday(CONFIG.username);

    const currentStats = {
      gameCount: todaysGames.length,
      totalTimeSeconds: timeStats.totalTimeSeconds,
      lastGameId: todaysGames[0]?.id || null,
    };

    // Check if new games were played
    const newGames = currentStats.gameCount - previousState.gameCount;
    const newGamePlayed = currentStats.lastGameId !== previousState.lastGameId;

    if (newGamePlayed && newGames > 0) {
      console.log(`🎮 ${newGames} new game(s) detected!`);
    }

    // Display current status
    console.log(`📊 Current Status:`);
    console.log(
      `   Games today: ${currentStats.gameCount}/${CONFIG.limits.maxGamesPerDay}`
    );
    console.log(
      `   Time today: ${formatTime(
        currentStats.totalTimeSeconds
      )} / ${formatTime(CONFIG.limits.maxTimePerDay)}`
    );
    console.log(`   Average per game: ${timeStats.averageTimePerGame}`);

    // Check game count limit
    if (currentStats.gameCount >= CONFIG.limits.maxGamesPerDay) {
      if (!alertState.gameCountExceeded) {
        console.log(`\n🚨 ALERT: Game limit exceeded! 🚨`);
        console.log(
          `You've played ${currentStats.gameCount} games today (limit: ${CONFIG.limits.maxGamesPerDay})`
        );
        console.log(`Consider taking a break! 🧘‍♂️`);
        alertState.gameCountExceeded = true;
      }
    } else {
      alertState.gameCountExceeded = false;
    }

    // Check total time limit
    if (currentStats.totalTimeSeconds >= CONFIG.limits.maxTimePerDay) {
      if (!alertState.totalTimeExceeded) {
        console.log(`\n🚨 ALERT: Daily time limit exceeded! 🚨`);
        console.log(
          `You've played for ${formatTime(
            currentStats.totalTimeSeconds
          )} today (limit: ${formatTime(CONFIG.limits.maxTimePerDay)})`
        );
        console.log(`Time to step away from the board! 🚶‍♂️`);
        alertState.totalTimeExceeded = true;
      }
    } else {
      alertState.totalTimeExceeded = false;
    }

    // Check for long individual games
    if (CONFIG.alerts.showGameByGameBreakdown && timeStats.gameTimeDetails) {
      timeStats.gameTimeDetails.forEach((game) => {
        if (
          game.estimatedTimeSeconds >= CONFIG.limits.maxTimePerGame &&
          !alertState.longGameAlerted.has(game.id)
        ) {
          console.log(
            `\n⚠️  Long game detected: ${game.estimatedTimeFormatted} (${game.timeControl})`
          );
          console.log(`   Game ID: ${game.id}`);
          alertState.longGameAlerted.add(game.id);
        }
      });
    }

    // Show progress bars
    if (CONFIG.alerts.showProgressUpdates) {
      showProgressBar(
        "Games",
        currentStats.gameCount,
        CONFIG.limits.maxGamesPerDay
      );
      showProgressBar(
        "Time",
        currentStats.totalTimeSeconds,
        CONFIG.limits.maxTimePerDay,
        true
      );
    }

    // Update previous state
    previousState = currentStats;

    // Show warning if approaching limits
    const gameProgress =
      (currentStats.gameCount / CONFIG.limits.maxGamesPerDay) * 100;
    const timeProgress =
      (currentStats.totalTimeSeconds / CONFIG.limits.maxTimePerDay) * 100;

    if (
      gameProgress >= 80 &&
      gameProgress < 100 &&
      !alertState.gameCountExceeded
    ) {
      console.log(
        `\n⚠️  Warning: You're at ${gameProgress.toFixed(
          1
        )}% of your daily game limit`
      );
    }

    if (
      timeProgress >= 80 &&
      timeProgress < 100 &&
      !alertState.totalTimeExceeded
    ) {
      console.log(
        `\n⚠️  Warning: You're at ${timeProgress.toFixed(
          1
        )}% of your daily time limit`
      );
    }
  } catch (error) {
    console.error("Error checking daily limits:", error.message);
  }
}

/**
 * Display a progress bar for limits
 */
function showProgressBar(label, current, max, isTime = false) {
  const percentage = Math.min((current / max) * 100, 100);
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

  const currentDisplay = isTime ? formatTime(current) : current.toString();
  const maxDisplay = isTime ? formatTime(max) : max.toString();

  const color = percentage >= 100 ? "🔴" : percentage >= 80 ? "🟡" : "🟢";

  console.log(
    `${color} ${label}: [${bar}] ${percentage.toFixed(
      1
    )}% (${currentDisplay}/${maxDisplay})`
  );
}

/**
 * Reset daily tracking at midnight
 */
function resetDailyTracking() {
  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const msUntilMidnight = tomorrow - now;

  setTimeout(() => {
    console.log("\n🌅 New day started! Resetting daily tracking...");
    previousState = {
      gameCount: 0,
      totalTimeSeconds: 0,
      lastGameId: null,
    };
    alertState = {
      gameCountExceeded: false,
      totalTimeExceeded: false,
      longGameAlerted: new Set(),
    };

    // Set up daily reset for next day
    resetDailyTracking();
  }, msUntilMidnight);

  const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutes = Math.floor(
    (msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)
  );
  console.log(`⏰ Daily reset scheduled in ${hours}h ${minutes}m`);
}

/**
 * Display configuration on startup
 */
function displayConfiguration() {
  console.log("\n🎯 Lichess Monitor Configuration:");
  console.log("================================");
  console.log(`Username: ${CONFIG.username}`);
  console.log(`Check interval: ${CONFIG.checkInterval / 60000} minutes`);
  console.log(`Max games per day: ${CONFIG.limits.maxGamesPerDay}`);
  console.log(`Max time per day: ${formatTime(CONFIG.limits.maxTimePerDay)}`);
  console.log(`Max time per game: ${formatTime(CONFIG.limits.maxTimePerGame)}`);
  console.log(
    `Progress updates: ${CONFIG.alerts.showProgressUpdates ? "ON" : "OFF"}`
  );
  console.log(
    `Game breakdown: ${CONFIG.alerts.showGameByGameBreakdown ? "ON" : "OFF"}`
  );
  console.log("================================\n");
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown() {
  process.on("SIGINT", () => {
    console.log("\n\n👋 Shutting down Lichess monitor...");
    console.log("📊 Final stats for today:");
    console.log(`   Games played: ${previousState.gameCount}`);
    console.log(
      `   Time played: ${formatTime(previousState.totalTimeSeconds)}`
    );
    console.log("\nStay strong! 💪");
    process.exit(0);
  });
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  //   displayConfiguration();
  //   setupGracefulShutdown();
  //   resetDailyTracking();

  console.log("🚀 Starting Lichess profile monitoring...");
  console.log("Press Ctrl+C to stop monitoring\n");

  // Run initial check
  await checkDailyLimits();

  // Set up periodic checks
  setInterval(async () => {
    await checkDailyLimits();
  }, CONFIG.checkInterval);

  console.log(
    `\n✅ Monitoring started! Checking every ${
      CONFIG.checkInterval / 60000
    } minutes...`
  );
}

// Export configuration for easy modification
export { CONFIG };

// Start monitoring if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring().catch((error) => {
    console.error("Failed to start monitoring:", error);
    process.exit(1);
  });
}
