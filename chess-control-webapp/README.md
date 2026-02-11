# Chess Control Web App

A simple web application to block or allow chess sites instantly from your local network.

## Features

- 🚫 **Block Chess** - Instantly block chess sites (lichess.org, etc.)
- ✅ **Allow Chess** - Instantly allow chess sites
- 📊 **Status Display** - Shows the current status and last action timestamp
- 🌐 **Local Network Access** - Access from any device on your local network

## How It Works

The web app runs an Express server that executes the `suspend-chess.js` script when you click the Block or Allow buttons. The script connects via SSH to a remote machine and modifies the `/etc/hosts` file to block or allow chess sites.

## Setup

1. **Install dependencies:**

   ```bash
   cd chess-control-webapp
   npm install
   ```

2. **Configure `suspend-chess.js`:**
   Make sure the `suspend-chess.js` file in the parent directory is properly configured with:
   - SSH host, username, and password
   - Hosts files (`hostsuncommented` and `hostscommented`) in the parent directory

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Access the web app:**
   - On your computer: `http://localhost:3000`
   - From other devices on your network: `http://YOUR_IP_ADDRESS:3000`

   To find your IP address:
   - macOS/Linux: `ifconfig` or `ip addr`
   - Windows: `ipconfig`

## Project Structure

```
chess-control-webapp/
├── package.json          # Dependencies and scripts
├── server.js             # Express server with API endpoints
├── README.md             # This file
└── public/
    ├── index.html        # Main HTML page
    ├── styles.css        # Styling
    └── script.js         # Frontend JavaScript
```

## API Endpoints

- `POST /api/block` - Block chess sites
- `POST /api/allow` - Allow chess sites
- `GET /api/status` - Get the last action status

## Notes

- The server listens on `0.0.0.0:3000` to allow access from your local network
- Make sure your firewall allows connections on port 3000
- The suspend-chess.js script must be in the parent directory
