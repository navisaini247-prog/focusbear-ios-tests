import { AppQuality, AppCategories } from "@/types/AppUsage.types";
import {
  getAppQuality,
  calculateHighQualityScore,
  calculateLowQualityScore,
  calculateTotalImpact,
  calculateQualityPercentage,
} from "./AppQualityUtils";

describe("AppQualityUtils - Calculations", () => {
  describe("getAppQuality", () => {
    it("should return correct quality JSON file", () => {
      const quality = getAppQuality("com.evernote");
      expect(quality).toBe(AppQuality.VERY_PRODUCTIVE);
    });

    it("should use Android category as fallback for app not in JSON file", () => {
      const quality = getAppQuality("com.unknown.socialapp", AppCategories.SOCIAL);
      expect(quality).toBe(AppQuality.EXTREMELY_DISTRACTING);
    });

    it("should prioritize JSON file over Android category", () => {
      const quality = getAppQuality("com.evernote", AppCategories.SOCIAL);
      expect(quality).toBe(AppQuality.VERY_PRODUCTIVE); // Should use JSON,
    });

    it("should use fallback NEUTRAL when no JSON entry and no Android category", () => {
      const quality = getAppQuality("com.unknown.app.that.does.not.exist");
      expect(quality).toBe(AppQuality.NEUTRAL);
    });

    it("should use fallback NEUTRAL for unknown Android category", () => {
      const quality = getAppQuality("com.mycompany.customapp", 999); // Unknown category number
      expect(quality).toBe(AppQuality.NEUTRAL);
    });
  });

  describe("calculateHighQualityScore", () => {
    it("should calculate weighted score for productive apps", () => {
      const appsStats = [
        { packageName: "com.notion", totalTimeUsed: 2 * 60 * 60 * 1000 },
        { packageName: "com.education", totalTimeUsed: 1 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.notion", AppQuality.PRODUCTIVE], // weight 2
        ["com.education", AppQuality.VERY_PRODUCTIVE], // weight 3
      ]);

      // Notion: 2h * 2 = 4h, Education: 1h * 3 = 3h, Total: 7h
      expect(calculateHighQualityScore(appsStats, appQualities)).toBe(7 * 60 * 60 * 1000);
    });

    it("should exclude distracting and neutral apps", () => {
      const appsStats = [
        { packageName: "com.notion", totalTimeUsed: 1 * 60 * 60 * 1000 },
        { packageName: "com.tiktok", totalTimeUsed: 2 * 60 * 60 * 1000 },
        { packageName: "com.weather", totalTimeUsed: 1 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.notion", AppQuality.PRODUCTIVE],
        ["com.tiktok", AppQuality.EXTREMELY_DISTRACTING],
        ["com.weather", AppQuality.NEUTRAL],
      ]);
      // Only Notion counts: 1h * 2 = 2h
      expect(calculateHighQualityScore(appsStats, appQualities)).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe("calculateLowQualityScore", () => {
    it("should calculate weighted score for distracting apps", () => {
      const appsStats = [
        { packageName: "com.tiktok", totalTimeUsed: 3 * 60 * 60 * 1000 },
        { packageName: "com.instagram", totalTimeUsed: 2 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.tiktok", AppQuality.EXTREMELY_DISTRACTING], // weight 3
        ["com.instagram", AppQuality.EXTREMELY_DISTRACTING], // weight 3
      ]);

      const result = calculateLowQualityScore(appsStats, appQualities);

      // TikTok: 3h * 3 = 9h, Instagram: 2h * 3 = 6h, Total: 15h
      expect(result).toBe(15 * 60 * 60 * 1000);
    });

    it("should exclude productive and neutral apps", () => {
      const appsStats = [
        { packageName: "com.tiktok", totalTimeUsed: 1 * 60 * 60 * 1000 },
        { packageName: "com.notion", totalTimeUsed: 2 * 60 * 60 * 1000 },
        { packageName: "com.weather", totalTimeUsed: 1 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.tiktok", AppQuality.EXTREMELY_DISTRACTING],
        ["com.notion", AppQuality.PRODUCTIVE],
        ["com.weather", AppQuality.NEUTRAL],
      ]);

      const result = calculateLowQualityScore(appsStats, appQualities);

      // Only TikTok counts: 1h * 3 = 3h
      expect(result).toBe(3 * 60 * 60 * 1000);
    });
  });

  describe("calculateTotalImpact", () => {
    it("should sum high and low quality scores", () => {
      const result = calculateTotalImpact(100, 200);
      expect(result).toBe(300);
    });

    it("should handle zero scores", () => {
      expect(calculateTotalImpact(0, 0)).toBe(0);
      expect(calculateTotalImpact(100, 0)).toBe(100);
      expect(calculateTotalImpact(0, 200)).toBe(200);
    });
  });

  describe("calculateQualityPercentage", () => {
    it("should calculate percentage correctly", () => {
      expect(calculateQualityPercentage(40, 100)).toBe(40);
      expect(calculateQualityPercentage(60, 100)).toBe(60);
      expect(calculateQualityPercentage(33, 100)).toBe(33);
    });

    it("should round to nearest integer", () => {
      expect(calculateQualityPercentage(33.4, 100)).toBe(33);
      expect(calculateQualityPercentage(33.5, 100)).toBe(34);
      expect(calculateQualityPercentage(33.6, 100)).toBe(34);
    });

    it("should return 0 when total impact is 0", () => {
      expect(calculateQualityPercentage(0, 0)).toBe(0);
      expect(calculateQualityPercentage(100, 0)).toBe(0);
    });
  });

  describe("Integration: Complete calculation flow", () => {
    it("should calculate 100% high quality for only productive apps", () => {
      const appsStats = [
        { packageName: "com.evernote", totalTimeUsed: 2 * 60 * 60 * 1000 },
        { packageName: "com.duolingo", totalTimeUsed: 1 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.evernote", AppQuality.VERY_PRODUCTIVE], // PRODUCTIVITY category
        ["com.duolingo", AppQuality.VERY_PRODUCTIVE], // EDUCATION category
      ]);

      const highScore = calculateHighQualityScore(appsStats, appQualities);
      const lowScore = calculateLowQualityScore(appsStats, appQualities);
      const totalImpact = calculateTotalImpact(highScore, lowScore);
      const highPercentage = calculateQualityPercentage(highScore, totalImpact);
      const lowPercentage = calculateQualityPercentage(lowScore, totalImpact);

      expect(highPercentage).toBe(100);
      expect(lowPercentage).toBe(0);
    });

    it("should calculate 100% low quality for only distracting apps", () => {
      const appsStats = [
        { packageName: "com.zhiliaoapp.musically", totalTimeUsed: 3 * 60 * 60 * 1000 },
        { packageName: "com.instagram.android", totalTimeUsed: 2 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.zhiliaoapp.musically", AppQuality.EXTREMELY_DISTRACTING], // TikTok - SOCIAL category
        ["com.instagram.android", AppQuality.EXTREMELY_DISTRACTING], // Instagram - SOCIAL category
      ]);

      const highScore = calculateHighQualityScore(appsStats, appQualities);
      const lowScore = calculateLowQualityScore(appsStats, appQualities);
      const totalImpact = calculateTotalImpact(highScore, lowScore);
      const highPercentage = calculateQualityPercentage(highScore, totalImpact);
      const lowPercentage = calculateQualityPercentage(lowScore, totalImpact);

      expect(highPercentage).toBe(0);
      expect(lowPercentage).toBe(100);
    });

    it("should calculate mixed percentages for balanced usage", () => {
      const appsStats = [
        { packageName: "com.google.android.youtube", totalTimeUsed: 2 * 60 * 60 * 1000 },
        { packageName: "com.evernote", totalTimeUsed: 2 * 60 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.google.android.youtube", AppQuality.EXTREMELY_DISTRACTING], // VIDEO_PLAYERS category, weight 3
        ["com.evernote", AppQuality.VERY_PRODUCTIVE], // PRODUCTIVITY category, weight 3
      ]);

      const highScore = calculateHighQualityScore(appsStats, appQualities);
      const lowScore = calculateLowQualityScore(appsStats, appQualities);
      const totalImpact = calculateTotalImpact(highScore, lowScore);
      const highPercentage = calculateQualityPercentage(highScore, totalImpact);
      const lowPercentage = calculateQualityPercentage(lowScore, totalImpact);

      // YouTube: 2h * 3 = 6, Evernote: 2h * 3 = 6, Total: 12
      // High: 6/12 = 50%, Low: 6/12 = 50%
      expect(highPercentage).toBe(50);
      expect(lowPercentage).toBe(50);
    });

    it("should return 0% for both when only neutral apps are used", () => {
      const appsStats = [
        { packageName: "com.android.settings", totalTimeUsed: 30 * 60 * 1000 },
        { packageName: "com.android.calculator2", totalTimeUsed: 15 * 60 * 1000 },
      ];

      const appQualities = new Map([
        ["com.android.settings", AppQuality.NEUTRAL],
        ["com.android.calculator2", AppQuality.NEUTRAL],
      ]);

      const highScore = calculateHighQualityScore(appsStats, appQualities);
      const lowScore = calculateLowQualityScore(appsStats, appQualities);
      const totalImpact = calculateTotalImpact(highScore, lowScore);
      const highPercentage = calculateQualityPercentage(highScore, totalImpact);
      const lowPercentage = calculateQualityPercentage(lowScore, totalImpact);

      expect(highPercentage).toBe(0);
      expect(lowPercentage).toBe(0);
    });
  });
});
