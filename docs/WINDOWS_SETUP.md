# Windows Setup Guide for Chess Control

This guide explains how to run the Chess Control application on Windows.

## Prerequisites

1. **Node.js** (v18.0.0 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Ensure "Add to PATH" is selected during installation

2. **Windows Terminal** (Recommended)
   - Install from Microsoft Store for better Unicode/emoji support
   - Alternatively, use PowerShell or Command Prompt

3. **WSL (Optional but Recommended)**
   - Since this application controls a remote Linux server via SSH, WSL provides better compatibility
   - Install WSL: `wsl --install` in PowerShell (Admin)

## Installation

```bash
# Clone or navigate to the project directory
cd chess

# Install dependencies
npm install
```

## Configuration

1. Copy the example environment file:

```bash
copy env.example .env
```

1. Edit `.env` with your SSH credentials:

```
SSH_HOST=192.168.0.10
SSH_USERNAME=user
SSH_PASSWORD=your_password
NTFY_SERVER=https://ntfy.sh
NTFY_TOPIC=chess-control
WEBAPP_PORT=3000
```

## Running the Application

### Web Application

```bash
# Start the web control interface
npm run webapp
```

Access at: `http://localhost:3000`

### Direct Script Execution

```bash
# Block chess sites
npm run suspend -- block

# Allow chess sites
npm run suspend -- allow
```

## Windows-Specific Notes

### 1. Path Handling

The application now uses `path.normalize()` for Windows-compatible path handling.

### 2. Line Endings

Config files with Windows line endings (CRLF) are automatically converted to Unix format (LF) before SSH upload.

### 3. Console Output

- Unicode block characters (█░) are replaced with ASCII (= -) in Windows CMD
- Emojis are handled gracefully on consoles without emoji support
- For best display, use Windows Terminal or PowerShell

### 4. Ping Command

The host monitoring automatically uses Windows-compatible ping syntax:

- Windows: `ping -n 1 -w 2000 host`
- Unix: `ping -c 1 -W 2 host`

### 5. File Permissions

The remote `/etc/hosts` file modification requires sudo access on the **remote Linux server**, not on Windows.

## Troubleshooting

### "node is not recognized" Error

- Ensure Node.js is installed and added to PATH
- Restart your terminal after Node.js installation
- Try using the full path: `"C:\Program Files\nodejs\node.exe"`

### Script Execution Issues

- Run PowerShell as Administrator if needed
- Enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### SSH Connection Failures

- Verify the remote Linux server is accessible
- Check SSH credentials in `.env`
- Ensure the remote server has sudo access for hosts file modification

### Display Issues

- Use Windows Terminal for best Unicode support
- Enable VT100 escape sequences in Windows 10+:

  ```powershell
  # In PowerShell
  Set-ItemProperty -Path 'HKCU:\Console' -Name 'VirtualTerminalLevel' -Value 1
  ```

## Architecture Note

This application is designed to:

1. Run the Node.js server on **any platform** (Windows, macOS, Linux)
2. Connect via SSH to a **remote Linux server**
3. Modify the `/etc/hosts` file on the **remote server** only

The Windows machine running this app does NOT need to modify its own hosts file.
