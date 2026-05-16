import crypto from "node:crypto";

import { pool } from "../db/pool.mjs";

const HASH_PREFIX = "sha256:";
const DEFAULT_PERSONA = "general_reader";
const DEFAULT_SESSION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const US_STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "Washington, DC",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function createToken(prefix) {
  return `${prefix}_${crypto.randomBytes(32).toString("base64url")}`;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hashSecret(value) {
  return `${HASH_PREFIX}${sha256Hex(value)}`;
}

function secretHashCandidates(value) {
  const normalized = String(value || "").trim();
  const normalizedLower = normalized.toLowerCase();
  const hex = sha256Hex(normalized);
  const candidates = [`${HASH_PREFIX}${hex}`, hex];
  if (/^sha256:[a-f0-9]{64}$/i.test(normalized)) {
    candidates.push(`${HASH_PREFIX}${normalizedLower.slice(HASH_PREFIX.length)}`);
  }
  if (/^[a-f0-9]{64}$/i.test(normalized)) {
    candidates.push(normalizedLower, `${HASH_PREFIX}${normalizedLower}`);
  }
  return [...new Set(candidates)];
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function storedHashMatches(storedHash, rawValue) {
  const stored = String(storedHash || "").toLowerCase();
  return secretHashCandidates(rawValue).some((candidate) => safeEqual(stored, candidate));
}

function normalizeStoredHash(value, normalizer = String) {
  const normalized = normalizer(value);
  if (/^sha256:[a-f0-9]{64}$/i.test(normalized)) {
    return `${HASH_PREFIX}${normalized.slice(HASH_PREFIX.length).toLowerCase()}`;
  }
  if (/^[a-f0-9]{64}$/i.test(normalized)) {
    return normalized.toLowerCase();
  }
  return hashSecret(normalized);
}

function normalizeEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    throw new Error("Email is required.");
  }
  return normalized;
}

function normalizeCode(code) {
  const normalized = String(code || "").trim();
  if (!normalized) {
    throw new Error("Login code is required.");
  }
  return normalized;
}

function normalizeToken(token) {
  const normalized = String(token || "").trim();
  if (!normalized) {
    throw new Error("Session token is required.");
  }
  return normalized;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value || null;
}

function cleanOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeWeight(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    emailVerifiedAt: toIso(row.email_verified_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapLoginCode(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    expiresAt: toIso(row.expires_at),
    consumedAt: toIso(row.consumed_at),
    createdAt: toIso(row.created_at),
  };
}

function mapSession(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at),
    lastSeenAt: toIso(row.last_seen_at),
  };
}

function mapSessionWithUser(row) {
  if (!row) {
    return null;
  }
  return {
    ...mapSession(row),
    user: mapUser({
      id: row.user_id,
      email: row.user_email,
      email_verified_at: row.user_email_verified_at,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
    }),
  };
}

