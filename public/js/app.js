/* ============================================================
   SMART FOOD DELIVERY ROUTE PLANNER — Global JavaScript
   File: public/js/app.js
   Description: API client, auth utilities, UI helpers,
                DOM helpers, and automatic page initialization
                used across every page in the application.
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   1. CONSTANTS
   ────────────────────────────────────────────────────────────── */

/**
 * Base URL for all API calls.
 * Reads the current origin so it works in development and production.
 */
const API_BASE_URL = (() => {
  try {
    const origin = window.location.origin; // e.g. http://localhost:3000
    return `${origin}/api`;
  } catch (_) {
    return 'http://localhost:3000/api';
  }
})();

/* ──────────────────────────────────────────────────────────────
   2. DOM HELPERS — shorthand selectors
   ────────────────────────────────────────────────────────────── */

/** querySelector shorthand */
const $ = (selector, parent = document) => parent.querySelector(selector);

/** querySelectorAll shorthand (returns real Array) */
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ──────────────────────────────────────────────────────────────
   3. AUTH UTILITIES
   ────────────────────────────────────────────────────────────── */
const Auth = {
  TOKEN_KEY: 'foodroute_token',

  /** Retrieve JWT from localStorage */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /** Save JWT to localStorage */
  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  /** Remove JWT (log out) */
  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  /**
   * Decode the JWT payload WITHOUT a library.
   * Returns the user object or null if the token is invalid / expired.
   */
  getUser() {
    try {
      const token = this.getToken();
      if (!token) return null;
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      // Check expiry
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        this.removeToken();
        return null;
      }
      return decoded;
    } catch (_) {
      this.removeToken();
      return null;
    }
  },

  /** Quick boolean: is the user currently logged in? */
  isLoggedIn() {
    return this.getUser() !== null;
  },

  /** Log out: clear storage and redirect to login page */
  logout() {
    this.removeToken();
    localStorage.removeItem('foodroute_cart');
    window.location.href = '/pages/login.html';
  },

  /**
   * Gate-keep a page by role.
   * If the user is not logged in OR does not have the required role,
   * redirect them to the appropriate page.
   * @param {string|null} requiredRole - 'customer', 'restaurant', 'delivery', 'admin', or null (any role)
   */
  checkAuth(requiredRole = null) {
    const user = this.getUser();
    if (!user) {
      window.location.href = '/pages/login.html';
      return null;
    }
    if (requiredRole && user.role !== requiredRole) {
      showToast('Access denied — insufficient permissions.', 'error');
      // Redirect based on actual role
      const roleRedirects = {
        customer:       '/pages/menu.html',
        delivery_agent: '/pages/delivery-dashboard.html',
        admin:          '/pages/admin-dashboard.html'
      };
      setTimeout(() => {
        window.location.href = roleRedirects[user.role] || '/';
      }, 1500);
      return null;
    }
    return user;
  }
};

/* ──────────────────────────────────────────────────────────────
   4. API CLIENT
   ────────────────────────────────────────────────────────────── */
const ApiClient = {
  /**
   * Core fetch wrapper.
   * Automatically injects the JWT, sets JSON headers,
   * toggles the loading spinner, and handles errors.
   */
  async _request(method, endpoint, data = null, showSpinner = true) {
    if (showSpinner) showLoading();

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401 Unauthorized, token may be expired
        if (response.status === 401) {
          Auth.removeToken();
          // Only redirect if NOT already on login/register
          if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
            showToast('Session expired. Please log in again.', 'warning');
            setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
          }
        }
        throw new ApiError(json.message || json.error || `Request failed (${response.status})`, response.status, json);
      }

      return json;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Network error
      console.error('API Client Error:', err);
      throw new ApiError('Network error — please check your connection.', 0, null);
    } finally {
      if (showSpinner) hideLoading();
    }
  },

  /** GET request */
  get(endpoint, showSpinner = true) {
    return this._request('GET', endpoint, null, showSpinner);
  },

  /** POST request */
  post(endpoint, data, showSpinner = true) {
    return this._request('POST', endpoint, data, showSpinner);
  },

  /** PUT request */
  put(endpoint, data, showSpinner = true) {
    return this._request('PUT', endpoint, data, showSpinner);
  },

  /** PATCH request */
  patch(endpoint, data, showSpinner = true) {
    return this._request('PATCH', endpoint, data, showSpinner);
  },

  /** DELETE request */
  delete(endpoint, showSpinner = true) {
    return this._request('DELETE', endpoint, null, showSpinner);
  }
};

