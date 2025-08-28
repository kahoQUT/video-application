const fs = require("fs");
const path = require("path");
const { ORIGINALS_DIR } = require("../services/storageService");
const { makeId } = require("../services/idService");
const { listVideosByOwner, createVideo, findVideoByIdOwner } = require("../models/videoModel");
const { listJobsByOwner } = require("../models/transcodeModel");

async function upload(req, res) {
  if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });
  const f = req.files.file;
  const ext = path.extname(f.name) || "";
  const vid = makeId("vid_");
  const dest = path.join(ORIGINALS_DIR, `${vid}${ext}`);
  await f.mv(dest);
  await createVideo({ id: vid, owner: req.user.sub, name: f.name, path: dest, size: f.size });
  res.status(201).json({ id: vid, name: f.name, size: f.size || null });
}

async function listFiles(req, res) {
  const originals = await listVideosByOwner(req.user.sub);
  const outputs = await listJobsByOwner(req.user.sub);
  res.json({ originals, outputs });
}

async function download(req, res) {
  const type = String(req.query.type || "original");
  const id = req.params.id;

  if (type === "original") {
    const v = await findVideoByIdOwner(id, req.user.sub);
    if (!v || !fs.existsSync(v.original_path)) return res.status(404).json({ error: "File not found" });
    return res.download(v.original_path, v.original_name);
  }
  // output download handled in transcodeController (needs format)
  return res.status(400).json({ error: "Unknown type" });
}

module.exports = { upload, listFiles, download };
