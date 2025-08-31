const { getDb } = require("../db");

async function createVideo({ id, owner, name, path, size }) {
  const db = getDb();
  await db.run(
    `INSERT INTO videos (id, owner, original_name, original_path, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [id, owner, name, path, size || null]
  );
  return id;
}

/** List by owner (cast owner to integer to avoid binding quirks) */
async function listVideosByOwner(owner) {
  const db = getDb();
  const o = Number(owner);
  const rows = await db.all(
    `SELECT id, original_name AS name, size_bytes, created_at
     FROM videos
     WHERE owner = ?
     ORDER BY datetime(created_at) DESC`,
    [o]
  );
  console.log(`[model:videos] owner=${o} -> ${rows.length} rows`);
  return rows;
}

async function findVideoByIdOwner(id, owner) {
  const db = getDb();
  return db.get(`SELECT * FROM videos WHERE id=? AND owner=?`, [id, owner]);
}

module.exports = { createVideo, findVideoByIdOwner, listVideosByOwner };