/** Custom API error class */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ──────────────────────────────────────────────────────────────
   5. UI HELPERS — Toast Notifications
   ────────────────────────────────────────────────────────────── */

/**
 * Create the persistent toast container (called once).
 */
function _ensureToastContainer() {
  let container = $('#toast-container-app');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container-app';
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message - The text to display.
 * @param {'success'|'error'|'warning'|'info'} type - Toast type.
 * @param {number} duration - Auto-dismiss in ms (default 4000).
 */
function showToast(message, type = 'info', duration = 4000) {
  const container = _ensureToastContainer();

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast-custom toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  // Trigger reflow then show
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => _dismissToast(toast));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => _dismissToast(toast), duration);
  }
}

function _dismissToast(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  // Fallback removal
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
}

/* ──────────────────────────────────────────────────────────────
   6. UI HELPERS — Loading Spinner
   ────────────────────────────────────────────────────────────── */

let _loadingCount = 0; // Allows nesting

function _ensureLoadingOverlay() {
  let overlay = $('#loading-overlay-app');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay-app';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <span class="loading-text">Loading...</span>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

/** Show full-page loading spinner */
function showLoading() {
  _loadingCount++;
  const overlay = _ensureLoadingOverlay();
  overlay.classList.add('active');
}

/** Hide full-page loading spinner */
function hideLoading() {
  _loadingCount = Math.max(0, _loadingCount - 1);
  if (_loadingCount === 0) {
    const overlay = _ensureLoadingOverlay();
    overlay.classList.remove('active');
  }
}

/* ──────────────────────────────────────────────────────────────
   7. FORMATTING UTILITIES
   ────────────────────────────────────────────────────────────── */

/**
 * Format a number as Indian Rupees.
 * @param {number} amount
 * @returns {string} e.g. "₹249.00"
 */
function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a date string nicely.
 * @param {string} dateStr - ISO date string or any parseable date.
 * @returns {string} e.g. "13 Jul 2026, 10:30 AM"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch (_) {
    return dateStr;
  }
}

/**
 * Format distance in km.
 * @param {number} km
 * @returns {string} e.g. "3.2 km"
 */
function formatDistance(km) {
  const num = parseFloat(km);
  if (isNaN(num)) return '0 km';
  if (num < 1) return `${Math.round(num * 1000)} m`;
  return `${num.toFixed(1)} km`;
}

/**
 * Format duration in minutes to human-readable.
 * @param {number} minutes
 * @returns {string} e.g. "1h 25m" or "45 min"
 */
function formatDuration(minutes) {
  const m = parseInt(minutes, 10);
  if (isNaN(m) || m <= 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/* ──────────────────────────────────────────────────────────────
   8. STATUS HELPERS
   ────────────────────────────────────────────────────────────── */

/**
 * Return CSS class for a given order status (matches style.css).
 * @param {string} status
 * @returns {string} e.g. "status-badge status-pending"
 */
function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '_');
  const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (validStatuses.includes(s)) return `status-badge status-${s}`;
  return 'status-badge status-pending';
}

/**
 * Human-readable label for an order status.
 * @param {string} status
 * @returns {string} e.g. "Out for Delivery"
 */
function getStatusLabel(status) {
  const labels = {
    pending:          'Pending',
    confirmed:        'Confirmed',
    preparing:        'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled'
  };
  const s = (status || '').toLowerCase().replace(/\s+/g, '_');
  return labels[s] || status || 'Unknown';
}

/* ──────────────────────────────────────────────────────────────
   9. DEBOUNCE
   ────────────────────────────────────────────────────────────── */

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay - Milliseconds.
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ──────────────────────────────────────────────────────────────
   10. STAR RATING HELPER
   ────────────────────────────────────────────────────────────── */

/**
 * Generate star-rating HTML.
 * @param {number} rating - e.g. 4.3
 * @param {number} count - number of reviews (optional).
 * @returns {string} HTML string
 */
