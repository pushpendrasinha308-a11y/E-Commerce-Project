/**
 * AP Mart - Decoupled API Client Service
 * Bridges the Frontend UI and Backend Express REST services + SQLite3.
 * Phase 2: Live Express REST API integration with graceful offline fallback.
 */
const API = (() => {
  const USE_REMOTE_BACKEND = true; // Live Express & SQLite3 backend connected
  const BASE_URL = window.location.origin;

  // Initialize local memory store from initial products for fallback
  let localProducts = [...(window.AP_INITIAL_PRODUCTS || window.AURA_INITIAL_PRODUCTS || [])];

  // Helper for simulating async API response delay
  const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

  return {
    /**
     * Fetch all products with optional filtering and sorting
     */
    async getProducts(params = {}) {
      if (USE_REMOTE_BACKEND) {
        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`${BASE_URL}/api/products?${query}`);
          if (res.ok) {
            return await res.json();
          }
        } catch (err) {
          console.warn("Backend not reached, falling back to client dataset:", err);
        }
      }

      await delay(80);
      let list = [...localProducts];

      // Filter by category
      if (params.category && params.category !== "all") {
        list = list.filter((p) => p.category.toLowerCase() === params.category.toLowerCase());
      }

      // Filter by search query
      if (params.search && params.search.trim() !== "") {
        const q = params.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tagline.toLowerCase().includes(q) ||
            p.collection.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
      }

      // Filter by size
      if (params.size && params.size !== "all") {
        list = list.filter((p) => p.sizes.includes(params.size));
      }

      // Filter by max price
      if (params.maxPrice) {
        list = list.filter((p) => p.price <= Number(params.maxPrice));
      }

      // Sorting
      if (params.sortBy) {
        switch (params.sortBy) {
          case "price-asc":
            list.sort((a, b) => a.price - b.price);
            break;
          case "price-desc":
            list.sort((a, b) => b.price - a.price);
            break;
          case "rating":
            list.sort((a, b) => b.rating - a.rating);
            break;
          case "newest":
            list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
            break;
          default:
            break;
        }
      }

      return {
        success: true,
        count: list.length,
        data: list
      };
    },

    /**
     * Fetch single product by ID
     */
    async getProductById(id) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/products/${id}`);
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Falling back to local product lookup:", err);
        }
      }

      await delay(60);
      const product = localProducts.find((p) => p.id === id);
      if (!product) {
        return { success: false, error: "Product not found" };
      }
      return { success: true, data: product };
    },

    /**
     * Validate coupon/promo code
     */
    async validatePromoCode(code) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/promo/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
          });
          const data = await res.json();
          if (res.ok && data.success) return data;
          return { success: false, error: data.error || "Invalid promo code" };
        } catch (err) {
          console.warn("Backend promo validation failed, checking fallback:", err);
        }
      }

      await delay(100);
      const cleanCode = (code || "").trim().toUpperCase();
      const validCodes = {
        AP10: { discountPercent: 10, description: "10% off your entire order" },
        AP20: { discountPercent: 20, description: "20% VIP seasonal discount" },
        AURA10: { discountPercent: 10, description: "10% off your entire order" },
        VOGUE20: { discountPercent: 20, description: "20% VIP seasonal discount" },
        FREESHIP: { freeShipping: true, description: "Free express shipping unlocked" }
      };

      if (validCodes[cleanCode]) {
        return { success: true, promo: validCodes[cleanCode], code: cleanCode };
      }
      return { success: false, error: "Invalid promo code. Try 'AP10' or 'AP20'" };
    },

    /**
     * Submit simulated order to Express REST API & SQLite
     */
    async submitOrder(orderPayload) {
      let createdOrder = null;

      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
          });
          if (res.ok) {
            const json = await res.json();
            createdOrder = { ...orderPayload, ...json.data };
          }
        } catch (err) {
          console.warn("Backend order submission failed, processing in mock mode:", err);
        }
      }

      if (!createdOrder) {
        await delay(500);
        const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
        createdOrder = {
          orderId,
          createdAt: new Date().toISOString(),
          status: "Confirmed",
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
          }),
          trackingNumber: "AP-EXP-" + Math.floor(100000 + Math.random() * 900000),
          ...orderPayload
        };
      }

      // Sync with localStorage for instantaneous client UI refresh
      const history = JSON.parse(localStorage.getItem("ap_orders") || "[]");
      history.unshift(createdOrder);
      localStorage.setItem("ap_orders", JSON.stringify(history));

      return { success: true, data: createdOrder };
    },

    /**
     * Fetch orders from Express REST backend
     */
    async getOrders() {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/orders`);
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Could not fetch remote orders, using local storage:", err);
        }
      }
      const local = JSON.parse(localStorage.getItem("ap_orders") || "[]");
      return { success: true, data: local };
    },

    /**
     * User profile methods
     */
    async getProfile() {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/profile`);
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Falling back to local profile:", err);
        }
      }
      const local = JSON.parse(localStorage.getItem("ap_user_profile") || "null");
      return { success: true, data: local };
    },

    async updateProfile(profileData) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Could not save to remote profile:", err);
        }
      }
      return { success: true };
    },

    async addAddress(addr) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/profile/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addr)
          });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Could not add address remotely:", err);
        }
      }
      return { success: true, data: { id: "addr-" + Date.now(), ...addr } };
    },

    async deleteAddress(id) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/profile/addresses/${id}`, { method: "DELETE" });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Could not delete remote address:", err);
        }
      }
      return { success: true };
    },

    async setDefaultAddress(id) {
      if (USE_REMOTE_BACKEND) {
        try {
          const res = await fetch(`${BASE_URL}/api/profile/addresses/${id}/default`, { method: "PUT" });
          if (res.ok) return await res.json();
        } catch (err) {
          console.warn("Could not set default address remotely:", err);
        }
      }
      return { success: true };
    }
  };
})();

if (typeof window !== "undefined") {
  window.AP_API = API;
  window.AURA_API = API;
}
