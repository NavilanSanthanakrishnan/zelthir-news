import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { pool } from "./pool.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultMigrationsDir = path.resolve(__dirname, "../../migrations");

export async function listMigrationFiles(migrationsDir = defaultMigrationsDir) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

export async function runMigrations({ migrationsDir = defaultMigrationsDir } = {}) {
  const files = await listMigrationFiles(migrationsDir);
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, "utf8");
    if (!sql.trim()) {
      continue;
    }
    await pool.query("begin");
    try {
      await pool.query(sql);
      await pool.query("commit");
      console.log(`Applied migration ${file}`);
    } catch (error) {
      await pool.query("rollback").catch(() => {});
      throw new Error(`Migration ${file} failed: ${error.message}`);
    }
  }
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const files = await runMigrations();
    console.log(`Migration complete. ${files.length} file(s) checked.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Migration failed.");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
