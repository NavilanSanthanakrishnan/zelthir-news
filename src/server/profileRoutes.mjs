import express from "express";

import * as defaultStorage from "../storage/index.mjs";
import {
  clearSessionCookie,
  getSessionConfig,
  hashSessionToken,
  readSessionToken,
} from "./sessionCookies.mjs";

const PROFILE_TEXT_LIMIT = 80;
const MAX_INTERESTS = 30;
const MAX_LOCATIONS = 12;
const PROFILE_ID_PATTERN = /^[a-z][a-z0-9_:-]{0,63}$/;
const LOCATION_TYPES = new Set(["city", "state"]);

export function createProfileRouter({ storage = defaultStorage, env = process.env } = {}) {
  const router = express.Router();
  const sessionConfig = getSessionConfig(env);

  router.get("/api/me", async (req, res) => {
    let auth;
    try {
      auth = await readAuthenticatedSession(req, storage, sessionConfig);
    } catch (error) {
      logProfileFailure("session lookup", error);
      res.status(503).json({ ok: false, error: "Profile storage unavailable." });
      return;
    }

    if (auth.status !== "authenticated") {
      if (auth.status === "invalid") {
        clearSessionCookie(res, sessionConfig);
      }

      res.json({ ok: true, user: null, profile: null });
      return;
    }

    let profile;
    try {
      profile = unwrapProfile(auth.sessionRecord?.profile) ||
        await callStorage(storage, "getProfile", auth.user.id);
    } catch (error) {
      logProfileFailure("profile lookup", error);
      res.status(503).json({ ok: false, error: "Profile storage unavailable." });
      return;
    }

    res.json({
      ok: true,
      user: sanitizeUserForResponse(auth.user),
      profile: sanitizeProfileForResponse(profile),
    });
  });

  router.patch("/api/me/profile", async (req, res) => {
    let auth;
    try {
      auth = await readAuthenticatedSession(req, storage, sessionConfig);
    } catch (error) {
      logProfileFailure("session lookup", error);
      res.status(503).json({ ok: false, error: "Profile storage unavailable." });
      return;
    }

    if (auth.status !== "authenticated") {
      if (auth.status === "invalid") {
        clearSessionCookie(res, sessionConfig);
      }

      res.status(401).json({ ok: false, error: "Sign in required." });
      return;
    }

    const { payload, error } = buildProfilePayload(req.body);
    if (error) {
      res.status(400).json({ ok: false, error });
      return;
    }

    let profile;
    try {
      const currentProfile = await callStorage(storage, "getProfile", auth.user.id);
      payload.onboardingCompletedAt = currentProfile?.onboardingCompletedAt ||
        new Date().toISOString();
      const updatedProfile = await callStorage(storage, "updateProfile", auth.user.id, payload);
      profile = unwrapProfile(updatedProfile) ||
        await callStorage(storage, "getProfile", auth.user.id);
    } catch (error) {
      logProfileFailure("profile update", error);
      res.status(503).json({ ok: false, error: "Profile storage unavailable." });
      return;
    }

    res.json({
      ok: true,
      profile: sanitizeProfileForResponse(profile),
    });
  });

  return router;
}

