import { createHash, randomBytes } from "node:crypto";

const DEFAULT_SESSION_COOKIE_NAME = "zelthir_session";
const DEFAULT_SESSION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getSessionConfig(env = process.env) {
  const parsedDays = Number(env.SESSION_DAYS || DEFAULT_SESSION_DAYS);
  const sessionDays = Number.isFinite(parsedDays) && parsedDays > 0
    ? parsedDays
    : DEFAULT_SESSION_DAYS;
  const sameSite = getSameSiteMode(env);

  return {
    cookieName: env.SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME,
    sessionDays,
    sameSite,
    secure: env.NODE_ENV === "production",
  };
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function getSessionExpiresAt(config = getSessionConfig()) {
  return new Date(Date.now() + config.sessionDays * MS_PER_DAY);
}

export function hashSessionToken(token) {
  return createHash("sha256")
    .update(`zelthir-session:v1:${token}`)
    .digest("hex");
}

export function readCookie(req, name) {
  const header = req.headers?.cookie;
  if (!header || typeof header !== "string") {
    return "";
  }

  for (const segment of header.split(";")) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");
    if (rawName !== name) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return "";
}

export function readSessionToken(req, config = getSessionConfig()) {
  return readCookie(req, config.cookieName);
}

export function setSessionCookie(res, token, expiresAt, config = getSessionConfig()) {
  res.cookie(config.cookieName, token, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: config.sameSite,
    secure: config.secure,
  });
}

export function clearSessionCookie(res, config = getSessionConfig()) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    path: "/",
    sameSite: config.sameSite,
    secure: config.secure,
  });
}

function getSameSiteMode(env) {
  const configured = env.SESSION_COOKIE_SAME_SITE?.trim().toLowerCase();
  if (["lax", "strict", "none"].includes(configured)) {
    return configured;
  }

  if (env.NODE_ENV === "production" && isCrossOriginApp(env)) {
    return "none";
  }

  return "lax";
}

function isCrossOriginApp(env) {
  const frontendOrigin = normalizeOrigin(env.FRONTEND_ORIGIN);
  const backendOrigin = normalizeOrigin(env.API_BASE_URL || env.BACKEND_PUBLIC_URL);
  return Boolean(frontendOrigin && backendOrigin && frontendOrigin !== backendOrigin);
}

function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
}
