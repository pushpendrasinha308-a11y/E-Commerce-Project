/**
 * AP Mart - Cart & Wishlist State Management
 * Persistent localStorage storage with event-driven architecture
 */
const CartService = (() => {
  const CART_KEY = "aura_cart_items";
  const WISHLIST_KEY = "aura_wishlist_ids";
  const PROMO_KEY = "aura_active_promo";
  const FREE_SHIPPING_THRESHOLD = 150;
  const STANDARD_SHIPPING_FEE = 15;

  let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  let activePromo = JSON.parse(localStorage.getItem(PROMO_KEY) || "null");

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("ap:cartUpdated", { detail: { cart, summary: getSummary() } }));
    window.dispatchEvent(new CustomEvent("aura:cartUpdated", { detail: { cart, summary: getSummary() } }));
  }

  function saveWishlist() {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent("ap:wishlistUpdated", { detail: { wishlist } }));
    window.dispatchEvent(new CustomEvent("aura:wishlistUpdated", { detail: { wishlist } }));
  }

  function savePromo() {
    localStorage.setItem(PROMO_KEY, JSON.stringify(activePromo));
    window.dispatchEvent(new CustomEvent("ap:cartUpdated", { detail: { cart, summary: getSummary() } }));
    window.dispatchEvent(new CustomEvent("aura:cartUpdated", { detail: { cart, summary: getSummary() } }));
  }

  function getSummary() {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    let discount = 0;

    if (activePromo && activePromo.discountPercent) {
      discount = Math.round((subtotal * activePromo.discountPercent) / 100);
    }

    const isFreeShipping =
      subtotal >= FREE_SHIPPING_THRESHOLD ||
      (activePromo && activePromo.freeShipping) ||
      subtotal === 0;

    const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const total = Math.max(0, subtotal - discount + shipping);

    const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const freeShippingPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    return {
      subtotal,
      discount,
      shipping,
      total,
      isFreeShipping,
      amountForFreeShipping,
      freeShippingPercent,
      activePromo,
      itemCount: cart.reduce((acc, item) => acc + item.quantity, 0)
    };
  }

  return {
    getCart() {
      return [...cart];
    },

    getSummary,

    addItem(product, size, color, quantity = 1) {
      const selectedSize = size || (product.sizes && product.sizes[0]) || "Standard";
      const selectedColor = color || (product.colors && product.colors[0]?.name) || "Default";
      const cartItemId = `${product.id}-${selectedSize}-${selectedColor}`;

      const existingIndex = cart.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.primaryImage,
          size: selectedSize,
          color: selectedColor,
          quantity
        });
      }

      saveCart();
      return true;
    },

    updateQuantity(cartItemId, delta) {
      const item = cart.find((i) => i.cartItemId === cartItemId);
      if (!item) return;

      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter((i) => i.cartItemId !== cartItemId);
      }
      saveCart();
    },

    removeItem(cartItemId) {
      cart = cart.filter((i) => i.cartItemId !== cartItemId);
      saveCart();
    },

    clearCart() {
      cart = [];
      activePromo = null;
      localStorage.removeItem(PROMO_KEY);
      saveCart();
    },

    async applyPromoCode(code) {
      const res = await window.AURA_API.validatePromoCode(code);
      if (res.success) {
        activePromo = res.promo;
        savePromo();
        return { success: true, promo: activePromo };
      }
      return { success: false, error: res.error };
    },

    removePromoCode() {
      activePromo = null;
      localStorage.removeItem(PROMO_KEY);
      savePromo();
    },

    // Wishlist functions
    getWishlist() {
      return [...wishlist];
    },

    isInWishlist(productId) {
      return wishlist.includes(productId);
    },

    toggleWishlist(productId) {
      const index = wishlist.indexOf(productId);
      let added = false;
      if (index > -1) {
        wishlist.splice(index, 1);
        added = false;
      } else {
        wishlist.push(productId);
        added = true;
      }
      saveWishlist();
      return added;
    }
  };
})();

if (typeof window !== "undefined") {
  window.AP_CART = CartService;
  window.AURA_CART = CartService;
}
