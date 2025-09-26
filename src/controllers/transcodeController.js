const fs = require("fs");
const path = require("path");
const { makeId } = require("../services/idService");
const { buildArgs, runFfmpeg } = require("../services/ffmpegService");
const { findVideoByIdOwner } = require("../models/videoModel");
const { createJob, updateStatus, findJobByIdOwner, findDoneOutput } = require("../models/transcodeModel");
const { downloadOriginalToTmp, uploadOutput, presign, keyOutput } = require("../services/storageService");

function ownerOf(req) { return req.user?.sub; }

async function requestTranscode(req, res) {
  const { videoId, format } = req.body || {};
  if (!videoId || !format) return res.status(400).json({ error: "videoId and format required" });

  const owner = ownerOf(req);
  const tFmt = String(format).toLowerCase();

  const meta = await findVideoByIdOwner(videoId, owner);
  if (!meta) return res.status(404).json({ error: "Video not found" });

  const jobId = makeId("job_");
  await createJob({ id: jobId, videoId, owner, format: tFmt });

  process.nextTick(async () => {
    const tmpIn = await downloadOriginalToTmp({ owner, videoId, originalName: meta.originalName });
    const tmpOut = path.join(process.env.TMPDIR || "/tmp", `${videoId}.${tFmt}`);
    try {
      await updateStatus(jobId, videoId, { status: "processing" });
      const args = buildArgs(tmpIn, tmpOut, tFmt);
      await runFfmpeg(args);

      const { bucket, key } = await uploadOutput({ owner, videoId, format: tFmt, localPath: tmpOut });
      await updateStatus(jobId, videoId, { status: "done", outBucket: bucket, outKey: key });
    } catch (e) {
      await updateStatus(jobId, videoId, { status: "error", errorMsg: String(e?.message || e) });
    } finally {
      try { fs.unlinkSync(tmpIn); } catch {}
      try { fs.unlinkSync(tmpOut); } catch {}
    }
  });

  res.status(202).json({ jobId, status: "queued" });
}

async function getJob(req, res) {
  const owner = ownerOf(req);
  const j = await findJobByIdOwner(req.params.id, owner);
  if (!j) return res.status(404).json({ error: "Job not found" });
  res.json(j);
}

async function downloadOutputCtrl(req, res) {
  const owner = ownerOf(req);
  const videoId = req.params.id;
  const format = String(req.query.format || "").toLowerCase();
  if (!format) return res.status(400).json({ error: "format query param required" });

  const t = await findDoneOutput({ videoId, owner, format });
  if (!t) return res.status(404).json({ error: "Output not ready" });

  const url = await presign({ key: keyOutput(owner, videoId, format) });
  res.json({ url });
}

module.exports = { requestTranscode, getJob, downloadOutput: downloadOutputCtrl };
