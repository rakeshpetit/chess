/**
 * Tests for SSH Utility Functions
 * @see ../lib/ssh.js
 */

import {
  escapeForShell,
  buildSudoCommand,
  buildHostsUploadCommand,
  buildBrowserKillCommand,
} from "../lib/ssh.js";

describe("escapeForShell", () => {
  test("should return unchanged string without single quotes", () => {
    expect(escapeForShell("hello")).toBe("hello");
    expect(escapeForShell("hello world")).toBe("hello world");
    expect(escapeForShell("test123")).toBe("test123");
  });

  test("should escape single quotes properly", () => {
    expect(escapeForShell("it's")).toBe("it'\\''s");
    expect(escapeForShell("don't")).toBe("don'\\''t");
  });

  test("should escape multiple single quotes", () => {
    expect(escapeForShell("it's John's")).toBe("it'\\''s John'\\''s");
  });

  test("should handle empty string", () => {
    expect(escapeForShell("")).toBe("");
  });

  test("should handle special characters except single quotes", () => {
    expect(escapeForShell("test$var")).toBe("test$var");
    expect(escapeForShell("test;rm")).toBe("test;rm");
    expect(escapeForShell("test|cat")).toBe("test|cat");
  });
});

describe("buildSudoCommand", () => {
  test("should build basic sudo command", () => {
    const result = buildSudoCommand("password123", "echo hello");
    expect(result).toContain("echo 'password123' | sudo -S bash -c");
    expect(result).toContain("echo hello");
  });

  test("should escape password with single quotes", () => {
    const result = buildSudoCommand("pass'word", "echo test");
    expect(result).toContain("echo 'pass'\\''word' | sudo -S bash -c");
  });

  test("should escape command with single quotes", () => {
    const result = buildSudoCommand("password", "echo 'hello'");
    // Single quotes in command are escaped as '\'' for shell safety
    expect(result).toContain("sudo -S bash -c");
    expect(result).toContain("'\\''hello'\\''");
  });

  test("should handle complex commands", () => {
    const command = "cp /etc/hosts /etc/hosts.backup && echo 'new content' > /etc/hosts";
    const result = buildSudoCommand("password", command);
    expect(result).toContain("sudo -S bash -c");
  });

  test("should handle empty password", () => {
    const result = buildSudoCommand("", "echo test");
    expect(result).toBe("echo '' | sudo -S bash -c 'echo test'");
  });

  test("should handle empty command", () => {
    const result = buildSudoCommand("password", "");
    expect(result).toBe("echo 'password' | sudo -S bash -c ''");
  });
});

describe("buildHostsUploadCommand", () => {
  test("should build basic upload command", () => {
    const result = buildHostsUploadCommand("/etc/hosts", "/etc/hosts.backup", "127.0.0.1 localhost");
    expect(result).toContain("cp /etc/hosts /etc/hosts.backup");
    expect(result).toContain("printf '%s\\n' '127.0.0.1 localhost' > /etc/hosts");
  });

  test("should escape content with single quotes", () => {
    const content = "127.0.0.1 test'site.com";
    const result = buildHostsUploadCommand("/etc/hosts", "/etc/hosts.backup", content);
    expect(result).toContain("printf '%s\\n' '127.0.0.1 test'\\''site.com' > /etc/hosts");
  });

  test("should handle multi-line content", () => {
    const content = "127.0.0.1 localhost\n127.0.0.1 chess.com";
    const result = buildHostsUploadCommand("/etc/hosts", "/etc/hosts.backup", content);
    expect(result).toContain("cp /etc/hosts /etc/hosts.backup");
  });

  test("should handle empty content", () => {
    const result = buildHostsUploadCommand("/etc/hosts", "/etc/hosts.backup", "");
    expect(result).toBe("cp /etc/hosts /etc/hosts.backup && printf '%s\\n' '' > /etc/hosts");
  });

  test("should use custom paths", () => {
    const result = buildHostsUploadCommand("/custom/hosts", "/custom/backup", "content");
    expect(result).toContain("cp /custom/hosts /custom/backup");
    expect(result).toContain("> /custom/hosts");
  });
});

describe("buildBrowserKillCommand", () => {
  test("should build kill command for single browser", () => {
    const result = buildBrowserKillCommand(["firefox"]);
    expect(result).toBe("pkill -f 'firefox' || true");
  });

  test("should build kill command for multiple browsers", () => {
    const result = buildBrowserKillCommand(["firefox", "brave"]);
    expect(result).toBe("pkill -f 'firefox brave' || true");
  });

  test("should handle empty browser list", () => {
    const result = buildBrowserKillCommand([]);
    expect(result).toBe("pkill -f '' || true");
  });

  test("should handle multiple browsers with spaces in names", () => {
    const result = buildBrowserKillCommand(["Google Chrome", "Mozilla Firefox"]);
    expect(result).toBe("pkill -f 'Google Chrome Mozilla Firefox' || true");
  });
});
