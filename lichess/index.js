/**
 * Lichess Profile Scraper
 *
 * This script fetches chess player data from Lichess.org without using complex tools like Puppeteer.
 * It uses simple HTTP requests with axios and HTML parsing with cheerio.
 *
 * Features:
 * - Fetches user profile data via Lichess API (preferred method)
 * - Falls back to web scraping if API is unavailable
 * - Displays formatted profile information, ratings, and game statistics
 * - Fetches recent games
 * - Saves data to JSON file
 *
 * Usage:
 * - Run: node chess/index.js
 * - Or import functions: import { fetchLichessProfileAPI } from './chess/index.js'
 *
 * Dependencies: axios, cheerio
 */

import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fetchLichessProfile(username) {
  try {
    const url = `https://lichess.org/@/${username}/all`;
    console.log(`Fetching data from: ${url}`);

    // Make HTTP request
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract profile information
    const profileInfo = {
      username: username,
      displayName: $(".user-link").first().text().trim(),
      rating: {},
      stats: {},
      recentGames: [],
    };

    // Extract ratings for different game types
    $(".rating").each((i, element) => {
      const gameType = $(element)
        .closest(".perf")
        .find(".perf-name")
        .text()
        .trim();
      const rating = $(element).text().trim();
      if (gameType && rating) {
        profileInfo.rating[gameType] = rating;
      }
    });

    // Extract user stats
    $(".user-infos .data-count").each((i, element) => {
      const label = $(element).find(".data-count-name").text().trim();
      const value = $(element).find(".data-count-value").text().trim();
      if (label && value) {
        profileInfo.stats[label] = value;
      }
    });

    // Extract recent games information
    $(".game-row")
      .slice(0, 10)
      .each((i, element) => {
        const gameInfo = {
          players: $(element).find(".players").text().trim(),
          result: $(element).find(".result").text().trim(),
          time: $(element).find(".time").text().trim(),
          moves: $(element).find(".moves").text().trim(),
        };
        profileInfo.recentGames.push(gameInfo);
      });

    return profileInfo;
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Status Text:", error.response.statusText);
    }
    throw error;
  }
}

// Alternative approach using Lichess API (if available)
async function fetchLichessProfileAPI(username) {
  try {
    const apiUrl = `https://lichess.org/api/user/${username}`;
    console.log(`Fetching data from API: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching from API:", error.message);
    throw error;
  }
}

// Function to fetch recent games
async function fetchRecentGames(username, maxGames = 10) {
  try {
    const gamesUrl = `https://lichess.org/api/games/user/${username}?max=${maxGames}&format=json`;
    console.log(`Fetching recent games from: ${gamesUrl}`);

    const response = await axios.get(gamesUrl, {
      headers: {
        Accept: "application/x-ndjson",
      },
    });

    // Parse NDJSON (newline-delimited JSON)
    const games = response.data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
      .slice(0, maxGames);

    return games;
  } catch (error) {
    console.error("Error fetching recent games:", error.message);
    return [];
  }
}

// Function to fetch today's games with detailed information
async function fetchTodaysGames(username) {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    // Convert to milliseconds since epoch
    const since = startOfDay.getTime();
    const until = endOfDay.getTime();

    const gamesUrl = `https://lichess.org/api/games/user/${username}?since=${since}&until=${until}&format=json`;
    console.log(`Fetching today's games from: ${gamesUrl}`);

    const response = await axios.get(gamesUrl, {
      headers: {
        Accept: "application/x-ndjson",
      },
    });

    // Parse NDJSON (newline-delimited JSON)
    const games = response.data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    // Process games to extract the information you want
    const processedGames = games.map((game) => {
      // Extract time control information
      const timeControl = game.clock
        ? `${Math.floor(game.clock.initial / 60)}+${game.clock.increment}`
        : "Correspondence";

      // Check if game was completed with a result vs abandoned/aborted
      const hasResult =
        game.status === "mate" ||
        game.status === "resign" ||
        game.status === "timeout" ||
        game.status === "draw" ||
        game.status === "stalemate" ||
        game.status === "outoftime";

      const wasAbandoned =
        game.status === "aborted" ||
        game.status === "noStart" ||
        game.status === "unknownFinish";

      return {
        id: game.id,
        createdAt: new Date(game.createdAt),
        white: game.players.white.user?.name || "Anonymous",
        black: game.players.black.user?.name || "Anonymous",
        timeControl: timeControl,
        speed: game.speed, // bullet, blitz, rapid, classical, etc.
        status: game.status,
        hasResult: hasResult,
        wasAbandoned: wasAbandoned,
        winner: game.winner || "draw",
        moves: game.moves ? game.moves.split(" ").length : 0,
        url: `https://lichess.org/${game.id}`,
      };
    });

    return processedGames;
  } catch (error) {
    console.error("Error fetching today's games:", error.message);
    return [];
  }
}

