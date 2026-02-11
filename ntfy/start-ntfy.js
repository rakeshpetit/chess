#!/usr/bin/env node

// Quick start script for ntfy integration
console.log("🎮 Chess Control via ntfy\n");
console.log("Choose how you want to run:\n");
console.log("1. ntfy-subscriber.js (Recommended)");
console.log("   - Subscribes directly to ntfy topic");
console.log("   - No public endpoint needed");
console.log("   - Run: node ntfy-subscriber.js\n");
console.log("2. ntfy-listener.js (Webhook server)");
console.log("   - HTTP server for webhooks");
console.log("   - Requires public endpoint");
console.log("   - Run: node ntfy-listener.js\n");
console.log("3. test-ntfy.js (Test locally)");
console.log("   - Test without ntfy");
console.log("   - Run: node test-ntfy.js block|allow\n");
console.log("📖 See NTFY_INTEGRATION.md for detailed setup instructions");
