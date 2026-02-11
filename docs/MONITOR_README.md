# Lichess Profile Monitor

A Node.js script that monitors your Lichess profile every 5 minutes to help you track and limit your daily chess playing time.

## Features

- 📊 **Real-time monitoring**: Checks your profile every 5 minutes
- 🎯 **Configurable limits**: Set daily game count and time limits
- 🚨 **Smart alerts**: Get notified when you exceed your limits
- 📈 **Progress tracking**: Visual progress bars for your daily limits
- 🌅 **Daily reset**: Automatically resets at midnight
- ⚡ **Lightweight**: Uses Lichess API for efficient data fetching

## Quick Start

1. **Install dependencies** (if not already installed):

   ```bash
   npm install axios cheerio
   ```

2. **Configure your settings** in `chess/config.js`:

   ```javascript
   export const MONITOR_CONFIG = {
     username: "YourLichessUsername",
     checkIntervalMinutes: 5,
     limits: {
       maxGamesPerDay: 20,
       maxHoursPerDay: 3,
       maxMinutesPerGame: 15,
     }
   };
   ```

3. **Start monitoring**:

   ```bash
   node chess/monitor.js
   ```

   or

   ```bash
   node chess/start-monitor.js
   ```

## Configuration Options

Edit `chess/config.js` to customize your monitoring:

### Basic Settings

- `username`: Your Lichess username
- `checkIntervalMinutes`: How often to check (default: 5 minutes)

### Limits

- `maxGamesPerDay`: Maximum games per day before alert
- `maxHoursPerDay`: Maximum hours per day before alert
- `maxMinutesPerGame`: Alert if any single game exceeds this

### Alerts

- `showProgressUpdates`: Show progress bars (default: true)
- `showGameByGameBreakdown`: Show detailed game analysis (default: false)
- `warningThreshold`: Show warning at this percentage of limit (default: 80%)

### Display

- `showTimestamps`: Show timestamps in logs
- `showEmojis`: Use emojis in output
- `compactMode`: Reduce output verbosity

## Sample Output

```
🎯 Lichess Monitor Configuration:
================================
Username: YourUsername
Check interval: 5 minutes
Max games per day: 20
Max time per day: 3h 0m 0s
Max time per game: 15m 0s
Progress updates: ON
Game breakdown: OFF
================================

🚀 Starting Lichess profile monitoring...
Press Ctrl+C to stop monitoring

⏰ 14:30:15 - Checking daily limits...
📊 Current Status:
   Games today: 8/20
   Time today: 1h 45m 12s / 3h 0m 0s
   Average per game: 13m 9s

🟢 Games: [████████░░░░░░░░░░░░] 40.0% (8/20)
🟢 Time: [███████░░░░░░░░░░░░░] 58.4% (1h 45m 12s/3h 0m 0s)
```

## Alert Examples

### Warning (80% of limit)

```
⚠️  Warning: You're at 85.2% of your daily game limit
```

### Limit Exceeded

```
🚨 ALERT: Game limit exceeded! 🚨
You've played 21 games today (limit: 20)
Consider taking a break! 🧘‍♂️
```

### Long Game Alert

```
⚠️  Long game detected: 18m 34s (10+5)
   Game ID: abc123xyz
```

## Advanced Usage

### Running in Background

```bash
# Using nohup (Unix/Linux/macOS)
nohup node chess/monitor.js > monitor.log 2>&1 &

# Using screen (if available)
screen -S lichess-monitor node chess/monitor.js
```

### Adding to Package.json

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "monitor": "node chess/monitor.js",
    "monitor:start": "node chess/start-monitor.js"
  }
}
```

Then run with:

```bash
npm run monitor
```

## Stopping the Monitor

- Press `Ctrl+C` in the terminal to stop monitoring
- The script will show final stats before exiting

## Files Overview

- `monitor.js`: Main monitoring script
- `config.js`: Configuration file (edit this to customize)
- `start-monitor.js`: Simple launcher script
- `index.js`: Contains the Lichess API functions used by the monitor

## Future Enhancements

You mentioned wanting to add controls instead of just console logs. Here are some ideas:

1. **System notifications**: Use node-notifier to send desktop notifications
2. **Web dashboard**: Create a simple web interface to show stats
3. **Auto-close browser**: Automatically close Lichess tabs when limits are reached
4. **Slack/Discord integration**: Send alerts to messaging platforms
5. **Email alerts**: Send email notifications when limits are exceeded
6. **Statistics logging**: Save daily stats to a file or database

## Troubleshooting

- Make sure your Lichess username is correct in config.js
- Check your internet connection if API calls fail
- The script needs Node.js with ES modules support
- If you get import errors, make sure your package.json has `"type": "module"`

## License

This project is part of your personal nodeApp collection.