function renderStars(rating, count = null) {
  const r = parseFloat(rating) || 0;
  let html = '<span class="star-rating">';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(r)) {
      html += '<i class="fa-solid fa-star star filled"></i>';
    } else if (i - r < 1 && i - r > 0) {
      html += '<i class="fa-solid fa-star-half-stroke star filled"></i>';
    } else {
      html += '<i class="fa-regular fa-star star"></i>';
    }
  }
  if (count !== null) {
    html += `<span class="rating-count">(${count})</span>`;
  }
  html += '</span>';
  return html;
}

/* ──────────────────────────────────────────────────────────────
   11. CART UTILITIES
   ────────────────────────────────────────────────────────────── */
const Cart = {
  /** Fetch cart from API — GET /api/cart */
  async getItems() {
    if (!Auth.isLoggedIn()) return { items: [], summary: { subtotal: 0, item_count: 0 } };
    try {
      const res = await ApiClient.get('/cart', false);
      return res.data;
    } catch (err) {
      console.error('Cart fetch error:', err);
      return { items: [], summary: { subtotal: 0, item_count: 0 } };
    }
  },

  /** Add an item — POST /api/cart */
  async addItem(food_id, quantity = 1) {
    if (!Auth.isLoggedIn()) {
      showToast('Please login to add items to cart', 'warning');
      setTimeout(() => window.location.href = '/pages/login.html', 1500);
      return;
    }
    const res = await ApiClient.post('/cart', { food_id, quantity });
    this.updateBadge();
    return res;
  },

  /** Remove an item — DELETE /api/cart/:id */
  async removeItem(cartId) {
    await ApiClient.delete(`/cart/${cartId}`);
    this.updateBadge();
  },

  /** Update quantity — PUT /api/cart/:id */
  async updateQuantity(cartId, quantity) {
    await ApiClient.put(`/cart/${cartId}`, { quantity });
    this.updateBadge();
  },

  /** Clear the cart — DELETE /api/cart */
  async clear() {
    await ApiClient.delete('/cart');
    this.updateBadge();
  },

  /** Update all cart badges on the page */
  async updateBadge() {
    if (!Auth.isLoggedIn()) {
      $$('.cart-badge').forEach(b => b.classList.add('d-none'));
      return;
    }
    try {
      const data = await this.getItems();
      const count = data.summary ? data.summary.item_count : 0;
      $$('.cart-badge').forEach(badge => {
        badge.textContent = count;
        badge.classList.toggle('d-none', count === 0);
      });
    } catch (_) {
      // Silently fail badge updates
    }
  }
};

/* ──────────────────────────────────────────────────────────────
   12. NAVBAR — Dynamic Update Based on Auth State
   ────────────────────────────────────────────────────────────── */

/**
 * Dynamically update navbar right-side buttons based on
 * whether the user is logged in or not.
 */
