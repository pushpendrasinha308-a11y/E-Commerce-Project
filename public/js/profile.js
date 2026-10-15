/**
 * AP Mart - User Profile Controller
 * Manages user profile information, order history sync, addresses, and account settings
 * Integrated with Express REST API & SQLite3 backend
 */
document.addEventListener("DOMContentLoaded", () => {
  const PROFILE_STORAGE_KEY = "ap_user_profile";
  const ORDERS_STORAGE_KEY = "ap_orders";

  // Initial Seed Profile fallback
  const defaultProfile = {
    firstName: "Elena",
    lastName: "Rostova",
    email: "elena@example.com",
    phone: "+1 (555) 234-8901",
    tier: "AP Atelier VIP",
    points: 1450,
    memberSince: "Nov 2024",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    notifications: {
      orderUpdates: true,
      exclusiveDrops: true
    },
    addresses: [
      {
        id: "addr-1",
        type: "Primary Residence",
        name: "Elena Rostova",
        address: "452 Madison Ave, Apt 12B",
        city: "New York",
        zip: "10022",
        country: "United States",
        isDefault: true
      },
      {
        id: "addr-2",
        type: "Hamptons Estate",
        name: "Elena Rostova",
        address: "88 Ocean Drive",
        city: "East Hampton",
        zip: "11937",
        country: "United States",
        isDefault: false
      }
    ]
  };

  let profile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)) || defaultProfile;

  // DOM Elements
  const profileNavItems = document.querySelectorAll(".profile-nav-item");
  const tabSections = document.querySelectorAll(".profile-tab-section");

  // Profile Header Elements
  const profileNameEls = document.querySelectorAll(".profile-user-name");
  const profileEmailEls = document.querySelectorAll(".profile-user-email");
  const profileAvatarImg = document.getElementById("profileAvatarImg");
  const profilePointsEl = document.getElementById("profilePoints");
  const profileOrdersCountEl = document.getElementById("profileOrdersCount");

  // Form Elements
  const editProfileForm = document.getElementById("editProfileForm");
  const inputFirstName = document.getElementById("inputFirstName");
  const inputLastName = document.getElementById("inputLastName");
  const inputEmail = document.getElementById("inputEmail");
  const inputPhone = document.getElementById("inputPhone");
  const checkOrderUpdates = document.getElementById("checkOrderUpdates");
  const checkExclusiveDrops = document.getElementById("checkExclusiveDrops");

  // Orders Container
  const ordersListContainer = document.getElementById("ordersListContainer");
  const recentOrdersOverviewContainer = document.getElementById("recentOrdersOverviewContainer");

  // Address Container
  const addressesContainer = document.getElementById("addressesContainer");
  const addAddressForm = document.getElementById("addAddressForm");
  const newAddressModalEl = document.getElementById("newAddressModal");
  const newAddressModal = newAddressModalEl ? new bootstrap.Modal(newAddressModalEl) : null;

  // Cart & Wishlist badges
  const cartBadge = document.getElementById("cartBadge");
  const wishlistBadge = document.getElementById("wishlistBadge");

  // Initialize page
  initProfilePage();

  async function initProfilePage() {
    setupNavigationTabs();

    // Fetch live profile from backend if available
    if (window.AP_API && window.AP_API.getProfile) {
      const res = await window.AP_API.getProfile();
      if (res && res.success && res.data) {
        profile = res.data;
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }
    }

    populateProfileData();
    await renderOrders();
    renderAddresses();
    setupFormHandlers();
    updateCartBadges();

    // Check URL hash for direct tab linking (e.g. #orders)
    if (window.location.hash) {
      const targetTab = window.location.hash.replace("#", "");
      switchTab(targetTab);
    }
  }

  function setupNavigationTabs() {
    profileNavItems.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tabKey = btn.dataset.tab;
        switchTab(tabKey);
      });
    });
  }

  function switchTab(tabKey) {
    profileNavItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabKey);
    });

    tabSections.forEach((section) => {
      section.classList.toggle("d-none", section.id !== `tab-${tabKey}`);
    });

    window.location.hash = tabKey;
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  function populateProfileData() {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();

    profileNameEls.forEach((el) => (el.textContent = fullName));
    profileEmailEls.forEach((el) => (el.textContent = profile.email));

    if (profileAvatarImg && profile.avatar) {
      profileAvatarImg.src = profile.avatar;
    }
    if (profilePointsEl) {
      profilePointsEl.textContent = `${profile.points || 1450} Pts`;
    }

    // Populate Edit Form
    if (inputFirstName) inputFirstName.value = profile.firstName || "";
    if (inputLastName) inputLastName.value = profile.lastName || "";
    if (inputEmail) inputEmail.value = profile.email || "";
    if (inputPhone) inputPhone.value = profile.phone || "";
    if (checkOrderUpdates) checkOrderUpdates.checked = profile.notifications?.orderUpdates !== false;
    if (checkExclusiveDrops) checkExclusiveDrops.checked = profile.notifications?.exclusiveDrops !== false;
  }

  async function renderOrders() {
    let orders = [];

    // Fetch from backend REST API
    if (window.AP_API && window.AP_API.getOrders) {
      const res = await window.AP_API.getOrders();
      if (res && res.success && res.data) {
        orders = res.data;
      }
    }

    if (!orders || orders.length === 0) {
      orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    }

    if (profileOrdersCountEl) {
      profileOrdersCountEl.textContent = orders.length;
    }

    if (!ordersListContainer) return;

    if (orders.length === 0) {
      ordersListContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-box-seam display-4 text-muted"></i>
          <h5 class="font-serif mt-3">No orders yet</h5>
          <p class="text-muted small">When you purchase garments, your orders and tracking details will appear here.</p>
          <a href="index.html#catalogSection" class="btn btn-aura-primary btn-sm mt-2">Explore Collections</a>
        </div>
      `;
      if (recentOrdersOverviewContainer) {
        recentOrdersOverviewContainer.innerHTML = `<p class="text-muted small">No recent orders.</p>`;
      }
      return;
    }

    const orderCardsHTML = orders.map((ord) => createOrderCardHTML(ord)).join("");
    ordersListContainer.innerHTML = orderCardsHTML;

    // Overview recent order (just the first/latest order)
    if (recentOrdersOverviewContainer) {
      recentOrdersOverviewContainer.innerHTML = createOrderCardHTML(orders[0], true);
    }
  }

  function createOrderCardHTML(order, isCompact = false) {
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const statusBadgeClass =
      order.status === "Delivered"
        ? "status-badge-delivered"
        : order.status === "Confirmed"
        ? "status-badge-confirmed"
        : "status-badge-processing";

    const itemsHTML = (order.items || [])
      .map(
        (item) => `
        <div class="d-flex align-items-center gap-3 py-2 border-bottom">
          <img src="${item.image || 'uploads/trench-coat.jpg'}" alt="${item.name}" class="rounded" style="width: 52px; height: 65px; object-fit: cover;" />
          <div class="flex-grow-1">
            <h6 class="font-serif mb-0 fs-6">${item.name}</h6>
            <span class="small text-muted">Qty: ${item.quantity || 1} | Size: ${item.size || "M"} | Color: ${item.color || "Standard"}</span>
          </div>
          <span class="fw-semibold small">$${(item.price || 0) * (item.quantity || 1)}</span>
        </div>
      `
      )
      .join("");

    return `
      <div class="order-card">
        <div class="order-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span class="fw-bold text-dark me-3">${order.orderId}</span>
            <span class="small text-muted">Placed on ${orderDate}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="${statusBadgeClass}">${order.status}</span>
            <span class="fw-bold text-dark ms-2">$${order.total}</span>
          </div>
        </div>
        <div class="order-card-body">
          ${itemsHTML}
          <div class="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-2">
            <div class="small text-muted">
              <i class="bi bi-truck me-1"></i> ${order.estimatedDelivery || "Standard Delivery"}
              ${order.trackingNumber ? `• Tracking: <strong>${order.trackingNumber}</strong>` : ""}
            </div>
            <div class="d-flex gap-2 mt-2 mt-sm-0">
              <button class="btn btn-outline-secondary btn-sm" onclick="alert('Official order receipt has been sent to ${profile.email}');">
                <i class="bi bi-receipt me-1"></i> Receipt
              </button>
              <button class="btn btn-dark btn-sm" onclick="alert('Carrier status: Package in transit with carrier. Estimated delivery on schedule.');">
                Track Shipment
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAddresses() {
    if (!addressesContainer) return;

    addressesContainer.innerHTML = (profile.addresses || [])
      .map(
        (addr) => `
        <div class="col-md-6 mb-3">
          <div class="address-item-card ${addr.isDefault ? "is-default" : ""}">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold mb-0">${addr.type}</h6>
              ${addr.isDefault ? '<span class="badge bg-warning text-dark"><i class="bi bi-check-circle-fill me-1"></i>Default</span>' : ""}
            </div>
            <p class="small text-secondary mb-2 leading-snug">
              <strong>${addr.name}</strong><br />
              ${addr.address}<br />
              ${addr.city}, ${addr.zip}<br />
              ${addr.country}
            </p>
            <div class="d-flex gap-2 pt-2 border-top mt-auto">
              ${
                !addr.isDefault
                  ? `<button class="btn btn-sm btn-link p-0 text-dark fw-semibold text-decoration-none btn-make-default" data-id="${addr.id}">Set as Default</button>`
                  : ""
              }
              ${
                !addr.isDefault
                  ? `<button class="btn btn-sm btn-link p-0 text-danger text-decoration-none ms-auto btn-delete-addr" data-id="${addr.id}"><i class="bi bi-trash"></i> Remove</button>`
                  : ""
              }
            </div>
          </div>
        </div>
      `
      )
      .join("");

    // Bind address buttons
    addressesContainer.querySelectorAll(".btn-make-default").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        profile.addresses.forEach((a) => (a.isDefault = a.id === id));
        if (window.AP_API && window.AP_API.setDefaultAddress) {
          await window.AP_API.setDefaultAddress(id);
        }
        saveProfile("Default shipping address updated");
        renderAddresses();
      });
    });

    addressesContainer.querySelectorAll(".btn-delete-addr").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        profile.addresses = profile.addresses.filter((a) => a.id !== id);
        if (window.AP_API && window.AP_API.deleteAddress) {
          await window.AP_API.deleteAddress(id);
        }
        saveProfile("Address removed");
        renderAddresses();
      });
    });
  }

  function setupFormHandlers() {
    // Edit Profile Info Form
    if (editProfileForm) {
      editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        profile.firstName = inputFirstName.value.trim();
        profile.lastName = inputLastName.value.trim();
        profile.email = inputEmail.value.trim();
        profile.phone = inputPhone.value.trim();
        profile.notifications = {
          orderUpdates: checkOrderUpdates.checked,
          exclusiveDrops: checkExclusiveDrops.checked
        };

        if (window.AP_API && window.AP_API.updateProfile) {
          await window.AP_API.updateProfile(profile);
        }

        saveProfile("Personal details saved to backend!");
        populateProfileData();
      });
    }

    // Add Address Form Modal
    if (addAddressForm) {
      addAddressForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const type = document.getElementById("newAddrType")?.value || "Other";
        const name = document.getElementById("newAddrName")?.value || `${profile.firstName} ${profile.lastName}`;
        const street = document.getElementById("newAddrStreet")?.value || "";
        const city = document.getElementById("newAddrCity")?.value || "";
        const zip = document.getElementById("newAddrZip")?.value || "";
        const country = document.getElementById("newAddrCountry")?.value || "United States";
        const isDefault = document.getElementById("newAddrDefault")?.checked || false;

        const newAddr = {
          id: "addr-" + Date.now(),
          type,
          name,
          address: street,
          city,
          zip,
          country,
          isDefault
        };

        if (isDefault) {
          profile.addresses.forEach((a) => (a.isDefault = false));
        }

        if (window.AP_API && window.AP_API.addAddress) {
          await window.AP_API.addAddress(newAddr);
        }

        profile.addresses.push(newAddr);
        saveProfile("New delivery address saved!");
        renderAddresses();

        if (newAddressModal) newAddressModal.hide();
        addAddressForm.reset();
      });
    }
  }

  function saveProfile(toastMessage) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (toastMessage) {
      showToast(toastMessage, "success");
    }
  }

  function updateCartBadges() {
    if (window.AURA_CART) {
      const summary = window.AURA_CART.getSummary();
      const wishlist = window.AURA_CART.getWishlist();
      if (cartBadge) {
        cartBadge.textContent = summary.itemCount;
        cartBadge.classList.toggle("d-none", summary.itemCount === 0);
      }
      if (wishlistBadge) {
        wishlistBadge.textContent = wishlist.length;
        wishlistBadge.classList.toggle("d-none", wishlist.length === 0);
      }
    }
  }

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
