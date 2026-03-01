import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../middleware/auth.js";
import type { Repositories } from "../repositories/index.js";
import { auth } from "./auth.js";

vi.mock("../lib/google-oauth.js", () => ({
  getGoogleOAuthConfig: () => ({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "http://localhost:3000/auth/google/callback",
  }),
  buildGoogleAuthUrl: (_config: unknown, _state: string) =>
    "https://accounts.google.com/o/oauth2/v2/auth?mock=true",
  exchangeCodeForTokens: vi.fn().mockResolvedValue({
    access_token: "google-access-token",
    id_token: "google-id-token",
    token_type: "Bearer",
    expires_in: 3600,
  }),
  fetchGoogleUserInfo: vi.fn().mockResolvedValue({
    sub: "google-user-sub-123",
    email: "test@example.com",
  }),
}));

vi.mock("../lib/jwt.js", () => ({
  generateAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
  generateRefreshToken: vi.fn().mockResolvedValue("mock-refresh-token"),
  verifyRefreshToken: vi.fn().mockResolvedValue({
    userId: "550e8400-e29b-41d4-a716-446655440000",
  }),
}));

type Env = { Variables: { repositories: Repositories; user: AuthUser } };

function createMockRepos(): Repositories {
  return {
    posts: {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
    },
    responses: {
      create: vi.fn(),
      findByPostId: vi.fn(),
    },
    users: {
      create: vi.fn(),
      findById: vi.fn(),
      findByOAuthSub: vi.fn(),
    },
  };
}

function createApp(repos: Repositories) {
  const app = new Hono<Env>();
  app.use("*", async (c, next) => {
    c.set("repositories", repos);
    await next();
  });
  app.route("/", auth);
  return app;
}

const sampleUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  oauthProvider: "google" as const,
  oauthSub: "google-user-sub-123",
  email: "test@example.com",
  anonymousDisplayId: "user-550e8400",
  createdAt: new Date("2026-02-28T10:00:00.000Z"),
  updatedAt: new Date("2026-02-28T10:00:00.000Z"),
};

describe("GET /auth/google", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  it("redirects to Google OAuth URL", async () => {
    const res = await app.request("/auth/google", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("accounts.google.com");
  });
});

describe("GET /auth/google/callback", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if no code is provided", async () => {
    const res = await app.request("/auth/google/callback");
    expect(res.status).toBe(400);
  });

  it("creates a new user and returns tokens", async () => {
    vi.mocked(repos.users.findByOAuthSub).mockResolvedValue(null);
    vi.mocked(repos.users.create).mockResolvedValue(sampleUser);

    const res = await app.request("/auth/google/callback?code=test-auth-code");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.accessToken).toBe("mock-access-token");
    expect(body.refreshToken).toBe("mock-refresh-token");
    expect(body.user.id).toBe(sampleUser.id);
    expect(repos.users.create).toHaveBeenCalledOnce();
  });

  it("returns tokens for an existing user without creating a new one", async () => {
    vi.mocked(repos.users.findByOAuthSub).mockResolvedValue(sampleUser);

    const res = await app.request("/auth/google/callback?code=test-auth-code");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.accessToken).toBe("mock-access-token");
    expect(body.refreshToken).toBe("mock-refresh-token");
    expect(repos.users.create).not.toHaveBeenCalled();
  });
});

describe("POST /auth/refresh", () => {
  let repos: Repositories;
  let app: Hono<Env>;

  beforeEach(() => {
    repos = createMockRepos();
    app = createApp(repos);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if no refresh token is provided", async () => {
    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns new tokens for a valid refresh token", async () => {
    vi.mocked(repos.users.findById).mockResolvedValue(sampleUser);

    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.accessToken).toBe("mock-access-token");
    expect(body.refreshToken).toBe("mock-refresh-token");
  });

  it("returns 401 if user is not found", async () => {
    vi.mocked(repos.users.findById).mockResolvedValue(null);

    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
    });
    expect(res.status).toBe(401);
  });
});
