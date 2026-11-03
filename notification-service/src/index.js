// ============================================================
// NOTIFICATION SERVICE — CloudMart E-Commerce Platform
// Militech Corp — LKS Cloud Computing 2026
// ============================================================
// ⚠️ JANGAN UBAH FILE INI (src/)
// ============================================================

'use strict';

const express = require('express');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const app = express();
app.use(express.json());

const PORT          = process.env.PORT_NOTIFICATION || 3001;
const AWS_REGION    = process.env.DYNAMODB_REGION   || 'us-east-1';
const SQS_URL       = process.env.SQS_URL;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const sqsClient = new SQSClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

let processedCount = 0;

app.get('/api/health', (req, res) => {
  res.json({
    status    : 'ok',
    service   : 'notification-service',
    sqs       : SQS_URL       ? 'configured' : 'not-set',
    sns       : SNS_TOPIC_ARN ? 'configured' : 'not-set',
    processed : processedCount,
    timestamp : new Date().toISOString()
  });
});

app.get('/api/notify/stats', (req, res) => {
  res.json({ success: true, processedEvents: processedCount, sqsUrl: SQS_URL, snsTopicArn: SNS_TOPIC_ARN });
});

async function pollSQS() {
  if (!SQS_URL) {
    setTimeout(pollSQS, 5000);
    return;
  }
  try {
    const res = await sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: SQS_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10
    }));

    if (res.Messages && res.Messages.length > 0) {
      for (const msg of res.Messages) {
        console.log(`📩 Processing message: ${msg.MessageId}`);
        if (SNS_TOPIC_ARN) {
          try {
            await snsClient.send(new PublishCommand({
              TopicArn: SNS_TOPIC_ARN,
              Subject: 'CloudMart Notification',
              Message: `Event processed: ${msg.Body}`
            }));
          } catch (e) {
            console.warn('SNS send warning:', e.message);
          }
        }
        await sqsClient.send(new DeleteMessageCommand({
          QueueUrl: SQS_URL,
          ReceiptHandle: msg.ReceiptHandle
        }));
        processedCount++;
      }
    }
  } catch (err) {
    // Non-fatal logging
  }
  setTimeout(pollSQS, 3000);
}

app.listen(PORT, () => {
  console.log(`✅ Notification Service running on port ${PORT}`);
  pollSQS();
});

module.exports = app;