function updateNavbar() {
  const navRight = $('#nav-auth-section');
  if (!navRight) return; // Page might not have this element

  const user = Auth.getUser();

  if (user) {
    // Logged-in state: show user dropdown + cart
    const dashboardLink = {
      customer:       '/pages/menu.html',
      delivery_agent: '/pages/delivery-dashboard.html',
      admin:          '/pages/admin-dashboard.html'
    }[user.role] || '/';

    navRight.innerHTML = `
      <!-- Cart -->
      <li class="nav-item me-2">
        <a class="nav-link" href="/pages/cart.html" title="Cart">
          <span class="cart-icon-wrapper">
            <i class="fa-solid fa-cart-shopping"></i>
            <span class="cart-badge d-none">0</span>
          </span>
        </a>
      </li>
      <!-- User Dropdown -->
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#"
           role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <span class="d-flex align-items-center justify-content-center rounded-circle"
                style="width:32px;height:32px;background:var(--clr-accent-gradient);font-size:0.85rem;font-weight:700;">
            ${(user.name || user.email || 'U')[0].toUpperCase()}
          </span>
          <span class="d-none d-md-inline" style="font-size:0.9rem;">${user.name || 'User'}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          ${user.role === 'customer' ? `
            <li><a class="dropdown-item" href="${dashboardLink}"><i class="fa-solid fa-gauge-high me-2"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="/pages/order-history.html"><i class="fa-solid fa-receipt me-2"></i>My Orders</a></li>
          ` : user.role === 'admin' ? `
            <li><a class="dropdown-item" href="/pages/admin-dashboard.html"><i class="fa-solid fa-gauge-high me-2"></i>Admin Panel</a></li>
            <li><a class="dropdown-item" href="/pages/admin-orders.html"><i class="fa-solid fa-clipboard-list me-2"></i>Manage Orders</a></li>
          ` : `
            <li><a class="dropdown-item" href="/pages/delivery-dashboard.html"><i class="fa-solid fa-gauge-high me-2"></i>Rider Dashboard</a></li>
          `}
          <li><a class="dropdown-item" href="/pages/profile.html"><i class="fa-solid fa-user me-2"></i>Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-accent" href="#" id="btn-logout"><i class="fa-solid fa-right-from-bracket me-2"></i>Logout</a></li>
        </ul>
      </li>
    `;

    // Attach logout handler
    const logoutBtn = $('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
      });
    }
  } else {
    // Guest state: Login + Sign Up buttons
    navRight.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/pages/login.html"><i class="fa-solid fa-right-to-bracket me-1"></i> Login</a>
      </li>
      <li class="nav-item ms-2">
        <a class="btn btn-primary-gradient btn-sm" href="/pages/signup.html"><i class="fa-solid fa-user-plus me-1"></i> Sign Up</a>
      </li>
    `;
  }
}

/* ──────────────────────────────────────────────────────────────
   13. SCROLL-BASED NAVBAR SHRINK
   ────────────────────────────────────────────────────────────── */
function initNavbarScroll() {
  const navbar = $('.navbar-glass');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial check
}

/* ──────────────────────────────────────────────────────────────
   14. SCROLL REVEAL (Intersection Observer)
   ────────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const targets = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (targets.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────────────────────────
   15. ANIMATED COUNTER (Stats section)
   ────────────────────────────────────────────────────────────── */
function initCounters() {
  const counters = $$('[data-count]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();

        const animate = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(ease * target);
          el.textContent = current.toLocaleString('en-IN') + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────────────────────────
   16. SMOOTH SCROLL FOR ANCHOR LINKS
   ────────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = $(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile navbar if open
      const navCollapse = $('.navbar-collapse.show');
      if (navCollapse) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    }
  });
}

/* ──────────────────────────────────────────────────────────────
   17. UTILITY — Escape HTML (prevent XSS in dynamic content)
   ────────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ──────────────────────────────────────────────────────────────
   18. UTILITY — Generate query string from object
   ────────────────────────────────────────────────────────────── */
function toQueryString(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/* ──────────────────────────────────────────────────────────────
   19. UTILITY — Confirm dialog (uses Bootstrap modal or native)
   ────────────────────────────────────────────────────────────── */
function confirmAction(message = 'Are you sure?') {
  return new Promise((resolve) => {
    // Use native confirm for simplicity; can be replaced with a custom modal
    resolve(window.confirm(message));
  });
}

/* ──────────────────────────────────────────────────────────────
   20. AUTO-INITIALIZATION ON DOM READY
   ────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Initialization
  initThemeToggle();

  // Initialize Navbar based on Auth State
  updateNavbar();

  // Initialize Cart Badges
  Cart.updateBadge();

  // Navbar scroll effect
  initNavbarScroll();

  // Scroll reveal animations
  initScrollReveal();

  // Animated counters
  initCounters();

// Smooth scroll for anchor links
  initSmoothScroll();
});

/* ──────────────────────────────────────────────────────────────
   21. THEME TOGGLE UTILITIES
   ────────────────────────────────────────────────────────────── */
function initThemeToggle() {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
  }

  // Create floating theme toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'themeToggleBtn';
  toggleBtn.className = 'btn btn-outline-secondary rounded-circle shadow';
  toggleBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 1050; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; background: var(--clr-surface); color: var(--clr-text-primary); backdrop-filter: var(--glass-blur); border: var(--glass-border);';
  
  const updateIcon = () => {
    toggleBtn.innerHTML = document.body.classList.contains('light-theme') 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun text-warning"></i>';
  };
  updateIcon();

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateIcon();
  });

  document.body.appendChild(toggleBtn);
}
