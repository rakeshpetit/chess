import express from "express";
import { executeRemoteCommands, suspendChess } from "../suspend-chess.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.NTFY_LISTENER_PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "ntfy listener is running" });
});

// Endpoint to receive ntfy notifications
app.post("/ntfy-webhook", async (req, res) => {
  try {
    const { message, title, priority, tags } = req.body;

    console.log("📨 Received ntfy notification:");
    console.log(`  Title: ${title || "N/A"}`);
    console.log(`  Message: ${message}`);
    console.log(`  Priority: ${priority || "N/A"}`);
    console.log(`  Tags: ${tags?.join(", ") || "N/A"}`);

    // Parse the message to determine if we should block or allow chess
    const shouldBlock = parseChessCommand(message, tags);

    if (shouldBlock === null) {
      console.log("⚠️  Message not recognized as a chess command");
      res.json({
        status: "ignored",
        message: "Not a valid chess command",
      });
      return;
    }

    // Acknowledge the webhook immediately
    res.json({
      status: "accepted",
      action: shouldBlock ? "blocking" : "allowing",
      message: "Processing chess command...",
    });

    // Execute the command asynchronously
    console.log(
      `\n🎯 Executing: ${shouldBlock ? "BLOCK" : "ALLOW"} chess sites\n`,
    );
    await suspendChess(shouldBlock);
    console.log("✅ Command completed successfully!");
  } catch (error) {
    console.error("❌ Error processing ntfy notification:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Parse the message to determine the action
function parseChessCommand(message, tags = []) {
  const messageLower = message?.toLowerCase() || "";
  const tagsList = tags.map((t) => t.toLowerCase());

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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 ntfy listener started on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/ntfy-webhook`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log("\n📋 Usage:");
  console.log("  Send ntfy notification with message containing:");
  console.log("    - 'block', 'suspend', 'stop chess' → blocks chess sites");
  console.log("    - 'allow', 'unblock', 'enable chess' → allows chess sites");
  console.log("  Or use tags: 'block', 'suspend', 'allow', 'unblock'\n");
});