async function readAuthenticatedSession(req, storage, sessionConfig) {
  const sessionToken = readSessionToken(req, sessionConfig);
  if (!sessionToken) {
    return { status: "missing" };
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const sessionRecord = await callStorage(storage, "findSession", sessionTokenHash, new Date());
  if (!sessionRecord) {
    return { status: "invalid" };
  }

  const user = extractUserFromSession(sessionRecord);
  if (!user?.id || !user?.email) {
    throw new Error("Storage did not return a session user");
  }

  return {
    status: "authenticated",
    sessionRecord,
    user,
  };
}

async function callStorage(storage, name, ...args) {
  const fn = storage?.[name];
  if (typeof fn !== "function") {
    throw new Error(`Storage function ${name} is not available`);
  }

  return fn(...args);
}

function buildProfilePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Profile payload must be an object." };
  }

  const payload = {};
  if (Object.hasOwn(body, "displayName")) {
    const displayName = normalizeOptionalText(body.displayName);
    if (displayName === undefined) {
      return { error: "Display name must be text." };
    }

    payload.displayName = displayName;
  }

  if (Object.hasOwn(body, "persona")) {
    const persona = normalizeProfileId(body.persona);
    if (!persona) {
      return { error: "Choose a valid persona." };
    }

    payload.persona = persona;
  }

  if (Object.hasOwn(body, "interests")) {
    const interests = normalizeInterests(body.interests);
    if (!interests) {
      return { error: "Choose valid interests." };
    }

    payload.interests = interests;
  }

  if (Object.hasOwn(body, "locations")) {
    const locations = normalizeLocations(body.locations);
    if (!locations) {
      return { error: "Choose valid locations." };
    }

    payload.locations = locations;
  }

  if (!Object.keys(payload).length) {
    return { error: "Profile payload must include a change." };
  }

  return { payload };
}

function normalizeOptionalText(value) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, PROFILE_TEXT_LIMIT) : null;
}

function normalizeProfileId(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return PROFILE_ID_PATTERN.test(normalized) ? normalized : "";
}

function normalizeInterests(value) {
  if (!Array.isArray(value) || value.length > MAX_INTERESTS) {
    return null;
  }

  const interests = [];
  const seen = new Set();
  for (const item of value) {
    const interest = normalizeProfileId(item);
    if (!interest || seen.has(interest)) {
      continue;
    }

    interests.push(interest);
    seen.add(interest);
  }

  return interests;
}

function normalizeLocations(value) {
  if (!Array.isArray(value) || value.length > MAX_LOCATIONS) {
    return null;
  }

  const locations = [];
  for (const item of value) {
    const location = normalizeLocation(item);
    if (!location) {
      return null;
    }

    locations.push(location);
  }

  return locations;
}

function normalizeLocation(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const type = normalizeProfileId(item.type);
  if (!LOCATION_TYPES.has(type)) {
    return null;
  }

  const city = normalizeLocationText(item.city);
  const state = normalizeState(item.state);
  const country = normalizeCountry(item.country || "US");
  if (type === "city" && (!city || !state)) {
    return null;
  }

  if (type === "state" && !state) {
    return null;
  }

  return {
    type,
    city: type === "city" ? city : null,
    state,
    country,
  };
}

function normalizeLocationText(value) {
  return typeof value === "string" ? value.trim().slice(0, PROFILE_TEXT_LIMIT) : "";
}

function normalizeState(value) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 24) : "";
}

function normalizeCountry(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase().slice(0, 2)
    : "US";
}

function extractUserFromSession(sessionRecord) {
  const session = sessionRecord.session || sessionRecord;
  const user = sessionRecord.user || session.user || sessionRecord;

  return {
    id: user.id || session.userId || session.user_id,
    email: normalizeEmail(user.email || session.email || sessionRecord.email),
  };
}

function unwrapProfile(value) {
  return value?.profile || value || null;
}

function sanitizeUserForResponse(user) {
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
    displayName: profile.displayName ?? null,
    persona: normalizeProfileId(profile.persona) || "general_reader",
    interests: sanitizeInterestList(profile.interests),
    locations: sanitizeLocationList(profile.locations),
    onboardingCompletedAt: normalizeTimestamp(profile.onboardingCompletedAt),
  };
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
    label: normalizeLocationText(location.label),
    type: normalizeProfileId(location.type) || "city",
    city: normalizeLocationText(location.city) || null,
    state: normalizeState(location.state) || null,
    country: normalizeCountry(location.country || "US"),
  }));
}

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function logProfileFailure(context, _error) {
  console.error(`[profile] ${context} failed`);
}
