import express from "express";
import { OAuth2Client } from "google-auth-library";
import { createHmac, randomBytes, randomInt } from "node:crypto";

import * as defaultStorage from "../storage/index.mjs";
import {
  clearSessionCookie,
  createSessionToken,
  getSessionConfig,
  getSessionExpiresAt,
  hashSessionToken,
  readCookie,
  readSessionToken,
  setSessionCookie,
} from "./sessionCookies.mjs";

const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_OAUTH_STATE_COOKIE = "zelthir_google_oauth_state";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_CODE_PATTERN = /^\d{6}$/;

class AuthConfigurationError extends Error {}

export function createAuthRouter({ storage = defaultStorage, env = process.env } = {}) {
  const router = express.Router();
  const sessionConfig = getSessionConfig(env);

  router.get("/api/auth/options", (_req, res) => {
    res.json({
      ok: true,
      providers: {
        emailCode: {
          enabled: isEmailCodeAuthEnabled(env),
          developmentOnly: env.NODE_ENV === "production"
            ? false
            : !isExplicitlyEnabled(env.EMAIL_CODE_AUTH_ENABLED),
        },
        google: {
          enabled: isGoogleOAuthConfigured(env),
        },
      },
    });
  });

  router.post("/api/auth/start", async (req, res) => {
    if (!isEmailCodeAuthEnabled(env)) {
      res.status(404).json({ ok: false, error: "Email code sign-in is not available." });
      return;
    }

    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      res.status(400).json({ ok: false, error: "Enter a valid email address." });
      return;
    }

    let codeHash;
    const code = generateLoginCode();
    try {
      codeHash = hashLoginCode(email, code, env);
    } catch (error) {
      logAuthFailure("login code configuration", error);
      res.status(503).json({ ok: false, error: "Authentication is not configured." });
      return;
    }

    const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS);
    try {
      await callStorage(storage, "createLoginCode", email, codeHash, expiresAt);
    } catch (error) {
      logAuthFailure("login code storage", error);
      res.status(503).json({ ok: false, error: "Authentication storage unavailable." });
      return;
    }

    logDevAuthCode(email, code, expiresAt, env);
    res.json({
      ok: true,
      mode: "code",
      message: "Check your email for a sign-in code.",
    });
  });

  router.post("/api/auth/verify", async (req, res) => {
    if (!isEmailCodeAuthEnabled(env)) {
      res.status(404).json({ ok: false, error: "Email code sign-in is not available." });
      return;
    }

    const email = normalizeEmail(req.body?.email);
    const code = normalizeLoginCode(req.body?.code);
    if (!isValidEmail(email) || !LOGIN_CODE_PATTERN.test(code)) {
      res.status(400).json({ ok: false, error: "Invalid or expired code." });
      return;
    }

    let codeHash;
    try {
      codeHash = hashLoginCode(email, code, env);
    } catch (error) {
      logAuthFailure("login code configuration", error);
      res.status(503).json({ ok: false, error: "Authentication is not configured." });
      return;
    }

    let consumedCode;
    try {
      consumedCode = await callStorage(storage, "consumeLoginCode", email, codeHash, new Date());
    } catch (error) {
      logAuthFailure("login code verification", error);
      res.status(503).json({ ok: false, error: "Authentication storage unavailable." });
      return;
    }

    if (!consumedCode) {
      res.status(400).json({ ok: false, error: "Invalid or expired code." });
      return;
    }

    let user;
    let profile;
    const sessionToken = createSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiresAt(sessionConfig);
    try {
      user = await getOrCreateUser(storage, email);
      await callStorage(storage, "createSession", user.id, sessionTokenHash, expiresAt);
      profile = await callStorage(storage, "getProfile", user.id);
    } catch (error) {
      logAuthFailure("session creation", error);
      res.status(503).json({ ok: false, error: "Authentication storage unavailable." });
      return;
    }

    setSessionCookie(res, sessionToken, expiresAt, sessionConfig);
    res.json({
      ok: true,
      user: sanitizeUserForResponse(user),
      profile: sanitizeProfileForResponse(profile),
    });
  });

  router.get("/api/auth/google/start", (req, res) => {
    let googleConfig;
    try {
      googleConfig = getGoogleOAuthConfig(env);
    } catch (error) {
      logAuthFailure("Google OAuth configuration", error);
      res.status(503).json({ ok: false, error: "Google sign-in is not configured." });
      return;
    }

    const state = createOAuthState();
    setOAuthStateCookie(res, state, sessionConfig);
    const client = createGoogleOAuthClient(googleConfig);
    const url = client.generateAuthUrl({
      prompt: "select_account",
      scope: ["openid", "email"],
      state,
    });
    res.redirect(url);
  });

  router.get("/api/auth/google/callback", async (req, res) => {
    let frontendRedirectUrl;
    try {
      frontendRedirectUrl = getFrontendRedirectUrl(env);
    } catch (error) {
      logAuthFailure("frontend redirect configuration", error);
      res.status(503).json({ ok: false, error: "Google sign-in is not configured." });
      return;
    }

    const expectedState = readCookie(req, GOOGLE_OAUTH_STATE_COOKIE);
    clearOAuthStateCookie(res, sessionConfig);
    if (req.query?.error) {
      res.redirect(withQuery(frontendRedirectUrl, "auth_error", "google_signin_cancelled"));
      return;
    }

    const state = normalizeOAuthParam(req.query?.state);
    const code = normalizeOAuthParam(req.query?.code);
    if (!state || !code || state !== expectedState) {
      res.redirect(withQuery(frontendRedirectUrl, "auth_error", "google_signin_failed"));
      return;
    }

    let googleConfig;
    try {
      googleConfig = getGoogleOAuthConfig(env);
    } catch (error) {
      logAuthFailure("Google OAuth configuration", error);
      res.redirect(withQuery(frontendRedirectUrl, "auth_error", "google_signin_unavailable"));
      return;
    }

    let user;
    try {
      const client = createGoogleOAuthClient(googleConfig);
      const { tokens } = await client.getToken(code);
      const idToken = tokens.id_token;
      if (!idToken) {
        throw new Error("Google did not return an identity token");
      }
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleConfig.clientId,
      });
      const payload = ticket.getPayload();
      const email = normalizeEmail(payload?.email);
      const providerUserId = normalizeOAuthParam(payload?.sub);
      if (!providerUserId || !isValidEmail(email) || payload?.email_verified !== true) {
        throw new Error("Google identity token did not include a verified email");
      }
      user = await callStorage(storage, "findOrCreateOAuthUser", {
        provider: "google",
        providerUserId,
        email,
        emailVerifiedAt: new Date(),
      });
    } catch (error) {
      logAuthFailure("Google OAuth callback", error);
      res.redirect(withQuery(frontendRedirectUrl, "auth_error", "google_signin_failed"));
      return;
    }

    const sessionToken = createSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiresAt(sessionConfig);
    try {
      await callStorage(storage, "createSession", user.id, sessionTokenHash, expiresAt);
    } catch (error) {
      logAuthFailure("Google OAuth session creation", error);
      res.redirect(withQuery(frontendRedirectUrl, "auth_error", "google_signin_unavailable"));
      return;
    }

    setSessionCookie(res, sessionToken, expiresAt, sessionConfig);
    res.redirect(frontendRedirectUrl);
  });

  router.post("/api/logout", async (req, res) => {
    const sessionToken = readSessionToken(req, sessionConfig);
    clearSessionCookie(res, sessionConfig);
    if (!sessionToken) {
      res.json({ ok: true });
      return;
    }

    try {
      await callStorage(storage, "deleteSession", hashSessionToken(sessionToken));
    } catch (error) {
      logAuthFailure("logout", error);
      res.status(503).json({ ok: false, error: "Authentication storage unavailable." });
      return;
    }

    res.json({ ok: true });
  });

  return router;
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(email) {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

function normalizeLoginCode(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOAuthParam(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateLoginCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function getLoginCodeSecret(env) {
  const secret = env.AUTH_HASH_SECRET || env.SESSION_SECRET || env.AUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (env.NODE_ENV === "production") {
    throw new AuthConfigurationError("Missing login code hash secret");
  }

  return "zelthir-dev-login-code-secret";
}

function isEmailCodeAuthEnabled(env) {
  return env.NODE_ENV !== "production" || isExplicitlyEnabled(env.EMAIL_CODE_AUTH_ENABLED);
}

function isExplicitlyEnabled(value) {
  return typeof value === "string" && ["1", "true", "yes"].includes(value.trim().toLowerCase());
}

function isGoogleOAuthConfigured(env) {
  return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}

function hashLoginCode(email, code, env) {
  return createHmac("sha256", getLoginCodeSecret(env))
    .update(`zelthir-login-code:v1:${email}:${code}`)
    .digest("hex");
}

function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

function createGoogleOAuthClient(config) {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

function getGoogleOAuthConfig(env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new AuthConfigurationError("Missing Google OAuth credentials");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getGoogleOAuthRedirectUri(env),
  };
}

function getGoogleOAuthRedirectUri(env) {
  const override = env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (override) {
    validateProductionUrl(override, env, "Google OAuth redirect URI");
    return override;
  }

  const baseUrl = trimTrailingSlash(
    env.API_BASE_URL?.trim()
      || env.BACKEND_PUBLIC_URL?.trim()
      || "http://127.0.0.1:3210",
  );
  validateProductionUrl(baseUrl, env, "Backend public URL");
  return `${baseUrl}/api/auth/google/callback`;
}

function getFrontendRedirectUrl(env) {
  const url = env.FRONTEND_ORIGIN?.trim() || "http://127.0.0.1:5173";
  validateProductionUrl(url, env, "Frontend origin");
  return url;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function validateProductionUrl(value, env, label) {
  if (env.NODE_ENV !== "production") {
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new AuthConfigurationError(`${label} must be a valid URL`);
  }

  if (parsed.protocol !== "https:") {
    throw new AuthConfigurationError(`${label} must use https in production`);
  }
}

function setOAuthStateCookie(res, state, config) {
  res.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
    expires: new Date(Date.now() + GOOGLE_OAUTH_STATE_TTL_MS),
    httpOnly: true,
    path: "/api/auth/google",
    sameSite: "lax",
    secure: config.secure,
  });
}

function clearOAuthStateCookie(res, config) {
  res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, {
    httpOnly: true,
    path: "/api/auth/google",
    sameSite: "lax",
    secure: config.secure,
  });
}

function withQuery(url, key, value) {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.toString();
}

async function getOrCreateUser(storage, email) {
  const created = await callStorage(storage, "createUserByEmail", email);
  const user = created || await callStorage(storage, "findUserByEmail", email);
  if (!user?.id || !user?.email) {
    throw new Error("Storage did not return a user");
  }

  return user;
}

async function callStorage(storage, name, ...args) {
  const fn = storage?.[name];
  if (typeof fn !== "function") {
    throw new Error(`Storage function ${name} is not available`);
  }

  return fn(...args);
}

function sanitizeUserForResponse(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user.id),
    email: normalizeEmail(user.email),
  };
}

