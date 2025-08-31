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
  await createVideo({ id: vid, owner: req.user.id, name: f.name, path: dest, size: f.size });
  res.status(201).json({ id: vid, name: f.name, size: f.size || null });
}

async function listFiles(req, res) {
	const owner = req.user?.id ?? req.user?.sub; // <= accept both, prefer .id
  	if (!owner) return res.status(401).json({ error: "No user id in token" });

  const originals = await listVideosByOwner(owner);
  const outputs = await listJobsByOwner(owner);

console.log(`[files] owner=${Number(owner)} originals=${originals.length} outputs=${outputs.length}`);
res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json({ originals, outputs });
}

async function download(req, res) {
  const type = String(req.query.type || "original");
  if (type !== "original") return next();
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
