# Chess Control - Project Summary

## Overview

This is a **Node.js-based productivity control system** designed to help manage chess playing time on Lichess.org. Despite the repository name "chess", this is not a chess game implementation - it's a **time management and remote control tool**.

## Purpose

The system helps prevent excessive chess playing by:

- Monitoring your Lichess profile to track playing activity
- Blocking/unblocking chess sites remotely using ntfy push notifications
- Managing daily play limits through alerts and automation

## Technology Stack

- **Language**: JavaScript (ES modules)
- **Runtime**: Node.js (>=18.0.0)
- **Key Dependencies**:
  - `ssh2` - SSH client for remote connections
  - `express` - Webhook server
  - `axios` - HTTP client for Lichess API
  - `cheerio` - HTML parsing for fallback scraping

## Project Structure

| File | Purpose |
|------|---------|
| `index.js` | Lichess API scraper - main data fetching |
| `monitor.js` | Real-time play monitoring with alerts |
| `suspend-chess.js` | SSH-based site blocking/unblocking |
| `start-monitor.js` | Monitor launcher script |
| `ntfy-subscriber.js` | Subscribes to ntfy for remote commands |
| `ntfy-listener.js` | HTTP webhook server for ntfy |
| `start-ntfy.js` | Ntfy launcher script |
| `test-ntfy.js` | Local ntfy testing |
| `example.js` | Usage examples |
| `todays-games.js` | Today's games analysis |
| `time-played.js` | Time calculation helpers |
| `accurate-time.js` | Precise time tracking |
| `simple-today.js` | Simplified daily stats |

## Main Features

### 1. Lichess Profile Scraper (`index.js`)

- Fetches user profile via Lichess API (with fallback to web scraping)
- Shows ratings across game types (Bullet, Blitz, Rapid, Classical, Puzzle)
- Tracks game statistics (wins/losses/draws, win rate)
- Fetches recent games and today's game summary
- Calculates time played (with estimated and accurate methods)

### 2. Daily Play Monitor (`monitor.js`)

- Configurable limits (max games/day, max hours/day, max time/game)
- 5-minute check interval with visual progress bars
- Smart alerts with warning thresholds (80% limit)
- Daily reset at midnight
- Graceful Ctrl+C shutdown with final stats

### 3. Remote Site Control via ntfy

Two integration options:

- **Direct subscriber**: Subscribes to ntfy topic (works behind NAT)
- **Webhook server**: HTTP endpoint for ntfy webhooks

Commands:

- `block` or `suspend` - Block chess sites
- `allow` or `unblock` - Unblock sites

### 4. SSH-based Blocking System (`suspend-chess.js`)

- Connects to remote Ubuntu machine (192.168.0.10)
- Modifies `/etc/hosts` to redirect lichess.org to localhost
- Kills Firefox/Brave browsers after unblocking

## Configuration

Edit `config.js` to customize:

```javascript
username: "LichessUser",
checkIntervalMinutes: 5,
limits: {
  maxGamesPerDay: 10,
  maxHoursPerDay: 2,
  maxMinutesPerGame: 15
}
```

## Ntfy Integration

Send commands from anywhere:

```bash
curl -d "block chess" https://ntfy.sh/your-topic
curl -d "allow chess" https://ntfy.sh/your-topic
```
