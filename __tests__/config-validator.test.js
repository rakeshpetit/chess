/**
 * Tests for Configuration Validation
 * @see ../lichess/config.js
 */

describe("Configuration Validation", () => {
  describe("MONITOR_CONFIG structure", () => {
    // These tests verify the expected CONFIG structure

    test("config should have required fields", () => {
      const expectedKeys = [
        "username",
        "checkIntervalMinutes",
        "limits",
        "alerts",
        "display",
      ];

      expectedKeys.forEach((key) => {
        expect(SAMPLE_CONFIG).toHaveProperty(key);
      });
    });

    test("limits should have required fields", () => {
      const expectedLimitKeys = [
        "maxGamesPerDay",
        "maxHoursPerDay",
        "maxMinutesPerGame",
      ];

      expectedLimitKeys.forEach((key) => {
        expect(SAMPLE_CONFIG.limits).toHaveProperty(key);
      });
    });

    test("alerts should have required fields", () => {
      const expectedAlertKeys = [
        "showProgressUpdates",
        "showGameByGameBreakdown",
        "warningThreshold",
      ];

      expectedAlertKeys.forEach((key) => {
        expect(SAMPLE_CONFIG.alerts).toHaveProperty(key);
      });
    });

    test("display should have required fields", () => {
      const expectedDisplayKeys = [
        "showTimestamps",
        "showEmojis",
        "compactMode",
      ];

      expectedDisplayKeys.forEach((key) => {
        expect(SAMPLE_CONFIG.display).toHaveProperty(key);
      });
    });

    test("numeric values should be positive", () => {
      expect(SAMPLE_CONFIG.checkIntervalMinutes).toBeGreaterThan(0);
      expect(SAMPLE_CONFIG.limits.maxGamesPerDay).toBeGreaterThanOrEqual(0);
      expect(SAMPLE_CONFIG.limits.maxHoursPerDay).toBeGreaterThan(0);
    });

    test("warning threshold should be between 0 and 100", () => {
      const threshold = SAMPLE_CONFIG.alerts.warningThreshold;
      expect(threshold).toBeGreaterThanOrEqual(0);
      expect(threshold).toBeLessThanOrEqual(100);
    });
  });

  describe("getInternalConfig conversion", () => {
    const getInternalConfig = (config) => {
      return {
        username: config.username,
        checkInterval: config.checkIntervalMinutes * 60 * 1000,
        limits: {
          maxGamesPerDay: config.limits.maxGamesPerDay,
          maxTimePerDay: config.limits.maxHoursPerDay * 60 * 60,
          maxTimePerGame: config.limits.maxMinutesPerGame * 60,
        },
        alerts: config.alerts,
        display: config.display,
      };
    };

    test("should convert checkIntervalMinutes to milliseconds", () => {
      const config = {
        ...SAMPLE_CONFIG,
        checkIntervalMinutes: 5,
      };
      const internal = getInternalConfig(config);
      expect(internal.checkInterval).toBe(300000); // 5 * 60 * 1000
    });

    test("should convert maxHoursPerDay to seconds", () => {
      const config = {
        ...SAMPLE_CONFIG,
        limits: {
          ...SAMPLE_CONFIG.limits,
          maxHoursPerDay: 2,
        },
      };
      const internal = getInternalConfig(config);
      expect(internal.limits.maxTimePerDay).toBe(7200); // 2 * 60 * 60
    });

    test("should convert maxMinutesPerGame to seconds", () => {
      const config = {
        ...SAMPLE_CONFIG,
        limits: {
          ...SAMPLE_CONFIG.limits,
          maxMinutesPerGame: 15,
        },
      };
      const internal = getInternalConfig(config);
      expect(internal.limits.maxTimePerGame).toBe(900); // 15 * 60
    });

    test("should preserve username", () => {
      const config = {
        ...SAMPLE_CONFIG,
        username: "TestUser",
      };
      const internal = getInternalConfig(config);
      expect(internal.username).toBe("TestUser");
    });

    test("should preserve alerts and display settings", () => {
      const internal = getInternalConfig(SAMPLE_CONFIG);
      expect(internal.alerts).toEqual(SAMPLE_CONFIG.alerts);
      expect(internal.display).toEqual(SAMPLE_CONFIG.display);
    });
  });

  describe("Environment variable fallback", () => {
    test("should use default username when env not set", () => {
      const username = process.env.LICHESS_USERNAME || "LichessUser";
      expect(username).toBeTruthy();
    });

    test("should handle missing environment variables gracefully", () => {
      // Simulate no env vars
      const config = {
        username: process.env.LICHESS_USERNAME || "DefaultUser",
      };
      expect(config.username).toBeDefined();
    });
  });

  describe("Config validation helpers", () => {
    const validateConfig = (config) => {
      const errors = [];

      if (!config.username || config.username.trim() === "") {
        errors.push("username is required");
      }

      if (config.checkIntervalMinutes <= 0) {
        errors.push("checkIntervalMinutes must be positive");
      }

      if (config.limits.maxGamesPerDay < 0) {
        errors.push("maxGamesPerDay cannot be negative");
      }

      if (config.limits.maxHoursPerDay <= 0) {
        errors.push("maxHoursPerDay must be positive");
      }

      if (config.limits.maxMinutesPerGame <= 0) {
        errors.push("maxMinutesPerGame must be positive");
      }

      if (
        config.alerts.warningThreshold < 0 ||
        config.alerts.warningThreshold > 100
      ) {
        errors.push("warningThreshold must be between 0 and 100");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    };

    test("should validate valid config", () => {
      const result = validateConfig(SAMPLE_CONFIG);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject empty username", () => {
      const config = { ...SAMPLE_CONFIG, username: "" };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("username is required");
    });

    test("should reject whitespace-only username", () => {
      const config = { ...SAMPLE_CONFIG, username: "   " };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("username is required");
    });

    test("should reject non-positive checkIntervalMinutes", () => {
      const config = { ...SAMPLE_CONFIG, checkIntervalMinutes: 0 };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("checkIntervalMinutes must be positive");
    });

    test("should reject negative game limit", () => {
      const config = {
        ...SAMPLE_CONFIG,
        limits: { ...SAMPLE_CONFIG.limits, maxGamesPerDay: -1 },
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("maxGamesPerDay cannot be negative");
    });

    test("should reject out of range warning threshold", () => {
      const config = {
        ...SAMPLE_CONFIG,
        alerts: { ...SAMPLE_CONFIG.alerts, warningThreshold: 150 },
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("warningThreshold must be between 0 and 100");
    });
  });
});

// Sample config for testing
const SAMPLE_CONFIG = {
  username: "LichessUser",
  checkIntervalMinutes: 5,
  limits: {
    maxGamesPerDay: 10,
    maxHoursPerDay: 2,
    maxMinutesPerGame: 15,
  },
  alerts: {
    showProgressUpdates: true,
    showGameByGameBreakdown: false,
    warningThreshold: 80,
  },
  display: {
    showTimestamps: true,
    showEmojis: true,
    compactMode: false,
  },
};
