const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const QUEUE_URL = "https://sqs.ap-southeast-2.amazonaws.com/901444280953/n12104353-a3-job-queue";
const sqs = new SQSClient({
  region: "ap-southeast-2",
});

async function sendJob(job) {
console.log(job);
  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(job),
  };
  await sqs.send(new SendMessageCommand(params));
  console.log("📤 Job sent to SQS:", job);
}

module.exports = { sendJob };
