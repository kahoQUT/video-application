const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: 'ap-southeast-2' });
const BUCKET = 'n12104353-a2';

async function presignPut(key, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "private"
  });
  return getSignedUrl(s3, cmd, { expiresIn: 900 }); // 15 min
}

async function presignGet(key) {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });
  return getSignedUrl(s3, cmd, { expiresIn: 3600 });
}

module.exports = { s3, BUCKET, presignPut, presignGet };
