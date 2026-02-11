/**
 * Today's Games Analysis - Focused Example
 * Shows games played today with time controls and completion status
 */

import { fetchTodaysGames, displayTodaysGamesSummary } from "./index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function analyzeTodaysGames() {
  const username = process.env.LICHESS_USERNAME || "YourUsername";

  console.log("🎯 Today's Chess Games Analysis");
  console.log("================================\n");

  try {
    // Get today's games with detailed info
    const todaysGames = await fetchTodaysGames(username);

    if (todaysGames.length === 0) {
      console.log("No games played today.");
      return;
    }

    // Display summary
    await displayTodaysGamesSummary(username);

    // Additional analysis
    console.log("\n🔍 Detailed Analysis:");
    console.log("=====================");

    // Group by time control
    const timeControlGroups = {};
    todaysGames.forEach((game) => {
      if (!timeControlGroups[game.timeControl]) {
        timeControlGroups[game.timeControl] = [];
      }
      timeControlGroups[game.timeControl].push(game);
    });

    Object.entries(timeControlGroups).forEach(([timeControl, games]) => {
      const wins = games.filter((g) => g.winner === username).length;
      const losses = games.filter(
        (g) => g.winner !== username && g.winner !== "draw",
      ).length;
      const draws = games.filter((g) => g.winner === "draw").length;
      const completed = games.filter((g) => g.hasResult).length;

      console.log(`\n⏱️ ${timeControl} (${games.length} games):`);
      console.log(`   Wins: ${wins}, Losses: ${losses}, Draws: ${draws}`);
      console.log(
        `   Completed: ${completed}/${games.length} (${(
          (completed / games.length) *
          100
        ).toFixed(1)}%)`,
      );
    });

    // Show game status breakdown
    console.log("\n📊 Game Status Breakdown:");
    const statusCounts = {};
    todaysGames.forEach((game) => {
      statusCounts[game.status] = (statusCounts[game.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} games`);
    });
  } catch (error) {
    console.error("Error analyzing today's games:", error.message);
  }
}

// Run the analysis
analyzeTodaysGames();
