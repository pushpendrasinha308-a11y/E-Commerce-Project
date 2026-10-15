const express = require('express');
const path = require('path');
const cors = require('cors');

// Import Database initialization
const { db, getQuery } = require('./server/db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets & uploads from public/ directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount REST API Routers
app.use('/api/products', require('./server/routes/products'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/profile', require('./server/routes/profile'));
app.use('/api/upload', require('./server/routes/upload'));

// Promo Code Validation API Endpoint
app.post('/api/promo/validate', (req, res) => {
  const { code } = req.body;
  const cleanCode = (code || '').trim().toUpperCase();

  const validCodes = {
    AP10: { discountPercent: 10, description: '10% off your entire order' },
    AP20: { discountPercent: 20, description: '20% VIP seasonal discount' },
    AURA10: { discountPercent: 10, description: '10% off your entire order' },
    VOGUE20: { discountPercent: 20, description: '20% VIP seasonal discount' },
    FREESHIP: { freeShipping: true, description: 'Free express shipping unlocked' }
  };

  if (validCodes[cleanCode]) {
    return res.json({ success: true, promo: validCodes[cleanCode], code: cleanCode });
  }
  return res.status(400).json({ success: false, error: "Invalid promo code. Try 'AP10' or 'AP20'" });
});

// API Healthcheck Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const productCount = await getQuery('SELECT COUNT(*) as count FROM products');
    const orderCount = await getQuery('SELECT COUNT(*) as count FROM orders');

    res.json({
      status: 'healthy',
      database: 'SQLite3 connected',
      stats: {
        productsInDb: productCount.count,
        ordersInDb: orderCount.count
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AP Mart E-Commerce Backend (Express + SQLite3)`);
  console.log(`  Storefront: http://localhost:${PORT}`);
  console.log(`  API Health: http://localhost:${PORT}/api/health`);
  console.log(`  Products API: http://localhost:${PORT}/api/products`);
  console.log(`====================================================`);
});

module.exports = { app, server };
