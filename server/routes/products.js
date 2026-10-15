/**
 * AP Mart - Products REST API Router
 */
const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../db/database');

// Helper to format product DB row to API response object
function formatProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    category: row.category,
    collection: row.collection,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    rating: Number(row.rating),
    reviewsCount: Number(row.reviews_count),
    isNew: Boolean(row.is_new),
    isBestseller: Boolean(row.is_bestseller),
    badge: row.badge,
    sizes: row.sizes ? JSON.parse(row.sizes) : [],
    colors: row.colors ? JSON.parse(row.colors) : [],
    primaryImage: row.primary_image,
    gallery: row.gallery ? JSON.parse(row.gallery) : [],
    description: row.description,
    materials: row.materials ? JSON.parse(row.materials) : [],
    careInstructions: row.care_instructions ? JSON.parse(row.care_instructions) : [],
    stockCount: Number(row.stock_count),
    inStock: Boolean(row.in_stock),
    createdAt: row.created_at
  };
}

// GET /api/products - Get all products with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { category, search, size, maxPrice, sortBy } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter by Category
    if (category && category !== 'all') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    // Filter by Search Query
    if (search && search.trim() !== '') {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(collection) LIKE ? OR LOWER(category) LIKE ?)';
      params.push(q, q, q, q);
    }

    // Filter by Max Price
    if (maxPrice && !isNaN(maxPrice)) {
      sql += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    // Sort order
    if (sortBy === 'price-asc') {
      sql += ' ORDER BY price ASC';
    } else if (sortBy === 'price-desc') {
      sql += ' ORDER BY price DESC';
    } else if (sortBy === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else if (sortBy === 'newest') {
      sql += ' ORDER BY is_new DESC, created_at DESC';
    } else {
      sql += ' ORDER BY is_bestseller DESC, id ASC';
    }

    const rows = await allQuery(sql, params);
    let products = rows.map(formatProduct);

    // Filter by size if requested (since sizes is stored as JSON array string)
    if (size && size !== 'all') {
      products = products.filter((p) => p.sizes.includes(size));
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - Distinct categories with counts
router.get('/meta/categories', async (req, res) => {
  try {
    const rows = await allQuery('SELECT category, COUNT(*) as count FROM products GROUP BY category');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id - Single product details
router.get('/:id', async (req, res) => {
  try {
    const row = await getQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: formatProduct(row) });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/products - Add new product
router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const id = p.id || 'prod-' + Date.now();

    await runQuery(
      `INSERT INTO products (
        id, name, tagline, category, collection, price, original_price,
        rating, reviews_count, is_new, is_bestseller, badge, sizes,
        colors, primary_image, gallery, description, materials,
        care_instructions, stock_count, in_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        p.name,
        p.tagline || '',
        p.category || 'unisex',
        p.collection || 'Collection',
        Number(p.price) || 0,
        p.originalPrice ? Number(p.originalPrice) : null,
        Number(p.rating) || 5.0,
        Number(p.reviewsCount) || 0,
        p.isNew ? 1 : 0,
        p.isBestseller ? 1 : 0,
        p.badge || 'New',
        JSON.stringify(p.sizes || ['S', 'M', 'L']),
        JSON.stringify(p.colors || [{ name: 'Default', hex: '#333333' }]),
        p.primaryImage || 'uploads/trench-coat.jpg',
        JSON.stringify(p.gallery || [p.primaryImage || 'uploads/trench-coat.jpg']),
        p.description || '',
        JSON.stringify(p.materials || []),
        JSON.stringify(p.careInstructions || []),
        Number(p.stockCount) || 10,
        1
      ]
    );

    const created = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: formatProduct(created) });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

module.exports = router;
