const fs = require("fs");
const path = require("path");
const { OUTPUTS_DIR } = require("../services/storageService");
const { makeId } = require("../services/idService");
const { buildArgs, runFfmpeg } = require("../services/ffmpegService");
const { getDb } = require("../db");
const { findVideoByIdOwner } = require("../models/videoModel");
const { createJob, updateStatus, findJobByIdOwner, findDoneOutput } = require("../models/transcodeModel");

async function requestTranscode(req, res) {
  const { videoId, format } = req.body || {};
  if (!videoId || !format) return res.status(400).json({ error: "videoId and format required" });

  const v = await findVideoByIdOwner(videoId, req.user.sub);
  if (!v) return res.status(404).json({ error: "Video not found" });

  const jobId = makeId("job_");
  const outPath = path.join(OUTPUTS_DIR, `${videoId}.${format.toLowerCase()}`);
  await createJob({ id: jobId, videoId, owner: req.user.sub, format: format.toLowerCase(), outPath });

  // start async worker
  process.nextTick(async () => {
    try {
      await updateStatus(jobId, "processing");
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      const args = buildArgs(v.original_path, outPath, format);
      await runFfmpeg(args);
      await updateStatus(jobId, "done");
    } catch (e) {
      await updateStatus(jobId, "error", String(e?.message || e));
    }
  });

  res.status(202).json({ jobId, status: "queued" });
}

async function getJob(req, res) {
  const j = await findJobByIdOwner(req.params.id, req.user.sub);
  if (!j) return res.status(404).json({ error: "Job not found" });
  res.json(j);
}

async function downloadOutput(req, res) {
  const videoId = req.params.id;
  const format = String(req.query.format || "").toLowerCase();
  if (!format) return res.status(400).json({ error: "format query param required" });

  const t = await findDoneOutput({ videoId, owner: req.user.sub, format });
  if (!t || !fs.existsSync(t.output_path)) return res.status(404).json({ error: "Output not ready" });
  return res.download(t.output_path, `${videoId}.${format}`);
}

module.exports = { requestTranscode, getJob, downloadOutput };
