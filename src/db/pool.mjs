import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Postgres storage.");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl(databaseUrl, process.env)
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", () => {
  console.error("Unexpected idle Postgres client error.");
});

export function query(text, params) {
  return pool.query(text, params);
}

export function closePool() {
  return pool.end();
}

function shouldUseSsl(value, env) {
  if (env.PGSSL?.trim().toLowerCase() === "true") {
    return true;
  }

  try {
    const parsed = new URL(value);
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
    return ["require", "verify-ca", "verify-full", "no-verify"].includes(sslMode || "");
  } catch {
    return false;
  }
}
