const { v4: uuid } = require("uuid");
const path = require("path");
const videoModel = require("../models/videoModel");
const jobModel = require("../models/jobModel");
const { presignPut } = require("../utils/s3");

// Generate presigned URL for direct upload
exports.presignUpload = async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: "filename and contentType required" });
    }

    const owner = req.user?.sub || req.user?.id || "anon";

    // Generate a stable ID for DynamoDB (videoId)
    const id = uuid();

    // Clean filename and build S3 key
    const safeName = path.basename(filename).replace(/[^\w.\-]/g, "_");
    const key = `users/${owner}/originals/${id}__${safeName}`;

    // Generate presigned PUT URL for direct S3 upload
    const uploadUrl = await presignPut(key, contentType);

    // Respond with info client needs
    res.json({
      id,          // DynamoDB id for registering later
      key,         // S3 key
      uploadUrl,   // Pre-signed URL
      originalName: safeName,
      owner
    });
  } catch (err) {
    console.error("presignUpload error", err);
    res.status(500).json({ error: "presign failed" });
  }
};

// After client uploads to S3, register metadata in DynamoDB
exports.registerUpload = async (req, res) => {
  try {
    const { id, key, originalName, sizeBytes } = req.body || {};
    if (!key || !originalName) {
      return res.status(400).json({ error: "key and name required" });
    }

    const owner = req.user?.sub || "anon";
    const video = await videoModel.createFromS3({
      id,
      owner,
      key,
      originalName,
      sizeBytes
    });

    res.json({ videoId: video.id });
  } catch (err) {
    console.error("registerUpload error", err);
    res.status(500).json({ error: "register failed" });
  }
};

// List originals + outputs (jobs can be listed separately)
exports.listFiles = async (req, res) => {
  try {
    const ownerId = req.user.sub;
    const role = req.user["cognito:groups"] || "user";

	console.log("[files] user=", req.user.username, "role=", role, "ownerId=", ownerId);

    let originals, outputs;

    if (role === "admin") {
      // admin can see all
      originals = await videoModel.listAll();
      outputs = await jobModel.listAll();
    } else {
      // normal user: filter by owner
      originals = await videoModel.listByOwner(ownerId);
      outputs = await jobModel.listByOwner(ownerId);
    }

    res.json({ originals, outputs });
  } catch (err) {
    console.error("[files] error", err);
    res.status(500).json({ error: "Failed to list files" });
  }
};
