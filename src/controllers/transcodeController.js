const { v4: uuid } = require("uuid");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const videoModel = require("../models/videoModel");
const jobModel = require("../models/jobModel");

const s3 = new S3Client({ region: "ap-southeast-2" });
const BUCKET = "n12104353-a2";

const { sendJob } = require("../utils/sqs.js");

// Kick off a transcode job (record job in DynamoDB)
exports.startTranscode = async (req, res) => {
  try {
    const { videoId, format } = req.body || {};
    if (!videoId || !format) {
      return res.status(400).json({ error: "videoId and format required" });
    }

    const owner = req.user?.sub || req.user?.id;
    const video = await videoModel.getById(videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Create job record in DynamoDB
    const job = await jobModel.create({
      videoId,
      owner,
      targetFormat: format,
    });

    res.json(job);

  // Calling Lambda
console.log(video.s3_key);
job.s3_key = video.s3_key;
console.log("Calling Lambda"+ JSON.stringify(job));
await fetch("https://zd1ixf6x39.execute-api.ap-southeast-2.amazonaws.com/prod/sqs-api", {
  method: "POST",
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(job)
});

  } catch (err) {
    console.error("startTranscode error", err);
    res.status(500).json({ error: "transcode failed" });
  }
};

// Check job status
exports.getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await jobModel.getById(id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    console.error("getJob error", err);
    res.status(500).json({ error: "get job failed" });
  }
};

// Download video (original or transcoded) via presigned URL
exports.download = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, format } = req.query;

    const video = await videoModel.getById(id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    let key;
    if (type === "original") {
      key = video.s3_key;
    } else if (type === "output" && format) {
      key = `users/${video.owner}/outputs/${id}.${format}`;
    } else {
      return res.status(400).json({ error: "Invalid type or format" });
    }

    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

    res.json({ downloadUrl: url });
  } catch (err) {
    console.error("download error", err);
    res.status(500).json({ error: "download failed" });
  }
};

// Example worker helper (to be run separately for actual processing)
async function transcodeAndUpload({ video, format }) {
  const jobId = `job_${uuid()}`;
  try {
    // 1. Download original
    const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: video.s3_key });
    const originalUrl = await getSignedUrl(s3, getCmd, { expiresIn: 600 });

    // 2. Run ffmpeg (spawn process) using originalUrl as input
    // Example: ffmpeg -i originalUrl -c:v libx264 -c:a aac output.mp4
    // (download to /tmp if ffmpeg can't stream from presigned URLs)

    // 3. Upload result back to S3
    const outputKey = `users/${video.owner}/outputs/${video.id}.${format}`;
    const putCmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: outputKey,
      ContentType: "video/" + format,
      Body: "<buffer from ffmpeg>", // Replace with actual stream/buffer
    });
    await s3.send(putCmd);

    // 4. Update job in DynamoDB
    await jobModel.updateStatus(jobId, "done");
  } catch (err) {
    console.error("transcode worker error", err);
    await jobModel.updateStatus(jobId, "error", err.message);
  }
}
