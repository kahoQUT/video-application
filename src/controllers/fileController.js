const path = require("path");
const { makeId } = require("../services/idService");
const { uploadOriginal, presign, keyOriginal } = require("../services/storageService");
const { createVideo, listVideosByOwner /*, listVideosAll if you add it */ } = require("../models/videoModel");
const { listJobsByOwner /*, listJobsAll */ } = require("../models/transcodeModel");

async function upload(req, res) {
  if (!req.user?.sub) return res.status(401).json({ error: "Not authenticated" });
  if (!req.files || !req.files.file) return res.status(400).json({ error: "No file uploaded" });

  const f = req.files.file;
  const owner = req.user.sub;
  const videoId = makeId("vid_");
  const originalName = f.name;
  const tmpPath = path.join("/tmp", `${videoId}-${originalName}`);

  await f.mv(tmpPath);

  // S3 put
  const { bucket, key } = await uploadOriginal({
    owner, videoId, localPath: tmpPath, originalName
  });

  await createVideo({
    id: videoId,
    owner,
    name: originalName,
    s3Bucket: bucket,
    s3Key: key,
    sizeBytes: f.size || null
  });

  try { require("fs").unlinkSync(tmpPath); } catch {}

  res.status(201).json({ id: videoId, name: originalName });
}

async function listFiles(req, res) {
  const owner = req.user?.id ?? req.user?.sub;
  // Admin default “show all”? → iterate known users or add listAll; for now show per-owner
  const vids = await listVideosByOwner(owner);
  const jobs = await listJobsByOwner(owner);

  res.set("Cache-Control", "no-store");
  res.json({ originals: vids.items ?? vids, outputs: jobs.items ?? jobs, scope: req.user.role === "admin" ? "mine" : "mine" });
}

// Original download: return a presigned URL (fastest)
async function download(req, res, next) {
  const type = String(req.query.type || "original").toLowerCase();
  if (type !== "original") return next();

  const owner = req.user?.id ?? req.user?.sub;
  const videoId = req.params.id;

  // We need originalName to build the key → simplest: fetch metadata first
  const { findVideoByIdOwner } = require("../models/videoModel");
  const v = await findVideoByIdOwner(videoId, owner);
  if (!v) return res.status(404).json({ error: "Video not found" });

  const url = await presign({ key: keyOriginal(owner, videoId, v.originalName) });
  res.json({ url });
}

module.exports = { upload, listFiles, download };