// Function to display today's games summary
async function displayTodaysGamesSummary(username) {
  const todaysGames = await fetchTodaysGames(username);

  if (todaysGames.length === 0) {
    console.log("No games played today.");
    return;
  }

  console.log(`\n📅 Today's Games Summary (${todaysGames.length} games):`);
  console.log("=".repeat(60));

  todaysGames.forEach((game, index) => {
    const timeStr = game.createdAt.toLocaleTimeString();
    const resultIcon = game.hasResult ? "✅" : game.wasAbandoned ? "❌" : "⚠️";
    const resultText = game.hasResult
      ? game.winner === "draw"
        ? "Draw"
        : `${game.winner} wins`
      : `${game.status}`;

    console.log(
      `${index + 1}. ${resultIcon} ${timeStr} - ${game.white} vs ${game.black}`,
    );
    console.log(`   Time Control: ${game.timeControl} (${game.speed})`);
    console.log(`   Result: ${resultText} (${game.status})`);
    console.log(`   Moves: ${game.moves}, URL: ${game.url}`);
    console.log("");
  });

  // Summary statistics
  const completedGames = todaysGames.filter((g) => g.hasResult);
  const abandonedGames = todaysGames.filter((g) => g.wasAbandoned);
  const timeControlStats = {};

  todaysGames.forEach((game) => {
    timeControlStats[game.timeControl] =
      (timeControlStats[game.timeControl] || 0) + 1;
  });

  console.log("📊 Today's Statistics:");
  console.log(`Total games: ${todaysGames.length}`);
  console.log(`Completed games: ${completedGames.length}`);
  console.log(`Abandoned/Aborted games: ${abandonedGames.length}`);
  console.log(
    `Completion rate: ${(
      (completedGames.length / todaysGames.length) *
      100
    ).toFixed(1)}%`,
  );

  console.log("\n⏱️ Time Controls:");
  Object.entries(timeControlStats).forEach(([timeControl, count]) => {
    console.log(`${timeControl}: ${count} games`);
  });
}

// Function to calculate total time played today
async function calculateTotalTimePlayedToday(username) {
  try {
    const todaysGames = await fetchTodaysGames(username);

    if (todaysGames.length === 0) {
      return {
        totalTimeSeconds: 0,
        totalTimeFormatted: "0 minutes",
        gameCount: 0,
        averageTimePerGame: "0 minutes",
      };
    }

    let totalTimeSeconds = 0;
    const gameTimeDetails = [];

    // Calculate time for each game
    todaysGames.forEach((game) => {
      let gameTimeSeconds = 0;

      if (game.clock) {
        // For timed games, we need to fetch the detailed game data to get actual time spent
        // For now, we'll estimate based on moves and time control
        const baseTime = game.clock.initial; // in seconds
        const increment = game.clock.increment || 0;

        // Estimate actual time used (this is an approximation)
        // In a real scenario, you'd need to fetch individual game data for exact time
        const estimatedTimeUsed = Math.min(
          baseTime,
          game.moves * 30 + game.moves * increment, // rough estimate: 30 sec per move + increment
        );

        gameTimeSeconds = estimatedTimeUsed;
      } else {
        // For correspondence games, estimate based on moves
        gameTimeSeconds = game.moves * 60; // 1 minute per move estimate
      }

      totalTimeSeconds += gameTimeSeconds;
      gameTimeDetails.push({
        id: game.id,
        timeControl: game.timeControl,
        moves: game.moves,
        estimatedTimeSeconds: gameTimeSeconds,
        estimatedTimeFormatted: formatTime(gameTimeSeconds),
      });
    });

    return {
      totalTimeSeconds,
      totalTimeFormatted: formatTime(totalTimeSeconds),
      gameCount: todaysGames.length,
      averageTimePerGame: formatTime(totalTimeSeconds / todaysGames.length),
      gameTimeDetails,
    };
  } catch (error) {
    console.error("Error calculating total time played:", error.message);
    return {
      totalTimeSeconds: 0,
      totalTimeFormatted: "0 minutes",
      gameCount: 0,
      averageTimePerGame: "0 minutes",
    };
  }
}

