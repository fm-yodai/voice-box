import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAccessToken } from "../lib/jwt.js";
import type { AuthUser } from "./auth.js";
import { authMiddleware } from "./auth.js";

const ACCESS_SECRET = "test-access-secret";

type Env = { Variables: { user: AuthUser } };

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.stubEnv("JWT_ACCESS_SECRET", ACCESS_SECRET);
    vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function createApp() {
    const app = new Hono<Env>();
    app.use("/protected/*", authMiddleware);
    app.get("/protected/resource", (c) => {
      const user = c.get("user");
      return c.json({ user });
    });
    return app;
  }

  it("returns 401 when no Authorization header is provided", async () => {
    const app = createApp();
    const res = await app.request("/protected/resource");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Authorization header is required");
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const app = createApp();
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Basic some-token" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for an invalid token", async () => {
    const app = createApp();
    const res = await app.request("/protected/resource", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired token");
  });

  it("allows access with a valid token and sets user context", async () => {
    const app = createApp();
    const token = await generateAccessToken({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      oauthProvider: "google",
      anonymousDisplayId: "user-550e8400",
    });

    const res = await app.request("/protected/resource", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(body.user.oauthProvider).toBe("google");
    expect(body.user.anonymousDisplayId).toBe("user-550e8400");
  });
});
