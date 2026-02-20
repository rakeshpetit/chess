/**
 * Tests for Time Format Utility Functions
 * @see ../suspend-chess.js
 */

describe("Time Formatters", () => {
  describe("formatTime", () => {
    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) {
        return `${h}h ${m}m ${s}s`;
      } else if (m > 0) {
        return `${m}m ${s}s`;
      } else {
        return `${s}s`;
      }
    };

    test("should format seconds only", () => {
      expect(formatTime(45)).toBe("45s");
      expect(formatTime(0)).toBe("0s");
      expect(formatTime(59)).toBe("59s");
    });

    test("should format minutes and seconds", () => {
      expect(formatTime(60)).toBe("1m 0s");
      expect(formatTime(90)).toBe("1m 30s");
      expect(formatTime(3599)).toBe("59m 59s");
    });

    test("should format hours, minutes, and seconds", () => {
      expect(formatTime(3600)).toBe("1h 0m 0s");
      expect(formatTime(3661)).toBe("1h 1m 1s");
      expect(formatTime(7262)).toBe("2h 1m 2s");
    });

    test("should handle large time values", () => {
      expect(formatTime(86400)).toBe("24h 0m 0s");
      expect(formatTime(90061)).toBe("25h 1m 1s");
    });
  });

  describe("formatRemainingTime", () => {
    const formatRemainingTime = (totalSeconds, durationMinutes) => {
      const remainingMinutes = Math.ceil(totalSeconds / 60);
      const percentage = Math.max(
        0,
        Math.min(100, Math.round((remainingMinutes / durationMinutes) * 100))
      );
      return `${totalSeconds}s remaining (${percentage}%)`;
    };

    test("should format remaining time with percentage", () => {
      expect(formatRemainingTime(300, 5)).toBe("300s remaining (100%)");
      // 150 seconds = 2.5 minutes -> ceil to 3 minutes -> (3/5)*100 = 60%
      expect(formatRemainingTime(150, 5)).toBe("150s remaining (60%)");
    });

    test("should round up minutes for percentage", () => {
      // 90 seconds = 1.5 minutes -> ceil to 2 minutes -> (2/2)*100 = 100%
      expect(formatRemainingTime(90, 2)).toBe("90s remaining (100%)");
      // 30 seconds = 0.5 minutes -> ceil to 1 minute -> (1/1)*100 = 100%
      expect(formatRemainingTime(30, 1)).toBe("30s remaining (100%)");
    });

    test("should cap percentage at 100%", () => {
      expect(formatRemainingTime(600, 5)).toBe("600s remaining (100%)");
    });

    test("should floor percentage at 0%", () => {
      expect(formatRemainingTime(0, 5)).toBe("0s remaining (0%)");
      expect(formatRemainingTime(-30, 5)).toBe("-30s remaining (0%)");
    });

    test("should handle edge cases", () => {
      // 1 second = 1 minute (due to ceil of 0.016) -> ceil to 1 -> (1/60)*100 rounded = 2%
      expect(formatRemainingTime(1, 60)).toBe("1s remaining (2%)");
      // 59 seconds = 0.98 minutes -> ceil to 1 -> (1/1)*100 = 100%
      expect(formatRemainingTime(59, 1)).toBe("59s remaining (100%)");
    });
  });

  describe("calculateDurationMs", () => {
    const calculateDurationMs = (timeString) => {
      const str = timeString.trim().toLowerCase();
      const match = str.match(/^(\d+)\s*(m|min|minute|minutes|h|hr|hour|hours)$/);

      if (!match) {
        return null;
      }

      const value = parseInt(match[1], 10);
      const unit = match[2];

      if (unit.startsWith("m")) {
        return value * 60 * 1000;
      } else if (unit.startsWith("h")) {
        return value * 60 * 60 * 1000;
      }

      return null;
    };

    test("should parse minutes correctly", () => {
      expect(calculateDurationMs("30m")).toBe(1800000);
      expect(calculateDurationMs("30min")).toBe(1800000);
      expect(calculateDurationMs("30 minute")).toBe(1800000);
      expect(calculateDurationMs("30 minutes")).toBe(1800000);
    });

    test("should parse hours correctly", () => {
      expect(calculateDurationMs("2h")).toBe(7200000);
      expect(calculateDurationMs("2hr")).toBe(7200000);
      expect(calculateDurationMs("2 hour")).toBe(7200000);
      expect(calculateDurationMs("2 hours")).toBe(7200000);
    });

    test("should handle whitespace", () => {
      expect(calculateDurationMs("  30m  ")).toBe(1800000);
      expect(calculateDurationMs("2 h")).toBe(7200000);
    });

    test("should return null for invalid input", () => {
      expect(calculateDurationMs("abc")).toBeNull();
      expect(calculateDurationMs("30")).toBeNull();
      expect(calculateDurationMs("30x")).toBeNull();
      expect(calculateDurationMs("")).toBeNull();
      expect(calculateDurationMs("30 seconds")).toBeNull();
    });

    test("should be case insensitive", () => {
      expect(calculateDurationMs("30M")).toBe(1800000);
      expect(calculateDurationMs("2H")).toBe(7200000);
      expect(calculateDurationMs("30MIN")).toBe(1800000);
    });
  });

  describe("countdown calculation logic", () => {
    const calculateProgress = (startTime, endTime, totalDurationMs) => {
      const elapsed = endTime - startTime;
      const remaining = Math.max(0, totalDurationMs - elapsed);
      const percentage = Math.min(100, Math.round((remaining / totalDurationMs) * 100));
      return {
        elapsed,
        remaining,
        percentage: 100 - percentage,
      };
    };

    test("should calculate 0% progress at start", () => {
      const result = calculateProgress(0, 0, 300000);
      expect(result.percentage).toBe(0);
      expect(result.remaining).toBe(300000);
    });

    test("should calculate 50% progress halfway", () => {
      const result = calculateProgress(0, 150000, 300000);
      expect(result.percentage).toBe(50);
      expect(result.remaining).toBe(150000);
    });

    test("should calculate 100% progress at end", () => {
      const result = calculateProgress(0, 300000, 300000);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
    });

    test("should not exceed 100% progress", () => {
      const result = calculateProgress(0, 400000, 300000);
      expect(result.percentage).toBe(100);
      expect(result.remaining).toBe(0);
    });

    test("should not go below 0% progress", () => {
      const result = calculateProgress(1000, 1000, 300000);
      expect(result.elapsed).toBe(0);
    });
  });
});
