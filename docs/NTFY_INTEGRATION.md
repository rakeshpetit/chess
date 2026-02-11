# ntfy Integration for Chess Suspension

This project includes two ways to integrate with ntfy server for remote chess site blocking/unblocking.

## 🎯 What This Does

Allows you to send push notifications via ntfy to remotely trigger blocking or unblocking of chess sites on your machine.

## 📱 Two Integration Options

### Option 1: Direct Subscriber (Recommended)

The `ntfy-subscriber.js` script subscribes directly to your ntfy topic and listens for notifications.

**Pros:**

- Simpler setup
- No need for public endpoint or reverse proxy
- Works behind firewalls/NAT

**Setup:**

1. Edit `ntfy-subscriber.js` and configure your ntfy server:

```javascript
const NTFY_CONFIG = {
  server: "https://ntfy.sh", // or your self-hosted server
  topic: "chess-control", // your unique topic name
  // If authentication required:
  // username: "your-username",
  // password: "your-password",
};
```

2. Run the subscriber:

```bash
node ntfy-subscriber.js
```

3. Send notifications to control chess sites:

```bash
# Block chess sites
curl -d "block chess" https://ntfy.sh/chess-control

# Allow chess sites
curl -d "allow chess" https://ntfy.sh/chess-control

# Using tags
curl -H "Tags: block" -d "Time to focus!" https://ntfy.sh/chess-control
```

### Option 2: Webhook Server

The `ntfy-listener.js` creates an HTTP server that receives webhook POST requests from ntfy.

**Pros:**

- Works well if you're already running a server
- Can integrate with other services

**Cons:**

- Requires public endpoint or ngrok/similar
- More complex setup

**Setup:**

1. Install express (if not already installed):

```bash
npm install express
```

2. Run the listener:

```bash
node ntfy-listener.js
# or with custom port
PORT=8080 node ntfy-listener.js
```

3. Configure ntfy to send webhooks to your server:

```bash
# In your ntfy server config or using publish-webhook
curl -d "block chess" \
  -H "Actions: http, post, http://your-server:3000/ntfy-webhook" \
  https://ntfy.sh/chess-control
```

## 📋 Supported Commands

Both scripts understand these commands:

**To Block Chess Sites:**

- Messages containing: `block`, `suspend`, `stop chess`, `disable chess`
- Tags: `block`, `suspend`

**To Allow Chess Sites:**

- Messages containing: `allow`, `unblock`, `enable chess`, `start chess`
- Tags: `allow`, `unblock`

## 📱 Using ntfy App

You can also send notifications from the ntfy mobile app:

1. Install ntfy app on your phone ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
2. Subscribe to your topic (e.g., `chess-control`)
3. Send messages with "block" or "allow" in the text

## 🔒 Security Considerations

1. **Use Authentication**: If using a public ntfy server, enable authentication to prevent unauthorized access
2. **Use Unique Topic Names**: Don't use obvious topic names like "chess-control"
3. **Self-Host**: Consider running your own ntfy server for better privacy
4. **Firewall**: If using webhook option, ensure your endpoint is properly secured

## 🚀 Running as a Background Service

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the subscriber
pm2 start ntfy-subscriber.js --name chess-ntfy

# View logs
pm2 logs chess-ntfy

# Stop
pm2 stop chess-ntfy

# Restart
pm2 restart chess-ntfy

# Start on system boot
pm2 startup
pm2 save
```

### Using systemd (Linux)

Create `/etc/systemd/system/chess-ntfy.service`:

```ini
[Unit]
Description=Chess ntfy Subscriber
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/chess/directory
ExecStart=/usr/bin/node ntfy-subscriber.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable chess-ntfy
sudo systemctl start chess-ntfy
sudo systemctl status chess-ntfy
```

## 🧪 Testing

Test the integration:

```bash
# From command line
curl -d "block" https://ntfy.sh/your-topic

# From ntfy web interface
# Visit https://ntfy.sh/your-topic and send a message

# From ntfy CLI
ntfy publish your-topic "block chess"
```

## 🔧 Troubleshooting

**Connection issues:**

- Check if ntfy server is accessible
- Verify topic name is correct
- Check authentication credentials

**Commands not working:**

- Ensure message contains valid keywords
- Check console output for parsing errors
- Verify `suspend-chess.js` is properly configured

**SSH connection fails:**

- Check SSH credentials in `suspend-chess.js`
- Verify network connectivity to target machine
- Ensure hosts files exist (hostscommented/hostsuncommented)

## 📝 Example Messages

```bash
# Professional
curl -d "Time to focus - blocking chess sites" \
  -H "Title: Work Time" \
  -H "Tags: block,warning" \
  https://ntfy.sh/your-topic

# Quick block
curl -d "block" https://ntfy.sh/your-topic

# Allow with delay
curl -d "allow chess - break time!" \
  -H "Tags: allow,tada" \
  https://ntfy.sh/your-topic
```

## 🎮 Integration Ideas

- **Scheduled notifications**: Use cron or scheduled tasks to auto-block during work hours
- **Location-based**: Use phone automation (Tasker/Shortcuts) to block when at work
- **Calendar integration**: Block chess during calendar events marked as "Focus Time"
- **Pomodoro timer**: Integrate with productivity apps
