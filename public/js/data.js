/**
 * AP Mart - Initial Apparel Catalog Dataset
 * High-fidelity product specifications for decoupled e-commerce architecture
 */
const initialProducts = [
  {
    id: "prod-001",
    name: "The Signature Belted Trench Coat",
    tagline: "Double-breasted weather-resistant structured cotton gabardine",
    category: "women",
    collection: "Outerwear Capsule",
    price: 295,
    originalPrice: 360,
    rating: 4.9,
    reviewsCount: 88,
    isNew: true,
    isBestseller: true,
    badge: "Bestseller",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Classic Camel", hex: "#c39b6f" },
      { name: "Midnight Black", hex: "#1f2022" },
      { name: "Stone Grey", hex: "#8d8f8d" }
    ],
    primaryImage: "uploads/trench-coat.jpg",
    gallery: [
      "uploads/trench-coat.jpg",
      "uploads/hero-lookbook.jpg"
    ],
    description: "Crafted from heavy 380gsm organic cotton gabardine, this silhouette features traditional storm flaps, a horn-buckle belt, and tailored raglan shoulders. Cut for effortless layering over heavy knits or sleek evening wear.",
    materials: [
      "100% Water-repellent Egyptian Cotton Gabardine",
      "Viscose Bemberg interior lining",
      "Natural horn button hardware"
    ],
    careInstructions: [
      "Dry clean only (perchloroethylene free)",
      "Cool iron with pressing cloth",
      "Store on contoured wooden hanger"
    ],
    stockCount: 8,
    inStock: true
  },
  {
    id: "prod-002",
    name: "Artisanal Relaxed Linen Shirt",
    tagline: "Garment-washed French flax linen with chest patch pocket",
    category: "men",
    collection: "Summer Essentials",
    price: 125,
    originalPrice: null,
    rating: 4.8,
    reviewsCount: 114,
    isNew: true,
    isBestseller: false,
    badge: "New Season",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Olive Green", hex: "#5b6b44" },
      { name: "Natural Ecru", hex: "#e7e2d7" },
      { name: "Dusk Navy", hex: "#2b3547" }
    ],
    primaryImage: "uploads/linen-shirt.jpg",
    gallery: [
      "uploads/linen-shirt.jpg",
      "uploads/hero-lookbook.jpg"
    ],
    description: "Woven in Normandy from long-staple flax and enzyme washed for an ultra-soft hand feel from day one. Features an unstructured camp collar, mother-of-pearl buttons, and a curved hem tailored for both tucked and untucked styling.",
    materials: [
      "100% Certified French Flax Linen",
      "Sustainably sourced Mother-of-Pearl buttons",
      "Reinforced single-needle tailoring"
    ],
    careInstructions: [
      "Machine wash cold on gentle cycle",
      "Hang dry in shade to maintain natural fiber loft",
      "Steam or embrace authentic lived-in wrinkles"
    ],
    stockCount: 14,
    inStock: true
  },
  {
    id: "prod-003",
    name: "Ribbed Mongolian Cashmere Sweater",
    tagline: "Grade-A pure cashmere with chunky fisherman rib knit",
    category: "unisex",
    collection: "Winter Heritage",
    price: 210,
    originalPrice: 245,
    rating: 5.0,
    reviewsCount: 64,
    isNew: false,
    isBestseller: true,
    badge: "Must-Have",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Cream White", hex: "#f5f3ec" },
      { name: "Charcoal Heather", hex: "#3b3d40" },
      { name: "Caramel", hex: "#a47148" }
    ],
    primaryImage: "uploads/cashmere-knit.jpg",
    gallery: [
      "uploads/cashmere-knit.jpg",
      "uploads/hero-lookbook.jpg"
    ],
    description: "Spun from 100% inner Mongolian cashmere fleece with an average micron count of 15.2um. Offers unparalleled cloud-like warmth without heaviness, finished with ribbed crew collar and turn-back cuffs.",
    materials: [
      "100% Grade-A Pure Mongolian Cashmere",
      "2-ply twisted combed yarn for anti-pilling longevity",
      "Zero synthetic dyes or harsh bleach"
    ],
    careInstructions: [
      "Hand wash cold with gentle wool detergent",
      "Do not wring; dry flat on clean towel",
      "Store folded with cedar blocks"
    ],
    stockCount: 4,
    inStock: true
  },
  {
    id: "prod-004",
    name: "Emerald Silk Cowl-Neck Slip Dress",
    tagline: "Heavy 22-momme Mulberry silk with bias-cut fluid drape",
    category: "women",
    collection: "Evening Capsule",
    price: 185,
    originalPrice: 220,
    rating: 4.9,
    reviewsCount: 52,
    isNew: false,
    isBestseller: true,
    badge: "Sale",
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Emerald Green", hex: "#1c5139" },
      { name: "Champagne Pearl", hex: "#f0e6d6" },
      { name: "Obsidian Black", hex: "#151515" }
    ],
    primaryImage: "uploads/silk-dress.jpg",
    gallery: [
      "uploads/silk-dress.jpg",
      "uploads/hero-lookbook.jpg"
    ],
    description: "Cut on the bias to hug and accentuate the natural silhouette with liquid fluidity. Features delicate adjustable French-bound straps, an elegant draped cowl neckline, and a subtle side slit for movement.",
    materials: [
      "100% Grade 6A Pure Mulberry Silk (22 Momme)",
      "Hypoallergenic OEKO-TEX Standard 100 certified",
      "Concealed Japanese YKK side zipper"
    ],
    careInstructions: [
      "Dry clean or hand wash in lukewarm water with silk wash",
      "Lay flat to dry out of direct sunlight",
      "Low temperature iron inside out while damp"
    ],
    stockCount: 6,
    inStock: true
  },
  {
    id: "prod-005",
    name: "Tuscan Vegetable-Tanned Leather Tote",
    tagline: "Hand-finished full-grain leather with brass hardware",
    category: "accessories",
    collection: "Artisan Leather",
    price: 240,
    originalPrice: null,
    rating: 4.9,
    reviewsCount: 97,
    isNew: true,
    isBestseller: false,
    badge: "Handcrafted",
    sizes: ["One Size"],
    colors: [
      { name: "Saddle Tan", hex: "#b87843" },
      { name: "Espresso", hex: "#3e271a" },
      { name: "Onyx", hex: "#1a1a1a" }
    ],
    primaryImage: "uploads/leather-tote.jpg",
    gallery: [
      "uploads/leather-tote.jpg"
    ],
    description: "Handcrafted in Florence using traditional vegetable tanning methods that allow the leather to develop a rich, one-of-a-kind patina over time. Accommodates up to a 16-inch laptop with reinforced bottom gussets and an internal zip pocket.",
    materials: [
      "100% Italian Full-Grain Cowhide Leather",
      "Solid cast brushed brass hardware",
      "Unlined suede interior with leather pocket"
    ],
    careInstructions: [
      "Condition every 6 months with natural beeswax leather cream",
      "Avoid prolonged exposure to torrential rain",
      "Store in included cotton dust bag"
    ],
    stockCount: 11,
    inStock: true
  },
  {
    id: "prod-006",
    name: "Architectural Tailored Wool Trousers",
    tagline: "High-waist wide-leg silhouette in Italian tropical wool",
    category: "unisex",
    collection: "Modern Tailoring",
    price: 175,
    originalPrice: 200,
    rating: 4.8,
    reviewsCount: 41,
    isNew: true,
    isBestseller: false,
    badge: "Sale",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal Melange", hex: "#d5cdc0" },
      { name: "Charcoal Pinstripe", hex: "#44464a" },
      { name: "Deep Navy", hex: "#1d2330" }
    ],
    primaryImage: "uploads/trench-coat.jpg",
    gallery: [
      "uploads/trench-coat.jpg",
      "uploads/hero-lookbook.jpg"
    ],
    description: "Engineered with double front pleats, hidden slant pockets, and an interior curtain waistband for unmatched structure. The fluid drape moves effortlessly between boardroom and weekend dinners.",
    materials: [
      "98% Super 120s Virgin Wool, 2% Elastane for comfort stretch",
      "Bemberg cupro pocket lining",
      "Mother-of-pearl internal anchor buttons"
    ],
    careInstructions: [
      "Dry clean recommended",
      "Steam between wears to release wrinkles",
      "Hang with clamp hangers by the hem"
    ],
    stockCount: 9,
    inStock: true
  }
];

if (typeof window !== "undefined") {
  window.AP_INITIAL_PRODUCTS = initialProducts;
  window.AURA_INITIAL_PRODUCTS = initialProducts;
}
