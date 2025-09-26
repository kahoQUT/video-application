const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-southeast-2" }));
const TBL = "Videos";

/** Create a video metadata row */
async function createVideo({ id, owner, name, s3Bucket, s3Key, sizeBytes }) {
  const item = {
    owner,
    videoId: id,
    originalName: name,
    s3Bucket,
    s3Key,
    sizeBytes: sizeBytes ?? null,
    createdAt: new Date().toISOString()
  };
  await ddb.send(new PutCommand({ TableName: TBL, Item: item }));
  return id;
}

async function listVideosByOwner(owner, { limit = 50, cursor } = {}) {
  const params = {
    TableName: TBL,
    KeyConditionExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": owner },
    Limit: limit,
    ScanIndexForward: false,
    ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, "base64").toString()) : undefined
  };
  const out = await ddb.send(new QueryCommand(params));
  return {
    items: (out.Items || []).map(v => ({
      id: v.videoId, owner: v.owner, name: v.originalName,
      s3Bucket: v.s3Bucket, s3Key: v.s3Key, sizeBytes: v.sizeBytes, createdAt: v.createdAt
    })),
    nextCursor: out.LastEvaluatedKey ? Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString("base64") : null
  };
}

async function listVideosAll({ limit = 100, cursor } = {}) {
  // Simple owner-range iteration would require a scan; acceptable for demo/assessment.
  // For large-scale, model a GSI. Here we just list by owner=1..N from your app’s users.
  throw new Error("listVideosAll not implemented with scan in this snippet; call per-owner in controller or add a GSI.");
}

async function findVideoByIdOwner(id, owner) {
  const out = await ddb.send(new GetCommand({ TableName: TBL, Key: { owner: Number(owner), videoId: id } }));
  return out.Item || null;
}

module.exports = { createVideo, listVideosByOwner, listVideosAll, findVideoByIdOwner };
