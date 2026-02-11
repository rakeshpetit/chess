/**
 * Simple Time Played Today Calculator
 * Focus on calculating total time played in chess games today
 */

import { fetchTodaysGames, formatTime } from "./index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function calculateSimpleTimePlayedToday() {
  const username = process.env.LICHESS_USERNAME || "YourUsername";

  console.log("⏱️  Calculating Time Played Today");
  console.log("==================================\n");

  try {
    const games = await fetchTodaysGames(username);

    if (games.length === 0) {
      console.log("No games played today.");
      return;
    }

    let totalTimeSeconds = 0;
    const gameTimeBreakdown = [];

    console.log(`Analyzing ${games.length} games...\n`);

    games.forEach((game, index) => {
      let gameTimeSeconds = 0;

      if (game.timeControl !== "Correspondence") {
        // Parse time control (e.g., "10+0" or "15+10")
        const [minutes, increment] = game.timeControl.split("+").map(Number);
        const baseTimeSeconds = minutes * 60;
        const incrementSeconds = increment || 0;

        // Estimate time used based on moves
        // This is an approximation: assume average of 30 seconds per move + increment
        const estimatedTimeUsed = Math.min(
          baseTimeSeconds,
          game.moves * 30 + game.moves * incrementSeconds,
        );

        gameTimeSeconds = estimatedTimeUsed;
      } else {
        // Correspondence games - rough estimate
        gameTimeSeconds = game.moves * 60; // 1 minute per move
      }

      totalTimeSeconds += gameTimeSeconds;

      gameTimeBreakdown.push({
        gameNumber: index + 1,
        timeControl: game.timeControl,
        moves: game.moves,
        estimatedTime: formatTime(gameTimeSeconds),
        opponent: game.white === username ? game.black : game.white,
        result:
          game.winner === username
            ? "Won"
            : game.winner === "draw"
              ? "Draw"
              : "Lost",
      });
    });

    // Display summary
    console.log("📊 Time Summary:");
    console.log(`Total time played: ${formatTime(totalTimeSeconds)}`);
    console.log(
      `Average per game: ${formatTime(totalTimeSeconds / games.length)}`,
    );
    console.log(`Total games: ${games.length}`);

    // Group by time control
    const timeControlGroups = {};
    gameTimeBreakdown.forEach((game) => {
      if (!timeControlGroups[game.timeControl]) {
        timeControlGroups[game.timeControl] = {
          count: 0,
          totalTime: 0,
          games: [],
        };
      }
      timeControlGroups[game.timeControl].count++;
      timeControlGroups[game.timeControl].totalTime += parseTimeToSeconds(
        game.estimatedTime,
      );
      timeControlGroups[game.timeControl].games.push(game);
    });

    console.log("\n⏱️  Time by Control:");
    Object.entries(timeControlGroups).forEach(([control, data]) => {
      console.log(
        `${control}: ${formatTime(data.totalTime)} across ${data.count} games`,
      );
    });

    // Show individual game times
    console.log("\n🎮 Individual Game Times:");
    gameTimeBreakdown.forEach((game) => {
      console.log(
        `${game.gameNumber}. vs ${game.opponent} (${game.timeControl}) - ${game.estimatedTime} - ${game.result}`,
      );
    });

    // Time distribution
    const totalMinutes = Math.floor(totalTimeSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    console.log("\n📈 Time Distribution:");
    console.log(`Total chess time today: ${totalHours}h ${remainingMinutes}m`);
    console.log(
      `That's ${(((totalMinutes / 60) * 100) / 24).toFixed(
        1,
      )}% of your day spent playing chess!`,
    );
  } catch (error) {
    console.error("Error calculating time:", error.message);
  }
}

// Helper function to parse time string back to seconds
function parseTimeToSeconds(timeString) {
  const parts = timeString.split(" ");
  let seconds = 0;

  parts.forEach((part) => {
    if (part.includes("h")) {
      seconds += parseInt(part) * 3600;
    } else if (part.includes("m")) {
      seconds += parseInt(part) * 60;
    } else if (part.includes("s")) {
      seconds += parseInt(part);
    }
  });

  return seconds;
}

// Run the analysis
calculateSimpleTimePlayedToday();