function mapProfile(row, interests, locations) {
  return {
    userId: row.user_id,
    displayName: row.display_name || null,
    persona: row.persona || DEFAULT_PERSONA,
    onboardingCompletedAt: toIso(row.onboarding_completed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    interests: interests.map((interest) => interest.interest_id),
    locations: locations.map((location) => ({
      id: location.id,
      type: location.type,
      city: location.city || null,
      state: location.state || null,
      country: location.country,
      label: location.label,
      weight: location.weight,
      createdAt: toIso(location.created_at),
    })),
  };
}

function defaultProfileRow(userId) {
  return {
    user_id: userId,
    display_name: null,
    persona: DEFAULT_PERSONA,
    onboarding_completed_at: null,
    created_at: null,
    updated_at: null,
  };
}

function normalizeInterest(value) {
  const source = typeof value === "object" && value !== null ? value : { interestId: value };
  const rawId = source.interestId ?? source.id ?? source.value;
  const interestId = String(rawId || "").trim().toLowerCase();
  if (!interestId) {
    return null;
  }
  return {
    interestId,
    weight: normalizeWeight(source.weight),
  };
}

function normalizeInterests(values) {
  const seen = new Set();
  return values
    .map(normalizeInterest)
    .filter(Boolean)
    .filter((interest) => {
      if (seen.has(interest.interestId)) {
        return false;
      }
      seen.add(interest.interestId);
      return true;
    });
}

function normalizeState(value) {
  const state = cleanOptionalText(value);
  if (!state) {
    return null;
  }
  return state.length <= 3 ? state.toUpperCase() : state;
}

function normalizeCountry(value) {
  const country = cleanOptionalText(value);
  return country ? country.toUpperCase() : "US";
}

function buildLocationLabel(location) {
  if (location.type === "state" && location.country === "US" && location.state) {
    return US_STATE_NAMES[location.state.toUpperCase()] || location.state;
  }
  if (location.type === "city" && location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  if (location.city) {
    return location.city;
  }
  if (location.state) {
    return location.country === "US"
      ? US_STATE_NAMES[location.state.toUpperCase()] || location.state
      : location.state;
  }
  return location.country || null;
}

function normalizeLocation(value) {
  const source = typeof value === "object" && value !== null ? value : { label: value };
  const type = String(source.type || "custom").trim().toLowerCase() || "custom";
  const city = cleanOptionalText(source.city);
  const state = normalizeState(source.state);
  const country = normalizeCountry(source.country);
  const partial = { type, city, state, country };
  const label = cleanOptionalText(source.label) || buildLocationLabel(partial);
  if (!label) {
    return null;
  }
  return {
    id: createId("loc"),
    type,
    city,
    state,
    country,
    label,
    weight: normalizeWeight(source.weight),
  };
}

function normalizeLocations(values) {
  const seen = new Set();
  return values
    .map(normalizeLocation)
    .filter(Boolean)
    .filter((location) => {
      const key = [
        location.type,
        location.city || "",
        location.state || "",
        location.country || "",
        location.label,
      ].join("|");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

async function loadProfile(client, userId) {
  const profileResult = await client.query("select * from profiles where user_id = $1", [userId]);
  const interestsResult = await client.query(
    "select * from profile_interests where user_id = $1 order by created_at, interest_id",
    [userId],
  );
  const locationsResult = await client.query(
    "select * from profile_locations where user_id = $1 order by created_at, label",
    [userId],
  );
  return mapProfile(
    profileResult.rows[0] || defaultProfileRow(userId),
    interestsResult.rows,
    locationsResult.rows,
  );
}

export function hashLoginCode(code) {
  return hashSecret(normalizeCode(code));
}

export function hashSessionToken(token) {
  return hashSecret(normalizeToken(token));
}

export async function createUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const result = await pool.query(
    `insert into users (id, email, email_verified_at)
     values ($1, $2, now())
     on conflict (email) do update
     set email_verified_at = coalesce(users.email_verified_at, excluded.email_verified_at),
         updated_at = now()
     returning *`,
    [createId("usr"), normalizedEmail],
  );
  return mapUser(result.rows[0]);
}

export async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const result = await pool.query("select * from users where email = $1", [normalizedEmail]);
  return mapUser(result.rows[0]);
}

export async function findOrCreateOAuthUser({ provider, providerUserId, email, emailVerifiedAt }) {
  const normalizedProvider = cleanOptionalText(provider)?.toLowerCase();
  const normalizedProviderUserId = cleanOptionalText(providerUserId);
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedProvider || !normalizedProviderUserId) {
    throw new Error("OAuth provider and provider user id are required.");
  }
  const verifiedAt = emailVerifiedAt || new Date();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const accountResult = await client.query(
      `select u.*
       from oauth_accounts oa
       join users u on u.id = oa.user_id
       where oa.provider = $1
         and oa.provider_user_id = $2
       for update`,
      [normalizedProvider, normalizedProviderUserId],
    );
    if (accountResult.rows[0]) {
      await client.query(
        `update oauth_accounts
         set email = $1,
             email_verified_at = coalesce(email_verified_at, $2),
             updated_at = now()
         where provider = $3
           and provider_user_id = $4`,
        [normalizedEmail, verifiedAt, normalizedProvider, normalizedProviderUserId],
      );
      await client.query("commit");
      return mapUser(accountResult.rows[0]);
    }
    const userResult = await client.query(
      `insert into users (id, email, email_verified_at)
       values ($1, $2, $3)
       on conflict (email) do update
       set email_verified_at = coalesce(users.email_verified_at, excluded.email_verified_at),
           updated_at = now()
       returning *`,
      [createId("usr"), normalizedEmail, verifiedAt],
    );
    const user = userResult.rows[0];
    await client.query(
      `insert into oauth_accounts (id, user_id, provider, provider_user_id, email, email_verified_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (provider, provider_user_id) do update
       set email = excluded.email,
           email_verified_at = coalesce(oauth_accounts.email_verified_at, excluded.email_verified_at),
           updated_at = now()`,
      [createId("oauth"), user.id, normalizedProvider, normalizedProviderUserId, normalizedEmail, verifiedAt],
    );
    await client.query("commit");
    return mapUser(user);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function createLoginCode(email, codeHash, expiresAt) {
  const normalizedEmail = normalizeEmail(email);
  const storedHash = normalizeStoredHash(codeHash, normalizeCode);
  const result = await pool.query(
    `insert into login_codes (id, email, code_hash, expires_at)
     values ($1, $2, $3, $4)
     returning *`,
    [createId("lc"), normalizedEmail, storedHash, expiresAt],
  );
  return mapLoginCode(result.rows[0]);
}

export async function consumeLoginCode(email, code) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeCode(code);
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await client.query(
      `select *
       from login_codes
       where email = $1
         and consumed_at is null
         and expires_at > now()
       order by created_at desc
       for update`,
      [normalizedEmail],
    );
    const match = result.rows.find((row) => storedHashMatches(row.code_hash, normalizedCode));
    if (!match) {
      await client.query("commit");
      return null;
    }
    const consumed = await client.query(
      `update login_codes
       set consumed_at = now()
       where id = $1
         and consumed_at is null
       returning *`,
      [match.id],
    );
    await client.query("commit");
    return mapLoginCode(consumed.rows[0]);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function createSession(userId, sessionTokenHash, expiresAtValue) {
  const sessionDays = toPositiveInteger(process.env.SESSION_DAYS, DEFAULT_SESSION_DAYS);
  const token = createToken("sess");
  const expiresAt = expiresAtValue || new Date(Date.now() + sessionDays * MS_PER_DAY);
  const storedHash = sessionTokenHash
    ? normalizeStoredHash(sessionTokenHash, normalizeToken)
    : hashSessionToken(token);
  const result = await pool.query(
    `insert into sessions (id, user_id, session_token_hash, expires_at)
     values ($1, $2, $3, $4)
     returning *`,
    [createId("ses"), userId, storedHash, expiresAt],
  );
  return {
    ...mapSession(result.rows[0]),
    token: sessionTokenHash ? null : token,
  };
}

export async function findSession(token) {
  const normalizedToken = normalizeToken(token);
  const result = await pool.query(
    `update sessions as s
     set last_seen_at = now()
     from users as u
     where s.user_id = u.id
       and s.session_token_hash = any($1::text[])
       and s.expires_at > now()
     returning s.id,
       s.user_id,
       s.expires_at,
       s.created_at,
       s.last_seen_at,
       u.email as user_email,
       u.email_verified_at as user_email_verified_at,
       u.created_at as user_created_at,
       u.updated_at as user_updated_at`,
    [secretHashCandidates(normalizedToken)],
  );
  return mapSessionWithUser(result.rows[0]);
}

export async function deleteSession(token) {
  const normalizedToken = normalizeToken(token);
  const result = await pool.query(
    "delete from sessions where session_token_hash = any($1::text[]) returning id",
    [secretHashCandidates(normalizedToken)],
  );
  return result.rowCount > 0;
}

export async function getProfile(userId) {
  return loadProfile(pool, userId);
}

export async function updateProfile(userId, payload = {}) {
  const changes = payload && typeof payload === "object" ? payload : {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    const existingResult = await client.query("select * from profiles where user_id = $1 for update", [userId]);
    const existing = existingResult.rows[0] || defaultProfileRow(userId);
    const displayName = Object.hasOwn(changes, "displayName")
      ? cleanOptionalText(changes.displayName)
      : existing.display_name;
    const persona = cleanOptionalText(changes.persona) || existing.persona || DEFAULT_PERSONA;
    const shouldMarkOnboardingComplete = ["displayName", "persona", "interests", "locations"].some((key) =>
      Object.hasOwn(changes, key),
    );
    const onboardingCompletedAt = Object.hasOwn(changes, "onboardingCompletedAt")
      ? changes.onboardingCompletedAt
      : existing.onboarding_completed_at || (shouldMarkOnboardingComplete ? new Date() : null);
    await client.query(
      `insert into profiles (user_id, display_name, persona, onboarding_completed_at)
       values ($1, $2, $3, $4)
       on conflict (user_id) do update
       set display_name = excluded.display_name,
           persona = excluded.persona,
           onboarding_completed_at = excluded.onboarding_completed_at,
           updated_at = now()`,
      [userId, displayName, persona, onboardingCompletedAt],
    );
    if (Array.isArray(changes.interests)) {
      const interests = normalizeInterests(changes.interests);
      await client.query("delete from profile_interests where user_id = $1", [userId]);
      for (const interest of interests) {
        await client.query(
          `insert into profile_interests (user_id, interest_id, weight)
           values ($1, $2, $3)`,
          [userId, interest.interestId, interest.weight],
        );
      }
    }
    if (Array.isArray(changes.locations)) {
      const locations = normalizeLocations(changes.locations);
      await client.query("delete from profile_locations where user_id = $1", [userId]);
      for (const location of locations) {
        await client.query(
          `insert into profile_locations (id, user_id, type, city, state, country, label, weight)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            location.id,
            userId,
            location.type,
            location.city,
            location.state,
            location.country,
            location.label,
            location.weight,
          ],
        );
      }
    }
    const profile = await loadProfile(client, userId);
    await client.query("commit");
    return profile;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
