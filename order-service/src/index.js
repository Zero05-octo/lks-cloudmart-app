// ============================================================
// ORDER SERVICE — CloudMart E-Commerce Platform
// Militech Corp — LKS Cloud Computing 2026
// ============================================================
// ⚠️ JANGAN UBAH FILE INI (src/)
// ============================================================

'use strict';

const express = require('express');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT           = process.env.PORT_ORDER      || 3000;
const AWS_REGION     = process.env.DYNAMODB_REGION || 'us-east-1';
const SQS_URL        = process.env.SQS_URL;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const BASE_URL       = process.env.BASE_URL        || 'http://localhost';
const DB_URL         = process.env.DB_URL;

const sqsClient = new SQSClient({ region: AWS_REGION });
const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const orders = new Map();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status    : 'ok',
    service   : 'order-service',
    version   : '1.0.0',
    sqs       : SQS_URL        ? 'configured' : 'not-set',
    dynamodb  : DYNAMODB_TABLE ? 'configured' : 'not-set',
    database  : DB_URL         ? 'configured' : 'not-set',
    timestamp : new Date().toISOString()
  });
});

// List Orders
app.get('/api/orders', (req, res) => {
  res.json({ success: true, count: orders.size, data: Array.from(orders.values()) });
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const { productId, quantity, customerId, customerEmail } = req.body;
    if (!productId || !quantity || !customerId) {
      return res.status(400).json({ success: false, message: 'productId, quantity, customerId wajib diisi' });
    }

    const orderId = crypto.randomUUID();
    const order = {
      orderId,
      productId,
      quantity: Number(quantity),
      customerId,
      customerEmail: customerEmail || '',
      status: 'PENDING',
      totalPrice: Number(quantity) * 99.99,
      createdAt: new Date().toISOString()
    };

    orders.set(orderId, order);

    // Simpan ke DynamoDB
    if (DYNAMODB_TABLE) {
      try {
        await docClient.send(new PutCommand({
          TableName: DYNAMODB_TABLE,
          Item: {
            session_id: `order-${orderId}`,
            data: JSON.stringify(order),
            ttl: Math.floor(Date.now() / 1000) + 86400
          }
        }));
      } catch (e) {
        console.warn('DynamoDB write warning:', e.message);
      }
    }

    // Publish ke SQS
    if (SQS_URL) {
      try {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: SQS_URL,
          MessageBody: JSON.stringify({
            type: 'ORDER_CREATED',
            orderId,
            productId,
            quantity: order.quantity,
            customerId,
            timestamp: Date.now()
          })
        }));
      } catch (e) {
        console.warn('SQS send warning:', e.message);
      }
    }

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Order Service running on port ${PORT}`);
});

module.exports = app;
