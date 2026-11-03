// ============================================================
// INVENTORY SERVICE — CloudMart E-Commerce Platform
// Militech Corp — LKS Cloud Computing 2026
// ============================================================
// ⚠️ JANGAN UBAH FILE INI (src/)
// ============================================================

'use strict';

const express = require('express');
const app = express();
app.use(express.json());

const PORT       = process.env.PORT_INVENTORY  || 3002;
const REDIS_URL  = process.env.REDIS_URL;
const S3_BUCKET  = process.env.S3_BUCKET;
const DB_URL     = process.env.DB_URL;

let redis = null;
if (REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    redis.on('error', (err) => console.warn('Redis non-fatal error:', err.message));
  } catch (e) {
    console.warn('Redis init warning:', e.message);
  }
}

const products = [
  { id: 'prod-001', name: 'Neural Processor X1', stock: 150, price: 299.99, category: 'Hardware' },
  { id: 'prod-002', name: 'Cyberdeck Pro 2026',  stock: 45,  price: 1299.99, category: 'Hardware' },
  { id: 'prod-003', name: 'Mantis Blade Kit',    stock: 20,  price: 599.99,  category: 'Augments' },
  { id: 'prod-004', name: 'Sandevistan MK3',     stock: 8,   price: 2499.99, category: 'Augments' }
];

app.get('/api/health', (req, res) => {
  res.json({
    status   : 'ok',
    service  : 'inventory-service',
    redis    : redis ? 'configured' : 'not-set',
    s3Bucket : S3_BUCKET || 'not-set',
    database : DB_URL ? 'configured' : 'not-set',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/inventory', async (req, res) => {
  res.json({ success: true, count: products.length, data: products });
});

app.get('/api/inventory/:id', (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: p });
});

app.listen(PORT, () => {
  console.log(`✅ Inventory Service running on port ${PORT}`);
});

module.exports = app;
