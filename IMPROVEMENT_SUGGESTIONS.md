# Chess Control - Improvement Suggestions

## Project Overview
**Chess Control** is a productivity tool for remotely managing chess website access via SSH-based hosts file modification, with ntfy integration and Lichess tracking. The code is well-structured but has several areas for improvement.

---

## Critical Security Issues

### 1. SSH Password in Plaintext (HIGH RISK)
**Location:** `.env`, `suspend-chess.js:18`
```bash
SSH_PASSWORD=Abika1357  # Hardcoded credential
```
**Issue:** SSH password stored in plaintext in `.env` file and used directly in shell commands via `sudo -S`.

**Recommendations:**
- Switch to SSH key authentication
- Never pass passwords via shell commands (risk of exposure in process list)
- Consider using `ssh-agent` or key-based auth with `ssh2` library
- Add `.env` to `.gitignore` if not already present

### 2. No Web Interface Authentication (HIGH RISK)
**Location:** `chess-control-webapp/server.js`
**Issue:** The web app has no authentication mechanism - anyone on the local network can block/allow sites.

**Recommendations:**
- Add basic authentication middleware
- Support API tokens or session-based auth
- Consider IP whitelisting

### 3. Hardcoded Browser Names
**Location:** `suspend-chess.js:32`
```js
const BROWSERS_TO_KILL = ["firefox", "brave"];
```
**Issue:** Limited to only Firefox and Brave. Will miss other browsers (Chrome, Safari, Edge).

**Recommendation:** Make this configurable or detect installed browsers dynamically.

---

## Code Quality Issues

### 4. Error Handling Inconsistencies
**Location:** Multiple files
**Issue:** Mix of error handling patterns - some places use try-catch, others don't; error objects sometimes have `stderr`, sometimes `error`.

**Example (`chess-control-webapp/server.js:125`):**
```js
error.stderr || error.error || "Unknown error"
```

**Recommendation:** Establish consistent error handling patterns across the codebase.

### 5. Shared State in Web Server
**Location:** `chess-control-webapp/server.js:31-36`
```js
let lastAction = {
  type: null,
  status: null,
  message: null,
  timestamp: null,
};
```
**Issue:** Single `lastAction` variable shared across requests. Not safe for concurrent requests.

**Recommendation:** Use a proper store (in-memory database or file-based) for action history.

### 6. Missing Input Validation
**Location:** `chess-control-webapp/server.js:84-189`
**Issue:** POST endpoints `/api/block` and `/api/allow` accept any request body without validation.

**Recommendation:** Add body validation (e.g., with JOI or Zod).

### 7. Hardcoded Paths
**Location:** `suspend-chess.js:30-31`
```js
const REMOTE_HOSTS_PATH = "/etc/hosts";
const REMOTE_HOSTS_BACKUP_PATH = "/etc/hosts.backup";
```
**Issue:** Paths are hardcoded, making the tool less portable.

**Recommendation:** Make paths configurable via environment variables.

---

## Architecture Improvements

### 8. Code Duplication
**Location:** `ntfy/ntfy-subscriber.js`, `ntfy/ntfy-listener.js`
**Issue:** `parseChessCommand()` function is duplicated in both files.

**Recommendation:** Extract to a shared utility module (`lib/commands.js`).

### 9. Mixed Concerns
**Location:** `suspend-chess.js:240-251`
**Issue:** `uploadHostsFile()` handles both file reading and SSH command execution, and embeds the SSH password.

**Recommendation:** Separate concerns:
- One function to read hosts files
- One function to execute SSH commands
- Password handling should be abstracted

### 10. No Configuration Validation
**Location:** `lichess/monitor.js`
**Issue:** Configuration is loaded but never validated for required fields or correct types.

**Recommendation:** Add config validation with a schema (e.g., using Zod or Joi).

---

## Missing Features

### 11. No Rate Limiting
**Location:** `chess-control-webapp/server.js`, `ntfy/ntfy-listener.js`
**Issue:** No protection against repeated requests that could spam the SSH connection.

**Recommendation:** Add rate limiting middleware (e.g., `express-rate-limit`).

### 12. No Logging System
**Location:** Entire project
**Issue:** Logging is ad-hoc with `console.log`. No log rotation, no severity levels, no file output.

**Recommendation:** Use a logging library like `winston` or `pino` with:
- Log levels (debug, info, warn, error)
- Log rotation
- Structured logging

### 13. No Unit Tests
**Location:** Entire project
**Issue:** No test files found. Manual testing is error-prone for a tool that modifies system files.

**Recommendation:** Add Jest/Mocha tests for:
- Command parsing logic
- Configuration validation
- SSH command execution (mocked)
- Timer functions

---

## Performance Optimizations

### 14. Sequential API Calls
**Location:** `lichess/index.js:407-438`
```js
for (const game of gamesToAnalyze) {
  const gameDetails = await fetchGameDetails(game.id);
  // Small delay...
}
```
**Issue:** Fetching game details sequentially is slow for many games.

**Recommendation:** Batch requests with concurrency limit (e.g., `p-limit` library).

### 15. Timer Not Precise
**Location:** `suspend-chess.js:407-424`
**Issue:** Uses `setInterval` with `clearInterval` which can drift over time.

**Recommendation:** Use `setTimeout` recursively or calculate actual elapsed time.

---

## Documentation Gaps

### 16. Missing README
**Location:** Project root
**Issue:** No README.md to explain setup, usage, and configuration.

**Recommendation:** Add a comprehensive README with:
- Prerequisites
- Installation steps
- Usage examples
- Configuration guide
- Security considerations

### 17. Missing API Documentation
**Location:** `chess-control-webapp/server.js`
**Issue:** Endpoints are not documented.

**Recommendation:** Add OpenAPI/Swagger documentation or at least comment the API endpoints.

---

## Deployment Concerns

### 18. No Health Check Implementation
**Location:** `lichess/monitor.js`
**Issue:** Monitor script has no health check or status reporting.

**Recommendation:** Add health check endpoint or status file for monitoring daemons.

### 19. No Graceful Exit in All Scripts
**Location:** `lichess/index.js`
**Issue:** Main script doesn't handle SIGTERM or provide cleanup.

**Recommendation:** Add signal handlers for graceful shutdown across all long-running scripts.

---

## Type Safety

### 20. No TypeScript or JSDoc Consistency
**Location:** Entire project
**Issue:** Plain JavaScript with inconsistent JSDoc comments. Harder to maintain as project grows.

**Recommendation:** Consider migrating to TypeScript or at least add complete JSDoc annotations.

---

## Summary Priority Matrix

| Priority | Issue | Impact |
|----------|-------|--------|
| 🔴 Critical | SSH password in plaintext | Security breach risk |
| 🔴 Critical | No web auth | Unauthorized access |
| 🟡 High | Code duplication | Maintenance burden |
| 🟡 High | Missing unit tests | Regression risk |
| 🟢 Medium | Inconsistent error handling | Debugging difficulty |
| 🟢 Medium | No rate limiting | Resource exhaustion |
| 🟢 Medium | No logging system | Debugging difficulty |
| 🟢 Low | Performance optimizations | User experience |
| 🟢 Low | Missing README | Onboarding difficulty |
