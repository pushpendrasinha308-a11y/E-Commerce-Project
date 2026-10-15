/**
 * AP Mart - User Profile & Address REST API Router
 */
const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../db/database');

// GET /api/profile - Fetch customer profile & addresses
router.get('/', async (req, res) => {
  try {
    const profile = await getQuery('SELECT * FROM user_profile WHERE id = 1');
    const addresses = await allQuery('SELECT * FROM addresses ORDER BY is_default DESC, id ASC');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({
      success: true,
      data: {
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        tier: profile.member_tier,
        points: Number(profile.member_points),
        memberSince: profile.member_since,
        avatar: profile.avatar,
        notifications: {
          orderUpdates: Boolean(profile.notify_order_updates),
          exclusiveDrops: Boolean(profile.notify_exclusive_drops)
        },
        addresses: addresses.map((a) => ({
          id: a.id,
          type: a.label,
          name: a.name,
          address: a.street,
          city: a.city,
          zip: a.zip,
          country: a.country,
          isDefault: Boolean(a.is_default)
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, notifications } = req.body;

    await runQuery(
      `UPDATE user_profile SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        notify_order_updates = ?,
        notify_exclusive_drops = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
      [
        firstName || 'Elena',
        lastName || 'Rostova',
        email || 'elena@example.com',
        phone || '',
        notifications?.orderUpdates ? 1 : 0,
        notifications?.exclusiveDrops ? 1 : 0
      ]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// GET /api/profile/addresses - Fetch all addresses
router.get('/addresses', async (req, res) => {
  try {
    const rows = await allQuery('SELECT * FROM addresses ORDER BY is_default DESC, id ASC');
    res.json({
      success: true,
      data: rows.map((a) => ({
        id: a.id,
        type: a.label,
        name: a.name,
        address: a.street,
        city: a.city,
        zip: a.zip,
        country: a.country,
        isDefault: Boolean(a.is_default)
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/profile/addresses - Add address
router.post('/addresses', async (req, res) => {
  try {
    const { type, name, address, city, zip, country, isDefault } = req.body;
    const id = 'addr-' + Date.now();

    if (isDefault) {
      await runQuery('UPDATE addresses SET is_default = 0');
    }

    await runQuery(
      `INSERT INTO addresses (id, label, name, street, city, zip, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        type || 'Other',
        name,
        address,
        city,
        zip,
        country || 'United States',
        isDefault ? 1 : 0
      ]
    );

    res.status(201).json({
      success: true,
      data: { id, type, name, address, city, zip, country, isDefault: Boolean(isDefault) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add address' });
  }
});

// DELETE /api/profile/addresses/:id - Delete address
router.delete('/addresses/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM addresses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

// PUT /api/profile/addresses/:id/default - Set default address
router.put('/addresses/:id/default', async (req, res) => {
  try {
    await runQuery('UPDATE addresses SET is_default = 0');
    await runQuery('UPDATE addresses SET is_default = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Default address updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update default address' });
  }
});

module.exports = router;
