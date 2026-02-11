/**
 * Example usage of the Lichess Profile Scraper
 */

import { fetchLichessProfileAPI, fetchRecentGames } from "./index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function exampleUsage() {
  try {
    console.log("Example: Fetching data for a specific user...\n");

    // Fetch profile data
    const username = process.env.LICHESS_USERNAME || "YourUsername";
    const profile = await fetchLichessProfileAPI(username);

    // Extract specific information
    console.log(`Player: ${profile.username}`);
    console.log(
      `Classical Rating: ${profile.perfs.classical?.rating || "N/A"}`,
    );
    console.log(`Puzzle Rating: ${profile.perfs.puzzle?.rating || "N/A"}`);

    // Fetch recent games
    const games = await fetchRecentGames(username, 3);
    console.log(`\nRecent ${games.length} games:`);
    games.forEach((game, i) => {
      const opponent =
        game.players.white.user?.name === username
          ? game.players.black.user?.name
          : game.players.white.user?.name;
      console.log(
        `${i + 1}. vs ${opponent} - ${
          game.winner ? game.winner + " wins" : "Draw"
        }`,
      );
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run example
exampleUsage();
