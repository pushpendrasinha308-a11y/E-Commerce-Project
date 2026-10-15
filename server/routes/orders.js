/**
 * AP Mart - Orders REST API Router
 */
const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../db/database');

// GET /api/orders - Fetch all orders with item details
router.get('/', async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders ORDER BY created_at DESC');

    // Fetch items for each order
    const result = await Promise.all(
      orders.map(async (order) => {
        const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        return {
          orderId: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          shippingAddress: order.shipping_address,
          city: order.city,
          postalCode: order.postal_code,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping: Number(order.shipping_fee),
          total: Number(order.total),
          status: order.status,
          estimatedDelivery: order.estimated_delivery,
          trackingNumber: order.tracking_number,
          createdAt: order.created_at,
          items: items.map((it) => ({
            id: it.id,
            productId: it.product_id,
            name: it.product_name,
            size: it.size,
            color: it.color,
            price: Number(it.price),
            quantity: Number(it.quantity),
            image: it.image
          }))
        };
      })
    );

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Fetch single order
router.get('/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        shippingAddress: order.shipping_address,
        city: order.city,
        postalCode: order.postal_code,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping_fee),
        total: Number(order.total),
        status: order.status,
        estimatedDelivery: order.estimated_delivery,
        trackingNumber: order.tracking_number,
        createdAt: order.created_at,
        items: items.map((it) => ({
          productId: it.product_id,
          name: it.product_name,
          size: it.size,
          color: it.color,
          price: Number(it.price),
          quantity: Number(it.quantity),
          image: it.image
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { items, total, subtotal, discount, shipping, shippingAddress } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'Cannot create order with an empty cart' });
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = 'AP-EXP-' + Math.floor(100000 + Math.random() * 900000);
    const estimatedDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const addr = shippingAddress || {};

    // Insert Order
    await runQuery(
      `INSERT INTO orders (
        id, customer_name, customer_email, shipping_address, city, postal_code,
        subtotal, discount, shipping_fee, total, status, estimated_delivery, tracking_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        addr.name || 'Valued Guest',
        addr.email || 'guest@example.com',
        addr.address || '123 Atelier Street',
        addr.city || 'New York',
        addr.zip || '10001',
        Number(subtotal) || Number(total) || 0,
        Number(discount) || 0,
        Number(shipping) || 0,
        Number(total) || 0,
        'Confirmed',
        estimatedDelivery,
        trackingNumber
      ]
    );

    // Insert Order Items & decrement product stock count
    for (const item of items) {
      await runQuery(
        `INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId || item.id,
          item.name,
          item.size || 'M',
          item.color || 'Standard',
          Number(item.price),
          Number(item.quantity) || 1,
          item.image || 'uploads/trench-coat.jpg'
        ]
      );

      // Decrement stock
      await runQuery(
        `UPDATE products SET stock_count = MAX(0, stock_count - ?) WHERE id = ?`,
        [Number(item.quantity) || 1, item.productId || item.id]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        orderId,
        trackingNumber,
        estimatedDelivery,
        status: 'Confirmed',
        total: Number(total),
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: 'Failed to process order' });
  }
});

module.exports = router;
