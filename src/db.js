// Establishes a SQLite connection and prepares schema.
const fs = require("fs");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db;

/**
 * Initialise the database connection and schema.
 * @param {Object} [opts]
 * @param {string} [opts.filename] - Optional absolute/relative path to DB file
 * @returns {Promise<import('sqlite').Database>}
 */
async function initDb(opts = {}) {
  const ROOT = path.join(__dirname, "..");           // project root (one level up from src/)
  const DB_DIR = path.join(ROOT, "db");
  fs.mkdirSync(DB_DIR, { recursive: true });

  const filename = opts.filename || path.join(DB_DIR, "app.db");
	const dir = path.dirname(filename);
	// Optional: log the resolved path to help debug mounts/permissions
  console.log(`[db] Using SQLite file: ${filename}`);

 try {
    db = await open({ filename, driver: sqlite3.Database });
  } catch (e) {
    // Extra hint for common Docker/permission issues
    if (String(e && e.code) === "SQLITE_CANTOPEN") {
      console.error(
        "[db] SQLITE_CANTOPEN. Check that the directory exists and is writable.\n" +
        `      dir: ${dir}\n` +
        "      Try: mkdir -p ./db && chmod -R 775 ./db\n" +
        "      In Docker, ensure the mounted volume owner matches the container user."
      );
    }
    throw e;
  }
/*  db = await open({ 
	filename,
    	driver: sqlite3.Database,
  });
*/
  // Sensible pragmas for a small app
  await db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      owner INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      original_path TEXT NOT NULL,
      size_bytes INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcodes (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      owner INTEGER NOT NULL,
      target_format TEXT NOT NULL,
      output_path TEXT NOT NULL,
      status TEXT NOT NULL,         -- queued|processing|done|error
      error_msg TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner);
    CREATE INDEX IF NOT EXISTS idx_transcodes_owner ON transcodes(owner);
    CREATE INDEX IF NOT EXISTS idx_transcodes_video ON transcodes(video_id);
  `);

  return db;
}

/**
 * Get the initialised DB instance.
 * @returns {import('sqlite').Database}
 */
function getDb() {
  if (!db) throw new Error("DB not initialised. Call initDb() first.");
  return db;
}

/**
 * Close the DB (optional helper for tests/shutdown).
 */
async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}

module.exports = { initDb, getDb, closeDb };
