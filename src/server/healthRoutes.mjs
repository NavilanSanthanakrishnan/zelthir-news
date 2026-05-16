import express from "express";
import pg from "pg";

const router = express.Router();
let pool = null;

function getDatabasePool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new pg.Pool({ connectionString });
  }

  return pool;
}

async function getDatabaseStatus() {
  const databasePool = getDatabasePool();
  if (!databasePool) {
    return "missing_database_url";
  }

  try {
    await databasePool.query("select 1");
    return "ok";
  } catch {
    return "error";
  }
}

router.get("/api/health", async (_req, res) => {
  const database = await getDatabaseStatus();
  const body = {
    ok: database === "ok",
    services: {
      backend: "ok",
      database,
      gemini: process.env.GEMINI_API_KEY?.trim() ? "configured" : "missing_key",
    },
  };

  res.status(body.ok ? 200 : 503).json(body);
});

export default router;
