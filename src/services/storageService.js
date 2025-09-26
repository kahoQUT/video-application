const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");

const S3_BUCKET = 'n12104353-a2';
const s3 = new S3Client({ region: "ap-southeast-2" });
const TMPDIR = "/tmp";

function keyOriginal(owner, videoId, filename) {
  return `originals/${owner}/${videoId}/${filename}`;
}
function keyOutput(owner, videoId, format) {
  return `outputs/${owner}/${videoId}/${videoId}.${format}`;
}

async function uploadOriginal({ owner, videoId, localPath, originalName, contentType = "application/octet-stream" }) {
  const Key = keyOriginal(owner, videoId, originalName);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key,
    Body: fs.createReadStream(localPath),
    ContentType: contentType
  }));
  return { bucket: S3_BUCKET, key: Key };
}

async function uploadOutput({ owner, videoId, format, localPath, contentType = "application/octet-stream" }) {
  const Key = keyOutput(owner, videoId, format);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key,
    Body: fs.createReadStream(localPath),
    ContentType: contentType
  }));
  return { bucket: S3_BUCKET, key: Key };
}

/** Download original from S3 to a tmp file (for ffmpeg input) */
async function downloadOriginalToTmp({ owner, videoId, originalName }) {
  const Key = keyOriginal(owner, videoId, originalName);
  const out = path.join(TMPDIR, `${videoId}-${Date.now()}-${originalName}`);
  const resp = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key }));
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(out);
    resp.Body.pipe(ws).on("finish", resolve).on("error", reject);
  });
  return out;
}

async function objectExists(bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch { return false; }
}

/** Presign a temporary download URL */
async function presign({ bucket = S3_BUCKET, key, expiresIn = 900 }) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

module.exports = {
  keyOriginal, keyOutput,
  uploadOriginal, uploadOutput,
  downloadOriginalToTmp, presign, objectExists
};
