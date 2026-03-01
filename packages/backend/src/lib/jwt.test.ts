import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt.js";

const ACCESS_SECRET = "test-access-secret";
const REFRESH_SECRET = "test-refresh-secret";

describe("JWT", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_ACCESS_SECRET", ACCESS_SECRET);
    vi.stubEnv("JWT_REFRESH_SECRET", REFRESH_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Access Token", () => {
    const payload = {
      userId: "550e8400-e29b-41d4-a716-446655440000",
      oauthProvider: "google",
      anonymousDisplayId: "user-550e8400",
    };

    it("generates and verifies an access token", async () => {
      const token = await generateAccessToken(payload);
      expect(typeof token).toBe("string");

      const decoded = await verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.oauthProvider).toBe(payload.oauthProvider);
      expect(decoded.anonymousDisplayId).toBe(payload.anonymousDisplayId);
    });

    it("rejects an invalid access token", async () => {
      await expect(verifyAccessToken("invalid-token")).rejects.toThrow();
    });

    it("rejects a token signed with the wrong secret", async () => {
      const token = await generateAccessToken(payload);
      vi.stubEnv("JWT_ACCESS_SECRET", "wrong-secret");
      await expect(verifyAccessToken(token)).rejects.toThrow();
    });
  });

  describe("Refresh Token", () => {
    const payload = {
      userId: "550e8400-e29b-41d4-a716-446655440000",
    };

    it("generates and verifies a refresh token", async () => {
      const token = await generateRefreshToken(payload);
      expect(typeof token).toBe("string");

      const decoded = await verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
    });

    it("rejects an invalid refresh token", async () => {
      await expect(verifyRefreshToken("invalid-token")).rejects.toThrow();
    });
  });

  describe("missing secrets", () => {
    it("throws if JWT_ACCESS_SECRET is not set", async () => {
      vi.stubEnv("JWT_ACCESS_SECRET", "");
      await expect(
        generateAccessToken({
          userId: "test",
          oauthProvider: "google",
          anonymousDisplayId: "user-test",
        })
      ).rejects.toThrow("JWT_ACCESS_SECRET is not set");
    });

    it("throws if JWT_REFRESH_SECRET is not set", async () => {
      vi.stubEnv("JWT_REFRESH_SECRET", "");
      await expect(generateRefreshToken({ userId: "test" })).rejects.toThrow(
        "JWT_REFRESH_SECRET is not set"
      );
    });
  });
});
