// src/controllers/transcodeController.js
const fs = require("fs");
const path = require("path");
const { OUTPUTS_DIR } = require("../services/storageService");
const { makeId } = require("../services/idService");
const { buildArgs, runFfmpeg } = require("../services/ffmpegService");
const { findVideoByIdOwner } = require("../models/videoModel");
const {
  createJob,
  updateStatus,
  findJobByIdOwner,
  findDoneOutput,
} = require("../models/transcodeModel");

function getOwner(req) {
  return req.user?.id ?? req.user?.sub ?? null;
}

async function requestTranscode(req, res) {
  const { videoId, format } = req.body || {};
  if (!videoId || !format)
    return res.status(400).json({ error: "videoId and format required" });

  const owner = getOwner(req);
  if (!owner) return res.status(401).json({ error: "No user id in token" });

  const tFmt = String(format).trim().toLowerCase();
  console.log(`[transcode] owner=${owner} videoId=${videoId} format=${tFmt}`);

  const v = await findVideoByIdOwner(videoId, owner);
  if (!v) return res.status(404).json({ error: "Video not found" });

  const jobId = makeId("job_");
  const outPath = path.join(OUTPUTS_DIR, `${videoId}.${tFmt}`);

  await createJob({ id: jobId, videoId, owner, format: tFmt, outPath });

  // run ffmpeg asynchronously
  process.nextTick(async () => {
    try {
      await updateStatus(jobId, "processing");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const args = buildArgs(v.original_path, outPath, tFmt);
      await runFfmpeg(args);
      await updateStatus(jobId, "done");
      console.log(`[transcode] job=${jobId} done`);
    } catch (e) {
      console.error(`[transcode] job=${jobId} error:`, e?.message || e);
      await updateStatus(jobId, "error", String(e?.message || e));
    }
  });

  return res.status(202).json({ jobId, status: "queued" });
}

async function getJob(req, res) {
  const owner = getOwner(req);
  if (!owner) return res.status(401).json({ error: "No user id in token" });

  const j = await findJobByIdOwner(req.params.id, owner);
  if (!j) return res.status(404).json({ error: "Job not found" });
  res.json(j);
}

async function downloadOutput(req, res) {
  const owner = getOwner(req);
  if (!owner) return res.status(401).json({ error: "No user id in token" });

  const videoId = req.params.id;
  const format = String(req.query.format || "").toLowerCase();
  if (!format) return res.status(400).json({ error: "format query param required" });

  const t = await findDoneOutput({ videoId, owner, format });
  if (!t || !fs.existsSync(t.output_path)) {
    return res.status(404).json({ error: "Output not ready" });
  }
  return res.download(t.output_path, `${videoId}.${format}`);
}

module.exports = { requestTranscode, getJob, downloadOutput };