// Helper function to format time in a readable format
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Function to fetch detailed game data for more accurate time calculation
async function fetchGameDetails(gameId) {
  try {
    const gameUrl = `https://lichess.org/api/game/${gameId}`;
    const response = await axios.get(gameUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching game details for ${gameId}:`, error.message);
    return null;
  }
}

// Enhanced function to get accurate time played today
async function getAccurateTimePlayedToday(username, maxGames = 20) {
  try {
    const todaysGames = await fetchTodaysGames(username);

    if (todaysGames.length === 0) {
      return {
        totalTimeSeconds: 0,
        totalTimeFormatted: "0 minutes",
        gameCount: 0,
        averageTimePerGame: "0 minutes",
        games: [],
      };
    }

    console.log(
      `\n⏱️  Calculating accurate time for ${todaysGames.length} games...`,
    );

    let totalTimeSeconds = 0;
    const gameTimeDetails = {};

    // Fetch detailed data for each game (limited to avoid too many API calls)
    const gamesToAnalyze = todaysGames.slice(
      0,
      Math.min(maxGames, todaysGames.length),
    );

    for (const game of gamesToAnalyze) {
      const gameDetails = await fetchGameDetails(game.id);

      if (gameDetails && gameDetails.players) {
        // Calculate actual time used by the player
        const whiteTime =
          gameDetails.players.white.user?.name === username
            ? gameDetails.clock?.initial -
              (gameDetails.players.white.clock || 0)
            : 0;
        const blackTime =
          gameDetails.players.black.user?.name === username
            ? gameDetails.clock?.initial -
              (gameDetails.players.black.clock || 0)
            : 0;

        const playerTimeUsed = whiteTime + blackTime;

        totalTimeSeconds += playerTimeUsed;
        gameTimeDetails.push({
          id: game.id,
          timeControl: game.timeControl,
          moves: game.moves,
          actualTimeSeconds: playerTimeUsed,
          actualTimeFormatted: formatTime(playerTimeUsed),
          opponent: game.white === username ? game.black : game.white,
        });
      }

      // Small delay to be respectful to the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      totalTimeSeconds,
      totalTimeFormatted: formatTime(totalTimeSeconds),
      gameCount: gamesToAnalyze.length,
      averageTimePerGame: formatTime(totalTimeSeconds / gamesToAnalyze.length),
      games: gameTimeDetails,
    };
  } catch (error) {
    console.error("Error getting accurate time played:", error.message);
    return {
      totalTimeSeconds: 0,
      totalTimeFormatted: "0 minutes",
      gameCount: 0,
      averageTimePerGame: "0 minutes",
      games: [],
    };
  }
}

// Main execution with better formatting
async function main() {
  const username = process.env.LICHESS_USERNAME || "YourUsername";

  try {
    console.log("=== Fetching Lichess Profile ===");

    // Try API first (cleaner data)
    console.log("\n1. Trying Lichess API:");
    try {
      const apiData = await fetchLichessProfileAPI(username);

      // Format the data nicely
      console.log("\n📊 Profile Summary:");
      console.log(`Username: ${apiData.username}`);
      console.log(`Real Name: ${apiData.profile?.realName || "N/A"}`);
      console.log(`Location: ${apiData.profile?.location || "N/A"}`);
      console.log(`Profile: ${apiData.profile?.bio || "N/A"}`);
      console.log(
        `Member since: ${new Date(apiData.createdAt).toLocaleDateString()}`,
      );
      console.log(
        `Last seen: ${new Date(apiData.seenAt).toLocaleDateString()}`,
      );
      console.log(
        `Total play time: ${Math.round(apiData.playTime.total / 3600)} hours`,
      );

      console.log("\n🎯 Ratings:");
      Object.entries(apiData.perfs).forEach(([gameType, stats]) => {
        if (stats.rating && stats.games > 0) {
          console.log(
            `${gameType.charAt(0).toUpperCase() + gameType.slice(1)}: ${
              stats.rating
            } (${stats.games} games)`,
          );
        }
      });

      console.log("\n📈 Game Statistics:");
      console.log(`Total games: ${apiData.count.all}`);
      console.log(`Wins: ${apiData.count.win}`);
      console.log(`Losses: ${apiData.count.loss}`);
      console.log(`Draws: ${apiData.count.draw}`);
      console.log(
        `Win rate: ${((apiData.count.win / apiData.count.all) * 100).toFixed(
          1,
        )}%`,
      );

      // Save data to file
      console.log("\n💾 Saving data to file...");
      const fs = await import("fs");
      const path = await import("path");
      const dataPath = path.join(process.cwd(), "lichess", "profile_data.json");
      await fs.promises.writeFile(dataPath, JSON.stringify(apiData, null, 2));
      console.log("Data saved to lichess/profile_data.json");

      // Fetch recent games
      console.log("\n🎮 Fetching recent games...");
      const recentGames = await fetchRecentGames(username, 5);
      if (recentGames.length > 0) {
        console.log("\n🕹️ Recent Games:");
        recentGames.forEach((game, index) => {
          const white = game.players.white.user?.name || "Anonymous";
          const black = game.players.black.user?.name || "Anonymous";
          const result = game.winner ? `${game.winner} wins` : "Draw";
          const speed = game.speed;
          const date = new Date(game.createdAt).toLocaleDateString();

          console.log(
            `${
              index + 1
            }. ${white} vs ${black} - ${result} (${speed}) - ${date}`,
          );
        });
      }

      // Display today's games analysis
      await displayTodaysGamesSummary(username);

      // Calculate total time played today
      console.log("\n⏱️  Calculating time played today...");
      const timeStats = await calculateTotalTimePlayedToday(username);

      console.log("\n📊 Time Played Today:");
      console.log("====================");
      console.log(`Total time played: ${timeStats.totalTimeFormatted}`);
      console.log(`Games analyzed: ${timeStats.gameCount}`);
      console.log(`Average time per game: ${timeStats.averageTimePerGame}`);

      // For more accuracy, get detailed time data for recent games
      console.log("\n🎯 Getting accurate time data for recent games...");
      const accurateStats = await getAccurateTimePlayedToday(username, 10);

      if (accurateStats.games.length > 0) {
        console.log("\n📈 Detailed Time Analysis (last 10 games):");
        console.log("===========================================");
        console.log(`Accurate total time: ${accurateStats.totalTimeFormatted}`);
        console.log(`Average per game: ${accurateStats.averageTimePerGame}`);

        console.log("\n🎮 Time per game:");
        accurateStats.games.forEach((game, index) => {
          console.log(
            `${index + 1}. vs ${game.opponent} (${game.timeControl}): ${
              game.actualTimeFormatted
            }`,
          );
        });
      }
    } catch (apiError) {
      console.log("API not available, falling back to web scraping");

      // Web scraping approach
      console.log("\n2. Web scraping approach:");
      const profileData = await fetchLichessProfile(username);
      console.log("Profile Data:", JSON.stringify(profileData, null, 2));
    }
  } catch (error) {
    console.error("Failed to fetch profile data:", error.message);
  }
}

// Run the script
main();

export {
  fetchLichessProfile,
  fetchLichessProfileAPI,
  fetchRecentGames,
  fetchTodaysGames,
  displayTodaysGamesSummary,
  calculateTotalTimePlayedToday,
  getAccurateTimePlayedToday,
  formatTime,
  fetchGameDetails,
};
