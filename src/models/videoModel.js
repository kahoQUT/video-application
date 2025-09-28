const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuid } = require("uuid");

const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const ddb = DynamoDBDocumentClient.from(client);
const VIDEO_TABLE = "Videos";

module.exports = {
  async createFromS3({ owner, key, originalName, sizeBytes }) {
    const id = `vid_${uuid()}`;
    const item = {
      id,
      "qut-username": "n12104353@qut.edu.au",
      s3_key: key,
      original_name: originalName,
      size_bytes: sizeBytes || 0,
      created_at: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: VIDEO_TABLE, Item: item }));
    return item;
  },

  async listByOwner(ownerId) {
	if (!ownerId) throw new Error("listByOwner called without ownerId");
	const params = {
	    TableName: VIDEO_TABLE,
	    FilterExpression: "#o = :o",
	    ExpressionAttributeNames: { "#o": "owner" },
	    ExpressionAttributeValues: { ":o": ownerId }
	  };
	const data = await ddb.send(new ScanCommand(params));
	return data.Items || [];
  },

  async getById(id) {
    const r = await ddb.send(
      new GetCommand({ TableName: VIDEO_TABLE, Key: { id } })
    );
    return r.Item;
  },

  async listAll() {
    const r = await ddb.send(new ScanCommand({ TableName: VIDEO_TABLE }));
    return r.Items || [];
  },
};
