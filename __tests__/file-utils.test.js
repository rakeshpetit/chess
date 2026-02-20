/**
 * Tests for File Utilities
 * @see ../lib/file-utils.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  readLocalHostsFile,
  getFileSize,
} from "../lib/file-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test directory for file operations
const TEST_DIR = path.join(__dirname, "test-files");

describe("File Utilities", () => {
  // Setup and teardown
  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test directory
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clean up any test files before each test
    try {
      const files = fs.readdirSync(TEST_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_DIR, file));
      }
    } catch (e) {
      // Directory might not exist
    }
  });

describe("readLocalHostsFile", () => {
    test("should read blocking hosts file when isBlocking is true", async () => {
      fs.writeFileSync(
        path.join(TEST_DIR, "hosts-blocked.txt"),
        "127.0.0.1 chess.com"
      );

      const config = {
        configDir: TEST_DIR,
        blockedFileName: "hosts-blocked.txt",
        allowedFileName: "hosts-allowed.txt",
      };

      const result = await readLocalHostsFile(config, true);
      expect(result).toBe("127.0.0.1 chess.com");
    });

    test("should read allowed hosts file when isBlocking is false", async () => {
      fs.writeFileSync(
        path.join(TEST_DIR, "hosts-allowed.txt"),
        "# No blocks"
      );

      const config = {
        configDir: TEST_DIR,
        blockedFileName: "hosts-blocked.txt",
        allowedFileName: "hosts-allowed.txt",
      };

      const result = await readLocalHostsFile(config, false);
      expect(result).toBe("# No blocks");
    });

    test("should throw error when file does not exist", async () => {
      const config = {
        configDir: TEST_DIR,
        blockedFileName: "nonexistent.txt",
        allowedFileName: "also-nonexistent.txt",
      };

      await expect(readLocalHostsFile(config, true)).rejects.toThrow(
        /Failed to read hosts file/
      );
    });

    test("should read multi-line host files correctly", async () => {
      const multiLineContent = `127.0.0.1 chess.com
127.0.0.1 lichess.org
127.0.0.1 example.com`;

      fs.writeFileSync(path.join(TEST_DIR, "hosts-blocked.txt"), multiLineContent);

      const config = {
        configDir: TEST_DIR,
        blockedFileName: "hosts-blocked.txt",
        allowedFileName: "hosts-allowed.txt",
      };

      const result = await readLocalHostsFile(config, true);
      expect(result).toBe(multiLineContent);
    });

    test("should return empty string for empty file", async () => {
      fs.writeFileSync(path.join(TEST_DIR, "empty.txt"), "");

      const config = {
        configDir: TEST_DIR,
        blockedFileName: "empty.txt",
        allowedFileName: "empty.txt",
      };

      const result = await readLocalHostsFile(config, true);
      expect(result).toBe("");
    });
  });

describe("getFileSize", () => {
    test("should return file size and content for existing file", () => {
      fs.writeFileSync(path.join(TEST_DIR, "test-file.txt"), "hello world");

      const filePath = path.join(TEST_DIR, "test-file.txt");
      const result = getFileSize(filePath);

      expect(result).not.toBeNull();
      expect(result.size).toBe(11); // "hello world" is 11 bytes
      expect(result.content).toBe("hello world");
    });

    test("should return null for non-existent file", () => {
      const result = getFileSize(path.join(TEST_DIR, "non-existent.txt"));
      expect(result).toBeNull();
    });

    test("should handle empty file", () => {
      fs.writeFileSync(path.join(TEST_DIR, "empty.txt"), "");

      const filePath = path.join(TEST_DIR, "empty.txt");
      const result = getFileSize(filePath);

      expect(result).not.toBeNull();
      expect(result.size).toBe(0);
      expect(result.content).toBe("");
    });

    test("should handle large files", () => {
      const largeContent = "x".repeat(10000);
      fs.writeFileSync(path.join(TEST_DIR, "large.txt"), largeContent);

      const filePath = path.join(TEST_DIR, "large.txt");
      const result = getFileSize(filePath);

      expect(result).not.toBeNull();
      expect(result.size).toBe(10000);
      expect(result.content).toBe(largeContent);
    });
  });
});
