import { suspendChess } from "../suspend-chess.js";
import { parseChessCommand } from "../lib/commands.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const NTFY_CONFIG = {
  server: process.env.NTFY_SERVER || "https://ntfy.sh", // Change this to your ntfy server URL (no trailing slash)
  topic: process.env.NTFY_TOPIC || "chess-control", // Change this to your topic name
  // If your ntfy server requires authentication:
  username: process.env.NTFY_USERNAME || undefined,
  password: process.env.NTFY_PASSWORD || undefined,
};

// Subscribe to ntfy topic
async function subscribeToNtfy() {
  const url = `${NTFY_CONFIG.server}/${NTFY_CONFIG.topic}/json`;

  console.log("🚀 Starting ntfy subscriber...");
  console.log(`📡 Subscribing to: ${url}\n`);
  console.log("📋 Waiting for notifications...");
  console.log("  Send 'block' or 'suspend' → blocks chess sites");
  console.log("  Send 'allow' or 'unblock' → allows chess sites\n");

  // Set up authentication headers if needed
  const headers = {};
  if (NTFY_CONFIG.username && NTFY_CONFIG.password) {
    const auth = Buffer.from(
      `${NTFY_CONFIG.username}:${NTFY_CONFIG.password}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
  }

  while (true) {
    try {
      console.log(`🔄 Connecting to ${url}...`);
      const response = await fetch(url, {
        headers,
        // No timeout - keep connection open for streaming
      });

      if (!response.ok) {
        console.error(
          `❌ HTTP error! status: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("✅ Connected successfully!");
      console.log("📡 Listening for notifications...\n");

      // Read the stream line by line
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const notification = JSON.parse(line);
              await handleNotification(notification);
            } catch (error) {
              console.error("❌ Error parsing notification:", error.message);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("⚠️  Connection timeout, reconnecting...");
      } else if (error.cause) {
        console.error("❌ Error in ntfy subscription:", error.message);
        console.error("   Cause:", error.cause.message || error.cause);
      } else {
        console.error("❌ Error in ntfy subscription:", error.message);
      }

      // Wait before reconnecting
      console.log("⏳ Reconnecting in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Handle incoming notification
async function handleNotification(notification) {
  // Skip keepalive messages
  if (notification.event === "keepalive") {
    return;
  }

  console.log("\n📨 Received notification:");
  console.log(`  ID: ${notification.id}`);
  console.log(`  Time: ${new Date(notification.time * 1000).toLocaleString()}`);
  console.log(`  Title: ${notification.title || "N/A"}`);
  console.log(`  Message: ${notification.message}`);
  console.log(`  Priority: ${notification.priority || "default"}`);
  console.log(`  Tags: ${notification.tags?.join(", ") || "none"}`);

  // Parse the command
  const shouldBlock = parseChessCommand(notification.message, notification.tags);

  if (shouldBlock === null) {
    console.log("⚠️  Message not recognized as a chess command");
    console.log("📋 Waiting for next notification...\n");
    return;
  }

  // Execute the command
  console.log(
    `\n🎯 Executing: ${shouldBlock ? "BLOCK" : "ALLOW"} chess sites\n`,
  );

  try {
    await suspendChess(shouldBlock);
    console.log("✅ Command completed successfully!");
  } catch (error) {
    console.error("❌ Command failed:", error.message);
  }

  console.log("\n📋 Waiting for next notification...\n");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down ntfy subscriber...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Shutting down ntfy subscriber...");
  process.exit(0);
});

// Start the subscriber
subscribeToNtfy().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
