import "dotenv/config";

const REQUIRED_VARS = [
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const errors = [];

for (const name of REQUIRED_VARS) {
  requireEnv(name);
}

requireAny(["FRONTEND_ORIGIN", "API_BASE_URL", "BACKEND_PUBLIC_URL"]);
requireAny(["SESSION_SECRET", "AUTH_HASH_SECRET"]);
validateUrl("FRONTEND_ORIGIN", { requireHttps: true, originOnly: true });
validateUrl("API_BASE_URL", { requireHttps: true });
validateUrl("BACKEND_PUBLIC_URL", { requireHttps: true });
validateUrl("GOOGLE_OAUTH_REDIRECT_URI", { requireHttps: true });
validateDatabaseUrl();

if (errors.length) {
  console.error("Production environment check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Production environment check passed.");
}

function requireEnv(name) {
  if (!process.env[name]?.trim()) {
    errors.push(`${name} is required.`);
  }
}

function requireAny(names) {
  if (!names.some((name) => process.env[name]?.trim())) {
    errors.push(`${names.join(" or ")} is required.`);
  }
}

function validateUrl(name, { requireHttps = false, originOnly = false } = {}) {
  const value = process.env[name]?.trim();
  if (!value) {
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${name} must be a valid URL.`);
    return;
  }

  if (requireHttps && parsed.protocol !== "https:") {
    errors.push(`${name} must use https.`);
  }

  if (originOnly && parsed.origin !== value.replace(/\/+$/, "")) {
    errors.push(`${name} must be an origin without a path or query.`);
  }
}

function validateDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push("DATABASE_URL must be a valid connection URL.");
    return;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    errors.push("DATABASE_URL must use postgres or postgresql.");
  }
}
