const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "ap-southeast-2" }));
const TBL_VIDEOS = "Videos";
const TBL_TX     = "Transcodes";
const qutUsername = "n12104353@qut.edu.au"

// videos
async function createVideo({ id, owner, name, s3Bucket, s3Key, size }) {
  const item = {
    owner, videoId: id,
    originalName: name,
    s3Bucket, s3Key,
    sizeBytes: size ?? null,
    createdAt: new Date().toISOString()
  };
  await ddb.send(new PutCommand({ TableName: TBL_VIDEOS, Item: item }));
  return id;
}
async function listVideosByOwner(owner, { limit = 25, cursor } = {}) {
  const params = {
    TableName: TBL_VIDEOS,
    KeyConditionExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": Number(owner) },
    Limit: limit,
    ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, "base64").toString()) : undefined,
    ScanIndexForward: false
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
async function findVideoByIdOwner(id, owner) {
  const out = await ddb.send(new GetCommand({ TableName: TBL_VIDEOS, Key: { owner: Number(owner), videoId: id } }));
  return out.Item || null;
}

// transcodes
async function createJob({ id, videoId, owner, format, outBucket, outKey }) {
  const item = {
    videoId, jobId: id, owner: Number(owner),
    targetFormat: format, status: "queued",
    outputBucket: outBucket || null, outputKey: outKey || null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  await ddb.send(new PutCommand({ TableName: TBL_TX, Item: item }));
  return id;
}
async function updateStatus(id, videoId, { status, errorMsg, outBucket, outKey }) {
  const expr = [], names = {}, values = { ":u": new Date().toISOString() };
  if (status)  { expr.push("#s=:s"); names["#s"]="status"; values[":s"]=status; }
  if (errorMsg){ expr.push("#e=:e"); names["#e"]="errorMsg"; values[":e"]=errorMsg; }
  if (outBucket){ expr.push("#ob=:ob"); names["#ob"]="outputBucket"; values[":ob"]=outBucket; }
  if (outKey)   { expr.push("#ok=:ok"); names["#ok"]="outputKey"; values[":ok"]=outKey; }
  expr.push("#u=:u"); names["#u"]="updatedAt";
  await ddb.send(new UpdateCommand({
    TableName: TBL_TX,
    Key: { videoId, jobId: id },
    UpdateExpression: "SET " + expr.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  }));
}
async function listJobsByOwner(owner, { limit = 25, cursor } = {}) {
  const params = {
    TableName: TBL_TX,
    IndexName: "owner-index",
    KeyConditionExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": Number(owner) },
    Limit: limit,
    ExclusiveStartKey: cursor ? JSON.parse(Buffer.from(cursor, "base64").toString()) : undefined,
    ScanIndexForward: false
  };
  const out = await ddb.send(new QueryCommand(params));
  return {
    items: out.Items || [],
    nextCursor: out.LastEvaluatedKey ? Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString("base64") : null
  };
}
module.exports = { createVideo, listVideosByOwner, findVideoByIdOwner, createJob, updateStatus, listJobsByOwner };
