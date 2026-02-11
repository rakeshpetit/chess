# Lichess Profile Scraper

A simple Node.js script to fetch chess player information from Lichess.org without using complex tools like Puppeteer or Playwright.

## Features

- ✅ Fetches user profile data via Lichess API (preferred method)
- ✅ Falls back to web scraping if API is unavailable
- ✅ Displays formatted profile information, ratings, and game statistics
- ✅ Fetches recent games
- ✅ Saves data to JSON file
- ✅ Works with ES modules
- ✅ Simple HTTP requests using axios
- ✅ HTML parsing with cheerio

## Installation

```bash
npm install axios cheerio
```

## Usage

### Run the main script

```bash
node chess/index.js
```

### Use as a module

```javascript
import { fetchLichessProfileAPI, fetchRecentGames } from './chess/index.js';

const profile = await fetchLichessProfileAPI('username');
const games = await fetchRecentGames('username', 5);
```

## Example Output

```
=== Fetching Lichess Profile ===

📊 Profile Summary:
Username: YourUsername
Real Name: YourName
Location: YourLocation
Profile: Your Bio...
Member since: 01/01/2024
Last seen: 01/01/2025
Total play time: 100 hours

🎯 Ratings:
Bullet: 1500 (100 games)
Blitz: 1500 (100 games)
Rapid: 1500 (100 games)
Classical: 1500 (100 games)
Puzzle: 1500 (1000 games)

📈 Game Statistics:
Total games: 500
Wins: 250
Losses: 200
Draws: 50
Win rate: 50%

🕹️ Recent Games:
1. YourUsername vs Opponent1 - white wins (rapid) - 01/01/2025
2. Opponent2 vs YourUsername - black wins (rapid) - 01/01/2025
```

## API vs Web Scraping

The script tries the Lichess API first, which provides clean, structured data. If that fails, it falls back to web scraping the HTML page.

### Lichess API Endpoints Used

- Profile: `https://lichess.org/api/user/{username}`
- Games: `https://lichess.org/api/games/user/{username}`

## Functions

- `fetchLichessProfileAPI(username)` - Fetch profile via API
- `fetchLichessProfile(username)` - Fetch profile via web scraping
- `fetchRecentGames(username, maxGames)` - Fetch recent games

## Dependencies

- **axios**: HTTP client for making requests
- **cheerio**: Server-side jQuery-like HTML parsing

## File Structure

```
chess/
├── index.js          # Main script
├── example.js        # Usage example
├── profile_data.json # Saved profile data
└── README.md         # This file
```

## Benefits of This Approach

1. **Simple**: No browser automation complexity
2. **Fast**: Direct HTTP requests are much faster
3. **Lightweight**: Minimal dependencies
4. **Reliable**: Uses official API when available
5. **Flexible**: Can be easily extended or modified
6. **No Browser**: Works in any Node.js environment

## Notes

- The Lichess API is free and doesn't require authentication for public data
- Web scraping is used as a fallback but API is preferred
- Data is saved to `profile_data.json` for offline analysis
- The script handles errors gracefully and provides informative output

# Chess Suspend Script

## suspend-chess.js

Automates the process of suspending chess-related activities on a remote Ubuntu machine.

### What it does

1. **Connects to remote Ubuntu machine** via SSH (192.168.68.120)
2. **Reads the last two lines** of `/etc/hosts` file
3. **Uncomments the last two lines** in `/etc/hosts` (removes # from the beginning)
4. **Kills all Firefox processes** using `pkill firefox`

### Usage

```bash
node chess/suspend-chess.js
```

### Authentication Options

- **Password Authentication (Default)**: The script will prompt for your password securely
- **Private Key Authentication**: Uncomment and update the privateKey line in the script

### Error Handling

The script includes comprehensive error handling and provides clear feedback throughout the process.
