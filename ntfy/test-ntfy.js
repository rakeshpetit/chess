#!/usr/bin/env node

// Simple test script to verify ntfy integration
import { suspendChess } from "../suspend-chess.js";

const command = process.argv[2];

if (!command || !["block", "allow"].includes(command)) {
  console.log("Usage: node test-ntfy.js [block|allow]");
  console.log("");
  console.log("Examples:");
  console.log("  node test-ntfy.js block   # Test blocking chess sites");
  console.log("  node test-ntfy.js allow   # Test allowing chess sites");
  process.exit(1);
}

const shouldBlock = command === "block";

console.log(`🧪 Testing ${shouldBlock ? "BLOCK" : "ALLOW"} command...\n`);

suspendChess(shouldBlock)
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  });
