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

async function findVideoByIdOwner(id, owner) {
  const db = getDb();
  return db.get(`SELECT * FROM videos WHERE id=? AND owner=?`, [id, owner]);
}

async function listVideosByOwner(owner) {
  const db = getDb();
  return db.all(
    `SELECT id, original_name AS name, size_bytes, created_at
     FROM videos WHERE owner=? ORDER BY created_at DESC`,
    [owner]
  );
}

module.exports = { createVideo, findVideoByIdOwner, listVideosByOwner };
