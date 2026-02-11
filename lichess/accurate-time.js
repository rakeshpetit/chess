/**
 * Most Accurate Time Played Calculator
 * Uses move-based estimation for more precise time calculations
 */

import { fetchTodaysGames, formatTime } from "./index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function calculateMostAccurateTimeToday() {
  const username = process.env.LICHESS_USERNAME || "YourUsername";

  console.log("🎯 Most Accurate Time Played Today");
  console.log("===================================\n");

  try {
    const games = await fetchTodaysGames(username);

    if (games.length === 0) {
      console.log("No games played today.");
      return;
    }

    let totalTimeSeconds = 0;
    const detailedGames = [];

    console.log(
      `Analyzing ${games.length} games with move-based estimation...\n`,
    );

    games.forEach((game, index) => {
      let gameTimeSeconds = 0;

      if (game.timeControl !== "Correspondence") {
        // Parse time control
        const [minutes, increment] = game.timeControl.split("+").map(Number);
        const baseTimeSeconds = minutes * 60;
        const incrementSeconds = increment || 0;

        // More accurate estimation based on game length and type
        let averageTimePerMove = 30; // default

        // Adjust based on time control
        if (minutes <= 3) {
          averageTimePerMove = 15; // bullet games
        } else if (minutes <= 10) {
          averageTimePerMove = 25; // blitz/rapid
        } else {
          averageTimePerMove = 45; // classical
        }

        // Account for early resignations vs full games
        let timeMultiplier = 1;
        if (game.moves < 20) {
          timeMultiplier = 0.6; // Quick games use less time
        } else if (game.moves > 80) {
          timeMultiplier = 1.2; // Long games use more time
        }

        // Calculate estimated time
        const estimatedMoveTime =
          averageTimePerMove * game.moves * timeMultiplier +
          game.moves * incrementSeconds;

        gameTimeSeconds = Math.min(baseTimeSeconds, estimatedMoveTime);

        // Add some thinking time for complex positions
        if (game.moves > 40) {
          gameTimeSeconds += Math.min(120, game.moves * 2); // Extra thinking time
        }
      } else {
        // Correspondence games
        gameTimeSeconds = game.moves * 60;
      }

      totalTimeSeconds += gameTimeSeconds;

      const gameInfo = {
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
        url: game.url,
        efficiency:
          game.moves > 0 ? (gameTimeSeconds / game.moves).toFixed(1) : 0,
      };

      detailedGames.push(gameInfo);
    });

    // Display comprehensive summary
    console.log("📊 Comprehensive Time Analysis:");
    console.log("==============================");
    console.log(`🕐 Total time played: ${formatTime(totalTimeSeconds)}`);
    console.log(
      `⚡ Average per game: ${formatTime(totalTimeSeconds / games.length)}`,
    );
    console.log(`🎮 Total games: ${games.length}`);
    console.log(
      `📈 Time per move average: ${(
        totalTimeSeconds / games.reduce((sum, g) => sum + g.moves, 0)
      ).toFixed(1)} seconds`,
    );

    // Time control breakdown
    const timeControlStats = {};
    detailedGames.forEach((game) => {
      if (!timeControlStats[game.timeControl]) {
        timeControlStats[game.timeControl] = {
          count: 0,
          totalTime: 0,
          totalMoves: 0,
        };
      }
      timeControlStats[game.timeControl].count++;
      timeControlStats[game.timeControl].totalTime += parseTimeToSeconds(
        game.estimatedTime,
      );
      timeControlStats[game.timeControl].totalMoves +=
        games.find((g) => g.timeControl === game.timeControl && g.moves)
          .moves || 0;
    });

    console.log("\n⏱️  Time by Control Type:");
    Object.entries(timeControlStats).forEach(([control, stats]) => {
      const avgPerGame = stats.totalTime / stats.count;
      console.log(
        `${control}: ${formatTime(stats.totalTime)} (${
          stats.count
        } games, avg: ${formatTime(avgPerGame)})`,
      );
    });

    // Performance insights
    const wins = detailedGames.filter((g) => g.result === "Won").length;
    const losses = detailedGames.filter((g) => g.result === "Lost").length;
    const draws = detailedGames.filter((g) => g.result === "Draw").length;

    console.log("\n🏆 Performance Summary:");
    console.log(`Wins: ${wins}, Losses: ${losses}, Draws: ${draws}`);
    console.log(`Win rate: ${((wins / games.length) * 100).toFixed(1)}%`);

    // Show top 5 longest and shortest games
    const sortedByTime = [...detailedGames].sort(
      (a, b) =>
        parseTimeToSeconds(b.estimatedTime) -
        parseTimeToSeconds(a.estimatedTime),
    );

    console.log("\n🔥 Longest Games:");
    sortedByTime.slice(0, 3).forEach((game) => {
      console.log(
        `${game.gameNumber}. vs ${game.opponent} (${game.timeControl}) - ${game.estimatedTime} - ${game.result}`,
      );
    });

    console.log("\n⚡ Shortest Games:");
    sortedByTime
      .slice(-3)
      .reverse()
      .forEach((game) => {
        console.log(
          `${game.gameNumber}. vs ${game.opponent} (${game.timeControl}) - ${game.estimatedTime} - ${game.result}`,
        );
      });

    // Time distribution insights
    const totalMinutes = Math.floor(totalTimeSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    console.log("\n📊 Time Investment Analysis:");
    console.log(`Total chess time: ${totalHours}h ${remainingMinutes}m`);
    console.log(
      `Daily percentage: ${(((totalMinutes / 60) * 100) / 24).toFixed(
        1,
      )}% of your day`,
    );
    console.log(
      `Games per hour: ${(games.length / (totalMinutes / 60)).toFixed(1)}`,
    );

    if (totalHours >= 2) {
      console.log(
        "🎯 Significant chess session today! Great dedication to improvement.",
      );
    } else if (totalHours >= 1) {
      console.log("👍 Good chess practice session today.");
    } else {
      console.log("⚡ Quick chess session today.");
    }
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

// Run the most accurate analysis
calculateMostAccurateTimeToday();
