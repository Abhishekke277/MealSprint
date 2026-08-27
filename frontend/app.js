/**
 * =========================================================
 * MealSprint / QuickBite — Single Page Application Engine
 * =========================================================
 */

const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000"
};

// Application State
const State = {
  user: null,
  token: null,
  restaurants: [],
  cart: {}, // Format: { food_item_id: { food: {...}, quantity: N } }
  activeRestaurantId: null
};

// ================= API REQUEST WRAPPER =================
const API = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    if (State.token) {
      headers["Authorization"] = `Bearer ${State.token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.detail || "An unexpected error occurred.";
        throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },
  get(endpoint) { return this.request(endpoint, { method: "GET" }); },
  post(endpoint, body) { return this.request(endpoint, { method: "POST", body: JSON.stringify(body) }); },
  put(endpoint, body) { return this.request(endpoint, { method: "PUT", body: JSON.stringify(body) }); },
  delete(endpoint) { return this.request(endpoint, { method: "DELETE" }); }
};

// Toast Notifications Helper
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// ================= CUSTOM MODAL & PROMISE-BASED DIALOG HELPER =================
const ModalUI = {
  open(id) { 
    const el = document.getElementById(id);
    if (el) el.classList.add("show"); 
  },
  close(id) { 
    const el = document.getElementById(id);
    if (el) el.classList.remove("show"); 
  },

  confirm(message, title = "Confirm Action", confirmText = "Confirm", isDanger = false) {
    return new Promise((resolve) => {
      const modal = document.getElementById("dialog-modal");
      const titleEl = document.getElementById("dialog-title");
      const msgEl = document.getElementById("dialog-message");
      const confirmBtn = document.getElementById("dialog-confirm-btn");
      const cancelBtn = document.getElementById("dialog-cancel-btn");
      const iconEl = document.getElementById("dialog-icon");

      titleEl.textContent = title;
      msgEl.textContent = message;
      confirmBtn.textContent = confirmText;

      if (isDanger) {
        confirmBtn.className = "btn btn-danger";
        iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--btn-danger);"></i>';
      } else {
        confirmBtn.className = "btn btn-primary";
        iconEl.innerHTML = '<i class="fa-solid fa-circle-question" style="color: var(--primary-orange);"></i>';
      }

      modal.classList.add("show");

      const onConfirm = () => {
        cleanup();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        modal.classList.remove("show");
      };

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
    });
  }
};

// ================= AUTHENTICATION & HEADER UI =================
const AuthUI = {
  switchTab(type) {
    const signinBtn = document.getElementById("tab-signin-btn");
    const regBtn = document.getElementById("tab-register-btn");
    const signinForm = document.getElementById("signin-form");
    const regForm = document.getElementById("register-form");

    if (type === "signin") {
      signinBtn.classList.add("active");
      regBtn.classList.remove("active");
      signinForm.style.display = "block";
      regForm.style.display = "none";
    } else {
      regBtn.classList.add("active");
      signinBtn.classList.remove("active");
      regForm.style.display = "block";
      signinForm.style.display = "none";
    }
  },

  togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
      input.type = "text";
      btnEl.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    } else {
      input.type = "password";
      btnEl.innerHTML = '<i class="fa-regular fa-eye"></i>';
    }
  },

  renderHeader() {
    const container = document.getElementById("header-auth-status");
    const subNav = document.getElementById("sub-nav");
    const navTabsContainer = document.getElementById("nav-tabs-container");

    if (!State.user) {
      container.innerHTML = `<span class="user-status-text">Please sign in</span>`;
      subNav.style.display = "none";
      return;
    }

    // Authenticated User Status with Icon
    container.innerHTML = `
      <span class="user-status-text">Hi, <strong>${State.user.full_name}</strong></span>
      <span class="user-status-badge">${State.user.role}</span>
      <button class="logout-btn-header" onclick="App.handleLogout()">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    `;

    subNav.style.display = "block";

    // Build Role-Specific Navigation Tabs with Font Awesome Icons
    if (State.user.role === "admin") {
      navTabsContainer.innerHTML = `
        <button class="nav-tab-btn active" id="tab-admin-resto" onclick="App.switchView('admin-restaurants')"><i class="fa-solid fa-shop"></i> Restaurants</button>
        <button class="nav-tab-btn" id="tab-admin-menu" onclick="App.switchView('admin-menu')"><i class="fa-solid fa-utensils"></i> Menu Items</button>
      `;
    } else {
      navTabsContainer.innerHTML = `
        <button class="nav-tab-btn active" id="tab-cust-resto" onclick="App.switchView('customer-restaurants')"><i class="fa-solid fa-utensils"></i> Restaurants</button>
        <button class="nav-tab-btn" id="tab-cust-orders" onclick="App.switchView('customer-orders')"><i class="fa-solid fa-box"></i> My Orders</button>
      `;
    }
  }
};

// ================= CUSTOMER INTERACTION UI =================
const CustomerUI = {
  activeRestaurantId: null,

  async loadRestaurants() {
    try {
      State.restaurants = await API.get("/restaurants");
      this.renderRestaurants(State.restaurants);
    } catch (err) {
      showToast("Could not load restaurants", "error");
    }
  },

  renderRestaurants(list) {
    const grid = document.getElementById("restaurants-grid");
    if (!list || list.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); text-align: center;">No restaurants found matching your criteria.</p>`;
      return;
    }

    grid.innerHTML = list.map(r => `
      <div class="resto-card" onclick="CustomerUI.openMenuModal(${r.id})">
        <div class="resto-card-banner">🍛</div>
        <div class="resto-card-body">
          <h3 class="resto-name">${r.name}</h3>
          <div class="resto-meta">${r.cuisine_type} • ${r.city}</div>
          <div class="resto-address"><i class="fa-solid fa-location-dot"></i> ${r.address}</div>
          <div class="resto-footer">
            <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${r.rating.toFixed(1)}</span>
            <span class="${r.is_open ? 'tag-open' : 'tag-closed'}">${r.is_open ? 'Open' : 'Closed'}</span>
          </div>
        </div>
      </div>
    `).join("");
  },

  applyFilters() {
    const search = document.getElementById("filter-search").value.toLowerCase().trim();
    const city = document.getElementById("filter-city").value.toLowerCase().trim();
    const cuisine = document.getElementById("filter-cuisine").value.toLowerCase().trim();
    const openOnly = document.getElementById("filter-open").checked;

    const filtered = State.restaurants.filter(r => {
      const matchesSearch = !search || r.name.toLowerCase().includes(search) || r.cuisine_type.toLowerCase().includes(search);
      const matchesCity = !city || r.city.toLowerCase().includes(city);
      const matchesCuisine = !cuisine || r.cuisine_type.toLowerCase().includes(cuisine);
      const matchesOpen = !openOnly || r.is_open;
      return matchesSearch && matchesCity && matchesCuisine && matchesOpen;
    });

    this.renderRestaurants(filtered);
  },

  async openMenuModal(restaurantId) {
    this.activeRestaurantId = restaurantId;
    try {
      const restaurant = await API.get(`/restaurants/${restaurantId}`);
      document.getElementById("menu-modal-title").textContent = `${restaurant.name} — Menu`;

      const container = document.getElementById("menu-modal-items-container");
      if (!restaurant.food_items || restaurant.food_items.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem 0;">No items available for this restaurant currently.</p>`;
      } else {
        container.innerHTML = restaurant.food_items.map(item => {
          const currentQty = State.cart[item.id] ? State.cart[item.id].quantity : 0;
          return `
            <div class="menu-item-row">
              <div class="menu-item-info">
                <strong>${item.name}</strong>
                <span>${item.description || ''}</span>
              </div>
              <div class="menu-item-price-counter">
                <strong>₹${item.price.toFixed(0)}</strong>
                <div class="counter-controls">
                  <button type="button" class="counter-btn" onclick="CustomerUI.updateCartItem(${restaurant.id}, ${JSON.stringify(item).replace(/"/g, '&quot;')}, -1)">–</button>
                  <span class="counter-val" id="qty-val-${item.id}">${currentQty}</span>
                  <button type="button" class="counter-btn" onclick="CustomerUI.updateCartItem(${restaurant.id}, ${JSON.stringify(item).replace(/"/g, '&quot;')}, 1)">+</button>
                </div>
              </div>
            </div>
          `;
        }).join("");
      }

      ModalUI.open("menu-modal");
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async updateCartItem(restaurantId, item, change) {
    // Single restaurant cart constraint check using custom on-screen dialog
    if (State.activeRestaurantId && State.activeRestaurantId !== restaurantId && Object.keys(State.cart).length > 0) {
      const proceed = await ModalUI.confirm(
        "Adding items from a new restaurant will clear your current cart. Do you want to proceed?",
        "Switch Restaurant?",
        "Clear & Switch",
        true
      );
      if (proceed) {
        State.cart = {};
      } else {
        return;
      }
    }
    State.activeRestaurantId = restaurantId;

    const current = State.cart[item.id] ? State.cart[item.id].quantity : 0;
    const nextQty = Math.max(0, current + change);

    if (nextQty === 0) {
      delete State.cart[item.id];
    } else {
      State.cart[item.id] = { food: item, quantity: nextQty };
    }

    const counterEl = document.getElementById(`qty-val-${item.id}`);
    if (counterEl) counterEl.textContent = nextQty;

    this.renderCartStickyBar();
  },

  renderCartStickyBar() {
    const bar = document.getElementById("sticky-cart-bar");
    const info = document.getElementById("cart-bar-info");
    const items = Object.values(State.cart);

    if (items.length === 0) {
      bar.style.display = "none";
      return;
    }

    const totalCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalPrice = items.reduce((acc, curr) => acc + (curr.food.price * curr.quantity), 0);

    info.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''} • ₹${totalPrice.toFixed(0)}`;
    bar.style.display = "block";
  },

  async submitOrder() {
    const addressInput = document.getElementById("order-delivery-address");
    const address = addressInput ? addressInput.value.trim() : "";

    if (!address) {
      showToast("Please enter a delivery address", "error");
      return;
    }

    const items = Object.keys(State.cart).map(id => ({
      food_item_id: parseInt(id),
      quantity: State.cart[id].quantity
    }));

    if (items.length === 0) {
      showToast("Cart is empty! Click + to add items.", "error");
      return;
    }

    try {
      await API.post("/orders", {
        restaurant_id: State.activeRestaurantId,
        delivery_address: address,
        items: items
      });

      showToast("Order placed successfully!", "success");

      // Clear State & Form Inputs
      State.cart = {};
      if (addressInput) addressInput.value = "";

      this.renderCartStickyBar();
      ModalUI.close("menu-modal");
      App.switchView("customer-orders");
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async loadMyOrders() {
    const container = document.getElementById("orders-list-container");
    try {
      const orders = await API.get("/orders");
      if (!orders || orders.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">You have not placed any orders yet.</p>`;
        return;
      }

      container.innerHTML = orders.map(o => `
        <div class="order-box">
          <div class="order-header-flex">
            <span class="order-code-title">Order ${o.order_code}</span>
            <span class="badge-status ${o.status}">${o.status}</span>
          </div>
          <div class="order-items-summary">
            ${o.items.map(i => `${i.item_name} × ${i.quantity}`).join(", ")}
          </div>
          <div class="order-address-info"><i class="fa-solid fa-location-dot"></i> ${o.delivery_address}</div>
          <div class="order-footer-flex">
            <span class="order-total-price">₹${o.total_amount.toFixed(0)}</span>
            <div class="order-action-buttons">
              ${o.status === 'PENDING' ? `<button class="btn btn-pay btn-sm" onclick="CustomerUI.payOrder(${o.id})"><i class="fa-solid fa-credit-card"></i> Pay</button>` : ''}
              ${o.status === 'PENDING' || o.status === 'CONFIRMED' ? `<button class="btn btn-danger btn-sm" onclick="CustomerUI.cancelOrder(${o.id})"><i class="fa-solid fa-ban"></i> Cancel</button>` : ''}
            </div>
          </div>
        </div>
      `).join("");
    } catch (err) {
      showToast("Could not fetch orders", "error");
    }
  },

  async payOrder(orderId) {
    try {
      await API.put(`/orders/${orderId}/pay`, {});
      showToast("Payment Successful!", "success");
      this.loadMyOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async cancelOrder(orderId) {
    const proceed = await ModalUI.confirm(
      "Are you sure you want to cancel this order?",
      "Cancel Order",
      "Yes, Cancel",
      true
    );
    if (!proceed) return;

    try {
      await API.delete(`/orders/${orderId}`);
      showToast("Order Cancelled", "info");
      this.loadMyOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
};

// ================= ADMIN MANAGEMENT UI =================
const AdminUI = {
  allFoods: [],

  async loadAdminRestaurants() {
    try {
      State.restaurants = await API.get("/restaurants");
      const tbody = document.getElementById("admin-restaurants-table-body");
      
      tbody.innerHTML = State.restaurants.map(r => `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.cuisine_type}</td>
          <td>${r.city}</td>
          <td>★ ${r.rating.toFixed(1)}</td>
          <td><span class="${r.is_open ? 'tag-open' : 'tag-closed'}">${r.is_open ? 'Open' : 'Closed'}</span></td>
          <td>
            <div class="table-action-btns">
              <button class="btn btn-edit btn-sm" onclick="AdminUI.openEditRestaurantModal(${JSON.stringify(r).replace(/"/g, '&quot;')})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
              <button class="btn btn-danger btn-sm" onclick="AdminUI.deleteRestaurant(${r.id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </td>
        </tr>
      `).join("");
    } catch (err) {
      showToast("Failed to load admin restaurants", "error");
    }
  },

  openRestaurantModal() {
    document.getElementById("restaurant-form").reset();
    document.getElementById("modal-resto-id").value = "";
    document.getElementById("restaurant-modal-title").textContent = "Add Restaurant";
    ModalUI.open("restaurant-modal");
  },

  openEditRestaurantModal(r) {
    document.getElementById("modal-resto-id").value = r.id;
    document.getElementById("modal-resto-name").value = r.name;
    document.getElementById("modal-resto-cuisine").value = r.cuisine_type;
    document.getElementById("modal-resto-city").value = r.city;
    document.getElementById("modal-resto-address").value = r.address;
    document.getElementById("modal-resto-lat").value = r.latitude;
    document.getElementById("modal-resto-lon").value = r.longitude;
    document.getElementById("modal-resto-rating").value = r.rating;
    document.getElementById("modal-resto-open").checked = r.is_open;
    document.getElementById("restaurant-modal-title").textContent = "Edit Restaurant";
    ModalUI.open("restaurant-modal");
  },

  async handleSaveRestaurant(event) {
    event.preventDefault();
    const id = document.getElementById("modal-resto-id").value;
    const payload = {
      name: document.getElementById("modal-resto-name").value.trim(),
      cuisine_type: document.getElementById("modal-resto-cuisine").value.trim(),
      city: document.getElementById("modal-resto-city").value.trim(),
      address: document.getElementById("modal-resto-address").value.trim(),
      latitude: parseFloat(document.getElementById("modal-resto-lat").value),
      longitude: parseFloat(document.getElementById("modal-resto-lon").value),
      rating: parseFloat(document.getElementById("modal-resto-rating").value),
      is_open: document.getElementById("modal-resto-open").checked
    };

    try {
      if (id) {
        await API.put(`/admin/restaurants/${id}`, payload);
        showToast("Restaurant updated!", "success");
      } else {
        await API.post("/admin/restaurants", payload);
        showToast("Restaurant created!", "success");
      }
      ModalUI.close("restaurant-modal");
      this.loadAdminRestaurants();
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async deleteRestaurant(id) {
    const proceed = await ModalUI.confirm(
      "Are you sure you want to delete this restaurant? All attached menu items will also be deleted.",
      "Delete Restaurant",
      "Delete",
      true
    );
    if (!proceed) return;

    try {
      await API.delete(`/admin/restaurants/${id}`);
      showToast("Restaurant deleted", "info");
      this.loadAdminRestaurants();
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async loadAdminMenu() {
    try {
      State.restaurants = await API.get("/restaurants");
      this.allFoods = await API.get("/foods");
      
      const filterSelect = document.getElementById("admin-food-restaurant-filter");
      filterSelect.innerHTML = `<option value="">— All Restaurants —</option>` + 
        State.restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join("");

      this.renderFoodTable(this.allFoods);
    } catch (err) {
      showToast("Failed to load menu items", "error");
    }
  },

  renderFoodTable(foods) {
    const tbody = document.getElementById("admin-foods-table-body");
    if (!foods || foods.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">No food items found.</td></tr>`;
      return;
    }

    tbody.innerHTML = foods.map(f => {
      const resto = State.restaurants.find(r => r.id === f.restaurant_id);
      return `
        <tr>
          <td>
            <strong>${f.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${f.description || ''}</div>
          </td>
          <td>${resto ? resto.name : '—'}</td>
          <td>₹${f.price.toFixed(0)}</td>
          <td><span class="${f.is_available ? 'tag-open' : 'tag-closed'}">${f.is_available ? 'Yes' : 'No'}</span></td>
          <td>
            <div class="table-action-btns">
              <button class="btn btn-danger btn-sm" onclick="AdminUI.deleteFood(${f.id})"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  filterFoodsByRestaurant() {
    const rId = document.getElementById("admin-food-restaurant-filter").value;
    if (!rId) {
      this.renderFoodTable(this.allFoods);
    } else {
      this.renderFoodTable(this.allFoods.filter(f => f.restaurant_id === parseInt(rId)));
    }
  },

  openFoodModal() {
    document.getElementById("food-form").reset();
    const select = document.getElementById("modal-food-restaurant-select");
    select.innerHTML = State.restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
    ModalUI.open("food-modal");
  },

  async handleSaveFood(event) {
    event.preventDefault();
    const payload = {
      restaurant_id: parseInt(document.getElementById("modal-food-restaurant-select").value),
      name: document.getElementById("modal-food-name").value.trim(),
      description: document.getElementById("modal-food-desc").value.trim(),
      price: parseFloat(document.getElementById("modal-food-price").value),
      is_available: document.getElementById("modal-food-available").checked
    };

    try {
      await API.post("/admin/foods", payload);
      showToast("Food item added!", "success");
      ModalUI.close("food-modal");
      this.loadAdminMenu();
    } catch (err) {
      showToast(err.message, "error");
    }
  },

  async deleteFood(id) {
    const proceed = await ModalUI.confirm(
      "Are you sure you want to delete this menu item?",
      "Delete Menu Item",
      "Delete",
      true
    );
    if (!proceed) return;

    try {
      await API.delete(`/admin/foods/${id}`);
      showToast("Item deleted", "info");
      this.loadAdminMenu();
    } catch (err) {
      showToast(err.message, "error");
    }
  }
};

// ================= APP INITIALIZER & ROUTER =================
const App = {
  init() {
    State.token = localStorage.getItem("mealsprint_token");
    const rawUser = localStorage.getItem("mealsprint_user");
    State.user = rawUser ? JSON.parse(rawUser) : null;

    AuthUI.renderHeader();

    if (!State.user) {
      this.switchView("auth");
    } else if (State.user.role === "admin") {
      this.switchView("admin-restaurants");
    } else {
      this.switchView("customer-restaurants");
    }
  },

  switchView(viewName) {
    const views = {
      "auth": "auth-section",
      "customer-restaurants": "customer-restaurants-section",
      "customer-orders": "customer-orders-section",
      "admin-restaurants": "admin-restaurants-section",
      "admin-menu": "admin-menu-section"
    };

    Object.values(views).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    const activeEl = document.getElementById(views[viewName]);
    if (activeEl) activeEl.style.display = "block";

    document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
    if (viewName === "customer-restaurants") {
      const tab = document.getElementById("tab-cust-resto");
      if (tab) tab.classList.add("active");
      CustomerUI.loadRestaurants();
    } else if (viewName === "customer-orders") {
      const tab = document.getElementById("tab-cust-orders");
      if (tab) tab.classList.add("active");
      CustomerUI.loadMyOrders();
    } else if (viewName === "admin-restaurants") {
      const tab = document.getElementById("tab-admin-resto");
      if (tab) tab.classList.add("active");
      AdminUI.loadAdminRestaurants();
    } else if (viewName === "admin-menu") {
      const tab = document.getElementById("tab-admin-menu");
      if (tab) tab.classList.add("active");
      AdminUI.loadAdminMenu();
    }
  },

  async handleSignIn(event) {
    event.preventDefault();
    const btn = document.getElementById("signin-submit-btn");
    const statusText = document.getElementById("signin-status-text");
    btn.disabled = true;
    statusText.textContent = "Signing in...";

    try {
      const res = await API.post("/auth/login", {
        email: document.getElementById("signin-email").value.trim(),
        password: document.getElementById("signin-password").value
      });

      State.token = res.access_token;
      State.user = res.user;
      localStorage.setItem("mealsprint_token", res.access_token);
      localStorage.setItem("mealsprint_user", JSON.stringify(res.user));

      // Reset Form Inputs
      document.getElementById("signin-form").reset();

      showToast("Signed in successfully!", "success");
      AuthUI.renderHeader();

      if (res.user.role === "admin") {
        this.switchView("admin-restaurants");
      } else {
        this.switchView("customer-restaurants");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
      statusText.textContent = "";
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    const btn = document.getElementById("register-submit-btn");
    btn.disabled = true;

    try {
      const payload = {
        full_name: document.getElementById("reg-name").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
        role: document.getElementById("reg-role").value
      };

      const res = await API.post("/auth/register", payload);
      State.token = res.access_token;
      State.user = res.user;
      localStorage.setItem("mealsprint_token", res.access_token);
      localStorage.setItem("mealsprint_user", JSON.stringify(res.user));

      // Reset Form Inputs
      document.getElementById("register-form").reset();

      showToast("Registration successful!", "success");
      AuthUI.renderHeader();

      if (res.user.role === "admin") {
        this.switchView("admin-restaurants");
      } else {
        this.switchView("customer-restaurants");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
    }
  },

  handleLogout() {
    State.token = null;
    State.user = null;
    State.cart = {};
    localStorage.removeItem("mealsprint_token");
    localStorage.removeItem("mealsprint_user");

    // Reset all form inputs
    const signinForm = document.getElementById("signin-form");
    if (signinForm) signinForm.reset();

    const regForm = document.getElementById("register-form");
    if (regForm) regForm.reset();

    const addressInput = document.getElementById("order-delivery-address");
    if (addressInput) addressInput.value = "";

    CustomerUI.renderCartStickyBar();
    AuthUI.renderHeader();
    this.switchView("auth");
    showToast("Logged out", "info");
  }
};

// Global Bootstrapping
document.addEventListener("DOMContentLoaded", () => App.init());