/**
 * Simple Today's Games Analyzer
 * Focus on: Games played today, time controls, and completion status
 */

import { fetchTodaysGames } from "./index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function simpleTodaysAnalysis() {
  const username = process.env.LICHESS_USERNAME || "YourUsername";

  console.log("📅 Today's Chess Games Analysis");
  console.log("================================\n");

  try {
    const games = await fetchTodaysGames(username);

    if (games.length === 0) {
      console.log("No games played today.");
      return;
    }

    console.log(`Total games played today: ${games.length}\n`);

    // Show each game with the requested details
    games.forEach((game, index) => {
      const time = game.createdAt.toLocaleTimeString();
      const completionStatus = game.hasResult
        ? "Completed"
        : "Abandoned/Aborted";
      const resultEmoji = game.hasResult ? "✅" : "❌";

      console.log(
        `${index + 1}. ${resultEmoji} ${time} - ${game.white} vs ${game.black}`,
      );
      console.log(`   Time Control: ${game.timeControl}`);
      console.log(`   Status: ${completionStatus} (${game.status})`);
      console.log("");
    });

    // Summary statistics
    const completed = games.filter((g) => g.hasResult).length;
    const abandoned = games.filter((g) => g.wasAbandoned).length;

    console.log("📊 Summary:");
    console.log(`✅ Completed games: ${completed}`);
    console.log(`❌ Abandoned/Aborted: ${abandoned}`);
    console.log(
      `📈 Completion rate: ${((completed / games.length) * 100).toFixed(1)}%`,
    );

    // Time controls breakdown
    const timeControls = {};
    games.forEach((game) => {
      timeControls[game.timeControl] =
        (timeControls[game.timeControl] || 0) + 1;
    });

    console.log("\n⏱️ Time Controls:");
    Object.entries(timeControls)
      .sort(([, a], [, b]) => b - a)
      .forEach(([control, count]) => {
        console.log(`   ${control}: ${count} games`);
      });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the analysis
simpleTodaysAnalysis();
