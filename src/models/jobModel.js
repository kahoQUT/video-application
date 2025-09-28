const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuid } = require("uuid");

const client = new DynamoDBClient({ region: 'ap-southeast-2'});
const ddb = DynamoDBDocumentClient.from(client);
const JOB_TABLE = "n12104353-Jobs";

module.exports = {
  async create({ videoId, owner, targetFormat }) {
    const id = `job_${uuid()}`;
    const item = {
      id,
      video_id: videoId,
      owner,
      target_format: targetFormat,
      status: "queued",
      updated_at: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: JOB_TABLE, Item: item }));
    return item;
  },

  async updateStatus(id, status, errorMsg = null) {
    const r = await ddb.send(
      new UpdateCommand({
        TableName: JOB_TABLE,
        Key: { id },
        UpdateExpression:
          "set #s = :s, error_msg = :e, updated_at = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": status,
          ":e": errorMsg,
          ":u": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return r.Attributes;
  },

  async getById(id) {
    const r = await ddb.send(
      new GetCommand({ TableName: JOB_TABLE, Key: { id } })
    );
    return r.Item;
  },

async listByOwner(ownerId) {
  const params = {
    TableName: JOB_TABLE,
    FilterExpression: "#o = :o",
    ExpressionAttributeNames: { "#o": "owner" },
    ExpressionAttributeValues: { ":o": ownerId }
  };

  const data = await ddb.send(new ScanCommand(params));
  return data.Items || [];
  },
};
