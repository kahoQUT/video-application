const { getDb } = require("../db");

async function createJob({ id, videoId, owner, format, outPath }) {
  const db = getDb();
  await db.run(
    `INSERT INTO transcodes (id, video_id, owner, target_format, output_path, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'queued', datetime('now'), datetime('now'))`,
    [id, videoId, owner, format, outPath]
  );
  return id;
}

async function updateStatus(id, status, errorMsg = null) {
  const db = getDb();
  await db.run(
    `UPDATE transcodes SET status=?, error_msg=?, updated_at=datetime('now') WHERE id=?`,
    [status, errorMsg, id]
  );
}

async function findJobByIdOwner(id, owner) {
  const db = getDb();
  return db.get(`SELECT * FROM transcodes WHERE id=? AND owner=?`, [id, owner]);
}

async function findDoneOutput({ videoId, owner, format }) {
  const db = getDb();
  return db.get(
    `SELECT * FROM transcodes WHERE video_id=? AND owner=? AND target_format=? AND status='done'`,
    [videoId, owner, format]
  );
}

async function listJobsByOwner(owner) {
  const db = getDb();
  const o = Number(owner);
  const rows = await db.all(
    `SELECT id, video_id, target_format, status, error_msg, created_at, updated_at
     FROM transcodes
     WHERE owner = ?
     ORDER BY datetime(created_at) DESC`,
    [o]
  );
  console.log(`[model:transcodes] owner=${o} -> ${rows.length} rows`);
  return rows;
}

module.exports = { createJob, updateStatus, findJobByIdOwner, findDoneOutput, listJobsByOwner };
