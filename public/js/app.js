/**
 * AP Mart - Main Application UI Controller
 * Manages product rendering, filtering, quick-view modal, offcanvas cart, wishlist & checkout
 */
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const productsGrid = document.getElementById("productsGrid");
  const productCountLabel = document.getElementById("productCountLabel");
  const categoryPills = document.querySelectorAll(".category-pill");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const priceRangeInput = document.getElementById("priceRangeInput");
  const priceRangeVal = document.getElementById("priceRangeVal");
  const sizeFilterBtns = document.querySelectorAll(".size-filter-btn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  // Cart & Wishlist Badges & Elements
  const cartBadge = document.getElementById("cartBadge");
  const wishlistBadge = document.getElementById("wishlistBadge");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartSubtotalEl = document.getElementById("cartSubtotal");
  const cartDiscountRow = document.getElementById("cartDiscountRow");
  const cartDiscountEl = document.getElementById("cartDiscount");
  const cartShippingEl = document.getElementById("cartShipping");
  const cartTotalEl = document.getElementById("cartTotal");
  const freeShippingText = document.getElementById("freeShippingText");
  const freeShippingBar = document.getElementById("freeShippingBar");
  const promoCodeInput = document.getElementById("promoCodeInput");
  const applyPromoBtn = document.getElementById("applyPromoBtn");
  const activePromoTag = document.getElementById("activePromoTag");
  const activePromoLabel = document.getElementById("activePromoLabel");
  const removePromoBtn = document.getElementById("removePromoBtn");

  // Quick View Modal Elements
  const quickViewModalEl = document.getElementById("quickViewModal");
  const quickViewModal = quickViewModalEl ? new bootstrap.Modal(quickViewModalEl) : null;
  const qvImage = document.getElementById("qvImage");
  const qvTitle = document.getElementById("qvTitle");
  const qvTagline = document.getElementById("qvTagline");
  const qvPrice = document.getElementById("qvPrice");
  const qvOriginalPrice = document.getElementById("qvOriginalPrice");
  const qvStockBadge = document.getElementById("qvStockBadge");
  const qvDescription = document.getElementById("qvDescription");
  const qvMaterialsList = document.getElementById("qvMaterialsList");
  const qvCareList = document.getElementById("qvCareList");
  const qvSizeSelector = document.getElementById("qvSizeSelector");
  const qvColorSelector = document.getElementById("qvColorSelector");
  const qvQtyInput = document.getElementById("qvQtyInput");
  const qvQtyMinus = document.getElementById("qvQtyMinus");
  const qvQtyPlus = document.getElementById("qvQtyPlus");
  const qvAddToCartBtn = document.getElementById("qvAddToCartBtn");

  // Wishlist Elements
  const wishlistItemsList = document.getElementById("wishlistItemsList");

  // Checkout Modal Elements
  const checkoutModalEl = document.getElementById("checkoutModal");
  const checkoutModal = checkoutModalEl ? new bootstrap.Modal(checkoutModalEl) : null;
  const checkoutCartDrawerBtn = document.getElementById("checkoutCartDrawerBtn");
  const checkoutStep1 = document.getElementById("checkoutStep1");
  const checkoutStep2 = document.getElementById("checkoutStep2");
  const checkoutStep3 = document.getElementById("checkoutStep3");
  const stepNode1 = document.getElementById("stepNode1");
  const stepNode2 = document.getElementById("stepNode2");
  const stepNode3 = document.getElementById("stepNode3");
  const toStep2Btn = document.getElementById("toStep2Btn");
  const backToStep1Btn = document.getElementById("backToStep1Btn");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const confirmedOrderId = document.getElementById("confirmedOrderId");
  const confirmedDelivery = document.getElementById("confirmedDelivery");
  const confirmedTotal = document.getElementById("confirmedTotal");
  const checkoutSubtotalEl = document.getElementById("checkoutSubtotal");
  const checkoutTotalEl = document.getElementById("checkoutTotal");

  // State Management
  let currentFilters = {
    category: "all",
    search: "",
    sortBy: "featured",
    maxPrice: 400,
    size: "all"
  };

  let activeModalProduct = null;
  let selectedModalSize = null;
  let selectedModalColor = null;

  // Initialize
  initApp();

  async function initApp() {
    setupEventListeners();
    updateCartUI();
    updateWishlistUI();
    await renderProducts();
  }

  function setupEventListeners() {
    // Category pills click
    categoryPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        categoryPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        currentFilters.category = pill.dataset.category;
        renderProducts();
      });
    });

    // Search bar
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentFilters.search = e.target.value;
          renderProducts();
        }, 200);
      });
    }

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentFilters.sortBy = e.target.value;
        renderProducts();
      });
    }

    // Price range slider
    if (priceRangeInput) {
      priceRangeInput.addEventListener("input", (e) => {
        const val = e.target.value;
        currentFilters.maxPrice = val;
        if (priceRangeVal) priceRangeVal.textContent = `$${val}`;
        renderProducts();
      });
    }

    // Size filter buttons
    sizeFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        sizeFilterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilters.size = btn.dataset.size;
        renderProducts();
      });
    });

    // Clear filters
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        currentFilters = {
          category: "all",
          search: "",
          sortBy: "featured",
          maxPrice: 400,
          size: "all"
        };
        if (searchInput) searchInput.value = "";
        if (sortSelect) sortSelect.value = "featured";
        if (priceRangeInput) priceRangeInput.value = 400;
        if (priceRangeVal) priceRangeVal.textContent = "$400";
        categoryPills.forEach((p) => p.classList.toggle("active", p.dataset.category === "all"));
        sizeFilterBtns.forEach((b) => b.classList.toggle("active", b.dataset.size === "all"));
        renderProducts();
      });
    }

    // Listen to custom cart & wishlist events
    window.addEventListener("aura:cartUpdated", () => {
      updateCartUI();
    });

    window.addEventListener("aura:wishlistUpdated", () => {
      updateWishlistUI();
      renderProducts(); // re-render to update heart buttons
    });

    // Promo code apply
    if (applyPromoBtn) {
      applyPromoBtn.addEventListener("click", async () => {
        const code = promoCodeInput.value;
        if (!code) return;
        applyPromoBtn.disabled = true;
        applyPromoBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        const res = await window.AURA_CART.applyPromoCode(code);
        applyPromoBtn.disabled = false;
        applyPromoBtn.textContent = "Apply";

        if (res.success) {
          showToast(`Promo "${res.promo.description || code}" applied!`, "success");
          promoCodeInput.value = "";
        } else {
          showToast(res.error, "danger");
        }
      });
    }

    if (removePromoBtn) {
      removePromoBtn.addEventListener("click", () => {
        window.AURA_CART.removePromoCode();
        showToast("Promo code removed", "info");
      });
    }

    // Quick View Modal Quantity Controls
    if (qvQtyMinus) {
      qvQtyMinus.addEventListener("click", () => {
        let val = parseInt(qvQtyInput.value, 10) || 1;
        if (val > 1) qvQtyInput.value = val - 1;
      });
    }

    if (qvQtyPlus) {
      qvQtyPlus.addEventListener("click", () => {
        let val = parseInt(qvQtyInput.value, 10) || 1;
        if (val < (activeModalProduct?.stockCount || 10)) {
          qvQtyInput.value = val + 1;
        }
      });
    }

    // Add to Bag from Modal
    if (qvAddToCartBtn) {
      qvAddToCartBtn.addEventListener("click", () => {
        if (!activeModalProduct) return;
        const qty = parseInt(qvQtyInput.value, 10) || 1;
        window.AURA_CART.addItem(activeModalProduct, selectedModalSize, selectedModalColor, qty);
        showToast(`Added ${activeModalProduct.name} (${selectedModalSize}) to bag!`, "success");
        if (quickViewModal) quickViewModal.hide();

        // Open offcanvas cart
        const cartDrawerEl = document.getElementById("cartOffcanvas");
        if (cartDrawerEl) {
          const bsDrawer = bootstrap.Offcanvas.getInstance(cartDrawerEl) || new bootstrap.Offcanvas(cartDrawerEl);
          bsDrawer.show();
        }
      });
    }

    // Checkout Flow Modal Trigger
    if (checkoutCartDrawerBtn) {
      checkoutCartDrawerBtn.addEventListener("click", () => {
        const cartItems = window.AURA_CART.getCart();
        if (cartItems.length === 0) {
          showToast("Your cart is empty!", "warning");
          return;
        }
        // Close cart offcanvas
        const cartDrawerEl = document.getElementById("cartOffcanvas");
        if (cartDrawerEl) {
          const bsDrawer = bootstrap.Offcanvas.getInstance(cartDrawerEl);
          if (bsDrawer) bsDrawer.hide();
        }

        openCheckoutModal();
      });
    }

    // Checkout Step Transitions
    if (toStep2Btn) {
      toStep2Btn.addEventListener("click", (e) => {
        e.preventDefault();
        const form = document.getElementById("shippingForm");
        if (form && !form.checkValidity()) {
          form.reportValidity();
          return;
        }
        setCheckoutStep(2);
      });
    }

    if (backToStep1Btn) {
      backToStep1Btn.addEventListener("click", () => {
        setCheckoutStep(1);
      });
    }

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        const paymentForm = document.getElementById("paymentForm");
        if (paymentForm && !paymentForm.checkValidity()) {
          paymentForm.reportValidity();
          return;
        }

        placeOrderBtn.disabled = true;
        placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Securing Order...';

        const summary = window.AURA_CART.getSummary();
        const cart = window.AURA_CART.getCart();

        const orderData = {
          items: cart,
          total: summary.total,
          shipping: summary.shipping,
          discount: summary.discount,
          shippingAddress: {
            name: document.getElementById("shipName")?.value || "Guest",
            address: document.getElementById("shipAddress")?.value || "123 Fashion Blvd",
            city: document.getElementById("shipCity")?.value || "Metropolis",
            zip: document.getElementById("shipZip")?.value || "10001"
          }
        };

        const result = await window.AURA_API.submitOrder(orderData);

        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "Place Order";

        if (result.success) {
          confirmedOrderId.textContent = result.data.orderId;
          confirmedDelivery.textContent = result.data.estimatedDelivery;
          confirmedTotal.textContent = `$${summary.total}`;
          setCheckoutStep(3);
          window.AURA_CART.clearCart();
        } else {
          showToast("Failed to place order. Please try again.", "danger");
        }
      });
    }
  }

  /**
   * Render products into the catalog grid
   */
  async function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-secondary" role="status">
          <span class="visually-hidden">Loading catalog...</span>
        </div>
      </div>
    `;

    const res = await window.AURA_API.getProducts(currentFilters);
    const products = res.data || [];

    if (productCountLabel) {
      productCountLabel.textContent = `Showing ${products.length} design${products.length === 1 ? "" : "s"}`;
    }

    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-search text-muted display-4"></i>
          <h4 class="mt-3 font-serif">No garments match your filters</h4>
          <p class="text-muted">Try adjusting your category, price range, or clearing search terms.</p>
          <button class="btn btn-aura-outline btn-sm mt-2" onclick="document.getElementById('clearFiltersBtn').click()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = products
      .map((p) => {
        const isWish = window.AURA_CART.isInWishlist(p.id);
        const badgeClass = p.badge === "Bestseller" ? "badge-bestseller" : p.badge === "Sale" ? "badge-sale" : "badge-new";

        return `
        <div class="col-sm-6 col-lg-4 mb-4">
          <div class="product-card">
            <div class="product-image-wrapper">
              ${p.badge ? `<span class="product-badge ${badgeClass}">${p.badge}</span>` : ""}
              <button class="btn-wishlist-toggle ${isWish ? "active" : ""}" data-product-id="${p.id}" title="${isWish ? "Remove from wishlist" : "Save to wishlist"}">
                <i class="bi ${isWish ? "bi-heart-fill" : "bi-heart"}"></i>
              </button>
              <img src="${p.primaryImage}" alt="${p.name}" loading="lazy" />
              <div class="card-quick-actions">
                <button class="btn btn-light btn-sm flex-grow-1 font-weight-bold btn-quick-view" data-product-id="${p.id}">
                  <i class="bi bi-eye me-1"></i> Quick View
                </button>
                <button class="btn btn-dark btn-sm btn-quick-add" data-product-id="${p.id}" title="Quick Add">
                  <i class="bi bi-bag-plus"></i>
                </button>
              </div>
            </div>
            <div class="product-info">
              <span class="product-category-label">${p.collection || p.category}</span>
              <h3 class="product-title">${p.name}</h3>
              <div class="d-flex align-items-center justify-content-between mt-auto">
                <div class="product-price">
                  $${p.price}
                  ${p.originalPrice ? `<span class="original-price">$${p.originalPrice}</span>` : ""}
                </div>
                <div class="small text-muted">
                  <i class="bi bi-star-fill text-warning"></i> ${p.rating} (${p.reviewsCount})
                </div>
              </div>
              <div class="color-swatch-list">
                ${(p.colors || [])
                  .map((c) => `<span class="swatch-dot" style="background-color: ${c.hex};" title="${c.name}"></span>`)
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // Bind card action buttons
    productsGrid.querySelectorAll(".btn-quick-view").forEach((btn) => {
      btn.addEventListener("click", () => openQuickView(btn.dataset.productId));
    });

    productsGrid.querySelectorAll(".btn-quick-add").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const prod = products.find((p) => p.id === btn.dataset.productId);
        if (prod) {
          window.AURA_CART.addItem(prod);
          showToast(`Added ${prod.name} to bag`, "success");
        }
      });
    });

    productsGrid.querySelectorAll(".btn-wishlist-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.productId;
        const added = window.AURA_CART.toggleWishlist(id);
        btn.classList.toggle("active", added);
        const icon = btn.querySelector("i");
        if (icon) {
          icon.className = added ? "bi bi-heart-fill" : "bi bi-heart";
        }
        showToast(added ? "Added to wishlist" : "Removed from wishlist", "info");
      });
    });
  }

  /**
   * Open Quick-View Modal
   */
  async function openQuickView(productId) {
    const res = await window.AURA_API.getProductById(productId);
    if (!res.success) return;

    const prod = res.data;
    activeModalProduct = prod;
    selectedModalSize = prod.sizes[0];
    selectedModalColor = prod.colors[0]?.name;

    qvImage.src = prod.primaryImage;
    qvTitle.textContent = prod.name;
    qvTagline.textContent = prod.tagline || "";
    qvPrice.textContent = `$${prod.price}`;
    if (prod.originalPrice) {
      qvOriginalPrice.textContent = `$${prod.originalPrice}`;
      qvOriginalPrice.classList.remove("d-none");
    } else {
      qvOriginalPrice.classList.add("d-none");
    }

    qvStockBadge.textContent = prod.stockCount <= 5 ? `Low Stock: Only ${prod.stockCount} left` : "In Stock & Ready to Ship";
    qvStockBadge.className = prod.stockCount <= 5 ? "badge bg-warning text-dark" : "badge bg-success";

    qvDescription.textContent = prod.description;

    qvMaterialsList.innerHTML = (prod.materials || []).map((m) => `<li>${m}</li>`).join("");
    qvCareList.innerHTML = (prod.careInstructions || []).map((c) => `<li>${c}</li>`).join("");

    // Render sizes
    qvSizeSelector.innerHTML = prod.sizes
      .map(
        (s, idx) => `
        <button type="button" class="size-chip ${idx === 0 ? "active" : ""}" data-size="${s}">${s}</button>
      `
      )
      .join("");

    qvSizeSelector.querySelectorAll(".size-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        qvSizeSelector.querySelectorAll(".size-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        selectedModalSize = chip.dataset.size;
      });
    });

    // Render colors
    qvColorSelector.innerHTML = prod.colors
      .map(
        (c, idx) => `
        <button type="button" class="swatch-dot p-0 ${idx === 0 ? "ring-active" : ""}" style="background-color: ${c.hex}; width: 22px; height: 22px;" title="${c.name}" data-color="${c.name}"></button>
      `
      )
      .join("");

    qvColorSelector.querySelectorAll(".swatch-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        qvColorSelector.querySelectorAll(".swatch-dot").forEach((d) => (d.style.outline = "none"));
        dot.style.outline = "2px solid var(--aura-charcoal)";
        dot.style.outlineOffset = "2px";
        selectedModalColor = dot.dataset.color;
      });
    });

    qvQtyInput.value = 1;
    if (quickViewModal) quickViewModal.show();
  }

  /**
   * Update Cart UI components
   */
  function updateCartUI() {
    const cart = window.AURA_CART.getCart();
    const summary = window.AURA_CART.getSummary();

    // Update navbar badges
    if (cartBadge) {
      cartBadge.textContent = summary.itemCount;
      cartBadge.classList.toggle("d-none", summary.itemCount === 0);
    }

    // Free shipping tracker
    if (freeShippingText && freeShippingBar) {
      if (summary.isFreeShipping) {
        freeShippingText.innerHTML = '<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>You unlocked Complimentary Express Shipping!</span>';
        freeShippingBar.style.width = "100%";
      } else {
        freeShippingText.innerHTML = `Add <strong>$${summary.amountForFreeShipping}</strong> more to unlock <strong>Free Express Shipping</strong>`;
        freeShippingBar.style.width = `${summary.freeShippingPercent}%`;
      }
    }

    // Active Promo Tag
    if (activePromoTag && activePromoLabel) {
      if (summary.activePromo) {
        activePromoTag.classList.remove("d-none");
        activePromoLabel.textContent = `Promo: ${summary.activePromo.description || "Active"}`;
      } else {
        activePromoTag.classList.add("d-none");
      }
    }

    // Render Cart Item Rows
    if (cartItemsList) {
      if (cart.length === 0) {
        cartItemsList.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-bag text-muted display-4"></i>
            <h5 class="mt-3 font-serif">Your shopping bag is empty</h5>
            <p class="text-muted small">Explore our curated collections and add your favorite garments.</p>
          </div>
        `;
      } else {
        cartItemsList.innerHTML = cart
          .map((item) => {
            return `
            <div class="cart-item-row">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start">
                  <h6 class="font-serif mb-1">${item.name}</h6>
                  <button class="btn btn-sm text-danger p-0 ms-2 btn-remove-item" data-id="${item.cartItemId}">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="small text-muted mb-2">Size: ${item.size} | Color: ${item.color}</div>
                <div class="d-flex justify-content-between align-items-center">
                  <div class="quantity-control">
                    <button class="btn-qty-minus" data-id="${item.cartItemId}">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty-plus" data-id="${item.cartItemId}">+</button>
                  </div>
                  <div class="fw-bold">$${item.price * item.quantity}</div>
                </div>
              </div>
            </div>
          `;
          })
          .join("");

        // Quantity and removal bindings
        cartItemsList.querySelectorAll(".btn-remove-item").forEach((b) => {
          b.addEventListener("click", () => window.AURA_CART.removeItem(b.dataset.id));
        });
        cartItemsList.querySelectorAll(".btn-qty-minus").forEach((b) => {
          b.addEventListener("click", () => window.AURA_CART.updateQuantity(b.dataset.id, -1));
        });
        cartItemsList.querySelectorAll(".btn-qty-plus").forEach((b) => {
          b.addEventListener("click", () => window.AURA_CART.updateQuantity(b.dataset.id, 1));
        });
      }
    }

    // Update Totals
    if (cartSubtotalEl) cartSubtotalEl.textContent = `$${summary.subtotal}`;
    if (cartShippingEl) cartShippingEl.textContent = summary.shipping === 0 ? "FREE" : `$${summary.shipping}`;
    if (cartTotalEl) cartTotalEl.textContent = `$${summary.total}`;

    if (cartDiscountRow && cartDiscountEl) {
      if (summary.discount > 0) {
        cartDiscountRow.classList.remove("d-none");
        cartDiscountEl.textContent = `-$${summary.discount}`;
      } else {
        cartDiscountRow.classList.add("d-none");
      }
    }
  }

  /**
   * Update Wishlist UI
   */
  async function updateWishlistUI() {
    const wishlistIds = window.AURA_CART.getWishlist();
    if (wishlistBadge) {
      wishlistBadge.textContent = wishlistIds.length;
      wishlistBadge.classList.toggle("d-none", wishlistIds.length === 0);
    }

    if (!wishlistItemsList) return;

    if (wishlistIds.length === 0) {
      wishlistItemsList.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-heart text-muted display-4"></i>
          <h5 class="mt-3 font-serif">No saved favorites yet</h5>
          <p class="text-muted small">Tap the heart icon on any garment to save it here for later.</p>
        </div>
      `;
      return;
    }

    const res = await window.AURA_API.getProducts();
    const allProducts = res.data || [];
    const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

    wishlistItemsList.innerHTML = wishlistProducts
      .map(
        (p) => `
        <div class="cart-item-row align-items-center">
          <img src="${p.primaryImage}" alt="${p.name}" class="cart-item-img" />
          <div class="flex-grow-1">
            <h6 class="font-serif mb-1">${p.name}</h6>
            <div class="fw-bold mb-2">$${p.price}</div>
            <div class="d-flex gap-2">
              <button class="btn btn-dark btn-sm btn-move-to-cart" data-id="${p.id}">
                <i class="bi bi-bag-plus me-1"></i> Add to Bag
              </button>
              <button class="btn btn-outline-danger btn-sm btn-remove-wishlist" data-id="${p.id}">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    wishlistItemsList.querySelectorAll(".btn-move-to-cart").forEach((b) => {
      b.addEventListener("click", () => {
        const prod = wishlistProducts.find((p) => p.id === b.dataset.id);
        if (prod) {
          window.AURA_CART.addItem(prod);
          window.AURA_CART.toggleWishlist(prod.id);
          showToast(`Moved ${prod.name} to bag!`, "success");
        }
      });
    });

    wishlistItemsList.querySelectorAll(".btn-remove-wishlist").forEach((b) => {
      b.addEventListener("click", () => {
        window.AURA_CART.toggleWishlist(b.dataset.id);
      });
    });
  }

  /**
   * Checkout Stepper Management
   */
  function openCheckoutModal() {
    const summary = window.AURA_CART.getSummary();
    if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `$${summary.subtotal}`;
    if (checkoutTotalEl) checkoutTotalEl.textContent = `$${summary.total}`;
    setCheckoutStep(1);
    if (checkoutModal) checkoutModal.show();
  }

  function setCheckoutStep(step) {
    if (checkoutStep1) checkoutStep1.classList.toggle("d-none", step !== 1);
    if (checkoutStep2) checkoutStep2.classList.toggle("d-none", step !== 2);
    if (checkoutStep3) checkoutStep3.classList.toggle("d-none", step !== 3);

    // Update Stepper Nodes
    [stepNode1, stepNode2, stepNode3].forEach((node, idx) => {
      if (!node) return;
      const nodeStep = idx + 1;
      node.classList.toggle("active", nodeStep === step);
      node.classList.toggle("completed", nodeStep < step);
    });
  }

  /**
   * Toast notification helper
   */
  function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container-custom");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container-custom";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `aura-toast border-start border-4 ${
      type === "success" ? "border-success" : type === "danger" ? "border-danger" : "border-warning"
    }`;
    toast.innerHTML = `
      <i class="bi ${
        type === "success" ? "bi-check-circle" : type === "danger" ? "bi-exclamation-circle" : "bi-info-circle"
      }"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
});
