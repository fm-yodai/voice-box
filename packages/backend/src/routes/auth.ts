import { Hono } from "hono";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
} from "../lib/google-oauth.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import type { Repositories } from "../repositories/index.js";

type Env = { Variables: { repositories: Repositories } };

const auth = new Hono<Env>();

auth.get("/auth/google", (c) => {
  const config = getGoogleOAuthConfig();
  const state = crypto.randomUUID();
  const url = buildGoogleAuthUrl(config, state);
  return c.redirect(url);
});

auth.get("/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ error: "Authorization code is required" }, 400);
  }

  const config = getGoogleOAuthConfig();

  const tokens = await exchangeCodeForTokens(config, code);
  const googleUser = await fetchGoogleUserInfo(tokens.access_token);

  const { users } = c.get("repositories");

  let user = await users.findByOAuthSub("google", googleUser.sub);
  if (!user) {
    user = await users.create({
      oauthProvider: "google",
      oauthSub: googleUser.sub,
      email: googleUser.email,
    });
  }

  const accessToken = await generateAccessToken({
    userId: user.id,
    oauthProvider: user.oauthProvider,
    anonymousDisplayId: user.anonymousDisplayId,
  });
  const refreshToken = await generateRefreshToken({ userId: user.id });

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      anonymousDisplayId: user.anonymousDisplayId,
    },
  });
});

auth.post("/auth/refresh", async (c) => {
  const body = await c.req.json();
  const { refreshToken } = body;

  if (!refreshToken) {
    return c.json({ error: "Refresh token is required" }, 400);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const { users } = c.get("repositories");
    const user = await users.findById(payload.userId);

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      oauthProvider: user.oauthProvider,
      anonymousDisplayId: user.anonymousDisplayId,
    });
    const newRefreshToken = await generateRefreshToken({ userId: user.id });

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }
});

export { auth };
