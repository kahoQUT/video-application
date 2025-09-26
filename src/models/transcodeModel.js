const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-2" }));
const TBL = process.env.DDB_TRANSCODES || "Transcodes"; // PK: videoId, SK: jobId; GSI: owner-index (owner, createdAt)

async function createJob({ id, videoId, owner, format, outBucket = null, outKey = null }) {
  const now = new Date().toISOString();
  const item = {
    videoId,
    jobId: id,
    owner: owner,
    targetFormat: format,
    status: "queued",
    errorMsg: null,
    outputBucket: outBucket,
    outputKey: outKey,
    createdAt: now,
    updatedAt: now
  };
  await ddb.send(new PutCommand({ TableName: TBL, Item: item }));
  return id;
}

async function updateStatus(id, videoId, { status, errorMsg = null, outBucket = null, outKey = null }) {
  const names = { "#u": "updatedAt" };
  const values = { ":u": new Date().toISOString() };
  const sets = ["#u = :u"];

  if (status)  { names["#s"]="status"; values[":s"]=status; sets.push("#s = :s"); }
  if (errorMsg !== null) { names["#e"]="errorMsg"; values[":e"]=errorMsg; sets.push("#e = :e"); }
  if (outBucket) { names["#ob"]="outputBucket"; values[":ob"]=outBucket; sets.push("#ob = :ob"); }
  if (outKey)    { names["#ok"]="outputKey";    values[":ok"]=outKey;     sets.push("#ok = :ok"); }

  await ddb.send(new UpdateCommand({
    TableName: TBL,
    Key: { videoId, jobId: id },
    UpdateExpression: "SET " + sets.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values
  }));
}

async function findJobByIdOwner(id, owner) {
  // With PK/SK, we need videoId to Get() directly. For demo, query GSI by owner then filter id:
  const out = await ddb.send(new QueryCommand({
    TableName: TBL,
    IndexName: "owner-index",
    KeyConditionExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": owner },
    ScanIndexForward: false,
    Limit: 100
  }));
  return (out.Items || []).find(j => j.jobId === id) || null;
}

async function findDoneOutput({ videoId, owner, format }) {
  const out = await ddb.send(new QueryCommand({
    TableName: TBL,
    KeyConditionExpression: "#v = :v",
    ExpressionAttributeNames: { "#v": "videoId" },
    ExpressionAttributeValues: { ":v": videoId },
    ScanIndexForward: false,
    Limit: 20
  }));
  return (out.Items || []).find(j => j.owner === owner && j.targetFormat === format && j.status === "done") || null;
}

async function listJobsByOwner(owner, { limit = 50, cursor } = {}) {
  const params = {
    TableName: TBL,
    IndexName: "owner-index",
    KeyConditionExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": owner },
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

async function listJobsAll(/* { limit, cursor } */) {
  // For full admin listing, either scan or add a GSI keyed by type.
  throw new Error("listJobsAll not implemented with scan in this snippet; use owner-index per-user or add admin scan.");
}

module.exports = {
  createJob, updateStatus,
  findJobByIdOwner, findDoneOutput,
  listJobsByOwner, listJobsAll
};
