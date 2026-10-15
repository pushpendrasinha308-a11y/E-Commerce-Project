/**
 * AP Mart - SQLite3 Database Connection & Schema Migrations
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'apecommerce.db');

// Connect to SQLite3 Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', DB_PATH);
  }
});

// Helper for running queries returning a Promise
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper for fetching single record returning a Promise
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper for fetching all records returning a Promise
function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables and seed data
async function initializeDatabase() {
  try {
    // 1. Products Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tagline TEXT,
        category TEXT NOT NULL,
        collection TEXT,
        price REAL NOT NULL,
        original_price REAL,
        rating REAL DEFAULT 4.8,
        reviews_count INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 0,
        is_bestseller INTEGER DEFAULT 0,
        badge TEXT,
        sizes TEXT,
        colors TEXT,
        primary_image TEXT,
        gallery TEXT,
        description TEXT,
        materials TEXT,
        care_instructions TEXT,
        stock_count INTEGER DEFAULT 10,
        in_stock INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Orders Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        shipping_address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        shipping_fee REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        estimated_delivery TEXT,
        tracking_number TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Order Items Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        size TEXT,
        color TEXT,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        image TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // 4. User Profile Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        first_name TEXT DEFAULT 'Elena',
        last_name TEXT DEFAULT 'Rostova',
        email TEXT DEFAULT 'elena@example.com',
        phone TEXT DEFAULT '+1 (555) 234-8901',
        member_tier TEXT DEFAULT 'AP Atelier VIP',
        member_points INTEGER DEFAULT 1450,
        member_since TEXT DEFAULT 'Nov 2024',
        avatar TEXT,
        notify_order_updates INTEGER DEFAULT 1,
        notify_exclusive_drops INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Saved Addresses Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        name TEXT NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        zip TEXT NOT NULL,
        country TEXT DEFAULT 'United States',
        is_default INTEGER DEFAULT 0
      )
    `);

    // Seed User Profile if not present
    const existingProfile = await getQuery(`SELECT * FROM user_profile WHERE id = 1`);
    if (!existingProfile) {
      await runQuery(`
        INSERT INTO user_profile (id, first_name, last_name, email, phone, member_tier, member_points, member_since, avatar, notify_order_updates, notify_exclusive_drops)
        VALUES (
          1,
          'Elena',
          'Rostova',
          'elena@example.com',
          '+1 (555) 234-8901',
          'AP Atelier VIP',
          1450,
          'Nov 2024',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          1,
          1
        )
      `);
    }

    // Seed Saved Addresses if empty
    const addressCount = await getQuery(`SELECT COUNT(*) as count FROM addresses`);
    if (addressCount.count === 0) {
      await runQuery(`
        INSERT INTO addresses (id, label, name, street, city, zip, country, is_default)
        VALUES 
          ('addr-1', 'Primary Residence', 'Elena Rostova', '452 Madison Ave, Apt 12B', 'New York', '10022', 'United States', 1),
          ('addr-2', 'Hamptons Estate', 'Elena Rostova', '88 Ocean Drive', 'East Hampton', '11937', 'United States', 0)
      `);
    }

    // Seed Initial Products if empty
    const productCount = await getQuery(`SELECT COUNT(*) as count FROM products`);
    if (productCount.count === 0) {
      console.log('📦 Seeding initial apparel catalog into SQLite database...');

      const seedProducts = [
        {
          id: 'prod-001',
          name: 'The Signature Belted Trench Coat',
          tagline: 'Double-breasted weather-resistant structured cotton gabardine',
          category: 'women',
          collection: 'Outerwear Capsule',
          price: 295,
          original_price: 360,
          rating: 4.9,
          reviews_count: 88,
          is_new: 1,
          is_bestseller: 1,
          badge: 'Bestseller',
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          colors: JSON.stringify([
            { name: 'Classic Camel', hex: '#c39b6f' },
            { name: 'Midnight Black', hex: '#1f2022' },
            { name: 'Stone Grey', hex: '#8d8f8d' }
          ]),
          primary_image: 'uploads/trench-coat.jpg',
          gallery: JSON.stringify(['uploads/trench-coat.jpg', 'uploads/hero-lookbook.jpg']),
          description: 'Crafted from heavy 380gsm organic cotton gabardine, this silhouette features traditional storm flaps, a horn-buckle belt, and tailored raglan shoulders. Cut for effortless layering over heavy knits or sleek evening wear.',
          materials: JSON.stringify([
            '100% Water-repellent Egyptian Cotton Gabardine',
            'Viscose Bemberg interior lining',
            'Natural horn button hardware'
          ]),
          care_instructions: JSON.stringify([
            'Dry clean only (perchloroethylene free)',
            'Cool iron with pressing cloth',
            'Store on contoured wooden hanger'
          ]),
          stock_count: 8,
          in_stock: 1
        },
        {
          id: 'prod-002',
          name: 'Artisanal Relaxed Linen Shirt',
          tagline: 'Garment-washed French flax linen with chest patch pocket',
          category: 'men',
          collection: 'Summer Essentials',
          price: 125,
          original_price: null,
          rating: 4.8,
          reviews_count: 114,
          is_new: 1,
          is_bestseller: 0,
          badge: 'New Season',
          sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          colors: JSON.stringify([
            { name: 'Olive Green', hex: '#5b6b44' },
            { name: 'Natural Ecru', hex: '#e7e2d7' },
            { name: 'Dusk Navy', hex: '#2b3547' }
          ]),
          primary_image: 'uploads/linen-shirt.jpg',
          gallery: JSON.stringify(['uploads/linen-shirt.jpg', 'uploads/hero-lookbook.jpg']),
          description: 'Woven in Normandy from long-staple flax and enzyme washed for an ultra-soft hand feel from day one. Features an unstructured camp collar, mother-of-pearl buttons, and a curved hem tailored for both tucked and untucked styling.',
          materials: JSON.stringify([
            '100% Certified French Flax Linen',
            'Sustainably sourced Mother-of-Pearl buttons',
            'Reinforced single-needle tailoring'
          ]),
          care_instructions: JSON.stringify([
            'Machine wash cold on gentle cycle',
            'Hang dry in shade to maintain natural fiber loft',
            'Steam or embrace authentic lived-in wrinkles'
          ]),
          stock_count: 14,
          in_stock: 1
        },
        {
          id: 'prod-003',
          name: 'Ribbed Mongolian Cashmere Sweater',
          tagline: 'Grade-A pure cashmere with chunky fisherman rib knit',
          category: 'unisex',
          collection: 'Winter Heritage',
          price: 210,
          original_price: 245,
          rating: 5.0,
          reviews_count: 64,
          is_new: 0,
          is_bestseller: 1,
          badge: 'Must-Have',
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          colors: JSON.stringify([
            { name: 'Cream White', hex: '#f5f3ec' },
            { name: 'Charcoal Heather', hex: '#3b3d40' },
            { name: 'Caramel', hex: '#a47148' }
          ]),
          primary_image: 'uploads/cashmere-knit.jpg',
          gallery: JSON.stringify(['uploads/cashmere-knit.jpg', 'uploads/hero-lookbook.jpg']),
          description: 'Spun from 100% inner Mongolian cashmere fleece with an average micron count of 15.2um. Offers unparalleled cloud-like warmth without heaviness, finished with ribbed crew collar and turn-back cuffs.',
          materials: JSON.stringify([
            '100% Grade-A Pure Mongolian Cashmere',
            '2-ply twisted combed yarn for anti-pilling longevity',
            'Zero synthetic dyes or harsh bleach'
          ]),
          care_instructions: JSON.stringify([
            'Hand wash cold with gentle wool detergent',
            'Do not wring; dry flat on clean towel',
            'Store folded with cedar blocks'
          ]),
          stock_count: 4,
          in_stock: 1
        },
        {
          id: 'prod-004',
          name: 'Emerald Silk Cowl-Neck Slip Dress',
          tagline: 'Heavy 22-momme Mulberry silk with bias-cut fluid drape',
          category: 'women',
          collection: 'Evening Capsule',
          price: 185,
          original_price: 220,
          rating: 4.9,
          reviews_count: 52,
          is_new: 0,
          is_bestseller: 1,
          badge: 'Sale',
          sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
          colors: JSON.stringify([
            { name: 'Emerald Green', hex: '#1c5139' },
            { name: 'Champagne Pearl', hex: '#f0e6d6' },
            { name: 'Obsidian Black', hex: '#151515' }
          ]),
          primary_image: 'uploads/silk-dress.jpg',
          gallery: JSON.stringify(['uploads/silk-dress.jpg', 'uploads/hero-lookbook.jpg']),
          description: 'Cut on the bias to hug and accentuate the natural silhouette with liquid fluidity. Features delicate adjustable French-bound straps, an elegant draped cowl neckline, and a subtle side slit for movement.',
          materials: JSON.stringify([
            '100% Grade 6A Pure Mulberry Silk (22 Momme)',
            'Hypoallergenic OEKO-TEX Standard 100 certified',
            'Concealed Japanese YKK side zipper'
          ]),
          care_instructions: JSON.stringify([
            'Dry clean or hand wash in lukewarm water with silk wash',
            'Lay flat to dry out of direct sunlight',
            'Low temperature iron inside out while damp'
          ]),
          stock_count: 6,
          in_stock: 1
        },
        {
          id: 'prod-005',
          name: 'Tuscan Vegetable-Tanned Leather Tote',
          tagline: 'Hand-finished full-grain leather with brass hardware',
          category: 'accessories',
          collection: 'Artisan Leather',
          price: 240,
          original_price: null,
          rating: 4.9,
          reviews_count: 97,
          is_new: 1,
          is_bestseller: 0,
          badge: 'Handcrafted',
          sizes: JSON.stringify(['One Size']),
          colors: JSON.stringify([
            { name: 'Saddle Tan', hex: '#b87843' },
            { name: 'Espresso', hex: '#3e271a' },
            { name: 'Onyx', hex: '#1a1a1a' }
          ]),
          primary_image: 'uploads/leather-tote.jpg',
          gallery: JSON.stringify(['uploads/leather-tote.jpg']),
          description: 'Handcrafted in Florence using traditional vegetable tanning methods that allow the leather to develop a rich, one-of-a-kind patina over time. Accommodates up to a 16-inch laptop with reinforced bottom gussets and an internal zip pocket.',
          materials: JSON.stringify([
            '100% Italian Full-Grain Cowhide Leather',
            'Solid cast brushed brass hardware',
            'Unlined suede interior with leather pocket'
          ]),
          care_instructions: JSON.stringify([
            'Condition every 6 months with natural beeswax leather cream',
            'Avoid prolonged exposure to torrential rain',
            'Store in included cotton dust bag'
          ]),
          stock_count: 11,
          in_stock: 1
        },
        {
          id: 'prod-006',
          name: 'Architectural Tailored Wool Trousers',
          tagline: 'High-waist wide-leg silhouette in Italian tropical wool',
          category: 'unisex',
          collection: 'Modern Tailoring',
          price: 175,
          original_price: 200,
          rating: 4.8,
          reviews_count: 41,
          is_new: 1,
          is_bestseller: 0,
          badge: 'Sale',
          sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
          colors: JSON.stringify([
            { name: 'Oatmeal Melange', hex: '#d5cdc0' },
            { name: 'Charcoal Pinstripe', hex: '#44464a' },
            { name: 'Deep Navy', hex: '#1d2330' }
          ]),
          primary_image: 'uploads/trench-coat.jpg',
          gallery: JSON.stringify(['uploads/trench-coat.jpg', 'uploads/hero-lookbook.jpg']),
          description: 'Engineered with double front pleats, hidden slant pockets, and an interior curtain waistband for unmatched structure. The fluid drape moves effortlessly between boardroom and weekend dinners.',
          materials: JSON.stringify([
            '98% Super 120s Virgin Wool, 2% Elastane for comfort stretch',
            'Bemberg cupro pocket lining',
            'Mother-of-pearl internal anchor buttons'
          ]),
          care_instructions: JSON.stringify([
            'Dry clean recommended',
            'Steam between wears to release wrinkles',
            'Hang with clamp hangers by the hem'
          ]),
          stock_count: 9,
          in_stock: 1
        }
      ];

      for (const p of seedProducts) {
        await runQuery(
          `INSERT INTO products (
            id, name, tagline, category, collection, price, original_price,
            rating, reviews_count, is_new, is_bestseller, badge, sizes,
            colors, primary_image, gallery, description, materials,
            care_instructions, stock_count, in_stock
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.tagline,
            p.category,
            p.collection,
            p.price,
            p.original_price,
            p.rating,
            p.reviews_count,
            p.is_new,
            p.is_bestseller,
            p.badge,
            p.sizes,
            p.colors,
            p.primary_image,
            p.gallery,
            p.description,
            p.materials,
            p.care_instructions,
            p.stock_count,
            p.in_stock
          ]
        );
      }
      console.log('✅ 6 initial apparel items seeded into SQLite.');
    }

    // Seed Initial Past Orders if empty
    const orderCount = await getQuery(`SELECT COUNT(*) as count FROM orders`);
    if (orderCount.count === 0) {
      console.log('📦 Seeding initial order history...');
      const pastDate1 = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate2 = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();

      await runQuery(`
        INSERT INTO orders (id, customer_name, customer_email, shipping_address, city, postal_code, subtotal, discount, shipping_fee, total, status, estimated_delivery, tracking_number, created_at)
        VALUES 
          ('ORD-942810', 'Elena Rostova', 'elena@example.com', '452 Madison Ave, Apt 12B', 'New York', '10022', 295, 0, 0, 295, 'Delivered', 'Delivered on Oct 11', 'AP-FEDEX-984210', ?),
          ('ORD-821940', 'Elena Rostova', 'elena@example.com', '452 Madison Ave, Apt 12B', 'New York', '10022', 125, 0, 0, 125, 'Delivered', 'Delivered on Sep 29', 'AP-DHL-821940', ?)
      `, [pastDate1, pastDate2]);

      await runQuery(`
        INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity, image)
        VALUES 
          ('ORD-942810', 'prod-001', 'The Signature Belted Trench Coat', 'S', 'Classic Camel', 295, 1, 'uploads/trench-coat.jpg'),
          ('ORD-821940', 'prod-002', 'Artisanal Relaxed Linen Shirt', 'M', 'Olive Green', 125, 1, 'uploads/linen-shirt.jpg')
      `);
      console.log('✅ Initial order history seeded.');
    }
  } catch (err) {
    console.error('❌ Error during database schema initialization:', err);
  }
}

// Auto initialize schema
initializeDatabase();

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};