function sanitizeProfileForResponse(profile) {
  if (!profile) {
    return null;
  }

  return {
    displayName: normalizeOptionalText(profile.displayName),
    persona: normalizeProfileId(profile.persona) || "general_reader",
    interests: sanitizeInterestList(profile.interests),
    locations: sanitizeLocationList(profile.locations),
    onboardingCompletedAt: normalizeTimestamp(profile.onboardingCompletedAt),
  };
}

function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

function normalizeProfileId(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return /^[a-z][a-z0-9_:-]{0,63}$/.test(normalized) ? normalized : "";
}

function sanitizeInterestList(value) {
  return Array.isArray(value)
    ? value.map(normalizeProfileId).filter(Boolean)
    : [];
}

function sanitizeLocationList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((location) => ({
    label: normalizeOptionalText(location.label),
    type: normalizeProfileId(location.type) || "city",
    city: normalizeOptionalText(location.city),
    state: normalizeOptionalText(location.state)?.toUpperCase() || null,
    country: normalizeOptionalText(location.country)?.toUpperCase() || "US",
  }));
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function logDevAuthCode(email, code, expiresAt, env) {
  if (env.NODE_ENV === "production") {
    return;
  }

  console.info(`[dev-auth] ${email} sign-in code ${code} expires ${expiresAt.toISOString()}`);
}

function logAuthFailure(context, error) {
  const contractSuffix = error instanceof AuthConfigurationError
    ? ": configuration missing"
    : "";
  console.error(`[auth] ${context} failed${contractSuffix}`);
}
