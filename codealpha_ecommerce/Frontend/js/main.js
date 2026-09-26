/**
 * Main application initializer: Shared layout, navbar, toasts, and helper utilities
 */

// Global Currency Formatter (Indian Rupees)
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Toast Notification System
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error' || type === 'danger') icon = 'fa-exclamation-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="toast-content">
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', removeToast);
  setTimeout(removeToast, duration);
}

window.showToast = showToast;
window.formatPrice = formatPrice;

/**
 * Initialize Navbar, Auth badges, Search inputs, Mobile menu
 */
function initNavigation() {
  // Update Cart Badge
  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = window.cartManager ? window.cartManager.getItemsCount() : 0;
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  // Update Auth Links / User Info in Nav
  function updateNavAuth() {
    const authContainer = document.getElementById('nav-auth-container');
    const mobileAuthContainer = document.getElementById('mobile-nav-auth-container');
    if (!authContainer && !mobileAuthContainer) return;

    const isLoggedIn = window.auth && window.auth.isAuthenticated();
    const user = window.auth ? window.auth.getUser() : null;

    const authHtml = isLoggedIn
      ? `
        <div class="user-dropdown">
          <button class="nav-user-btn" id="user-menu-btn" aria-expanded="false">
            <div class="user-avatar">${(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <span class="user-name">${user?.name || 'My Account'}</span>
            <i class="fas fa-chevron-down nav-chevron"></i>
          </button>
          <div class="dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <strong>${user?.name || 'Customer'}</strong>
              <small>${user?.email || ''}</small>
            </div>
            <hr />
            <a href="orders.html" class="dropdown-item"><i class="fas fa-box"></i> My Orders</a>
            <a href="cart.html" class="dropdown-item"><i class="fas fa-shopping-bag"></i> Cart (${window.cartManager ? window.cartManager.getItemsCount() : 0})</a>
            <hr />
            <button class="dropdown-item logout-btn" id="nav-logout-btn"><i class="fas fa-sign-out-alt"></i> Log Out</button>
          </div>
        </div>
      `
      : `
        <div class="auth-buttons">
          <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
          <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        </div>
      `;

    if (authContainer) {
      authContainer.innerHTML = authHtml;
      
      // Wire up user menu toggle
      const userBtn = authContainer.querySelector('#user-menu-btn');
      const dropdownMenu = authContainer.querySelector('#user-dropdown-menu');
      if (userBtn && dropdownMenu) {
        userBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('open');
        });
      }

      // Wire up logout
      const logoutBtn = authContainer.querySelector('#nav-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          window.auth.logout();
          showToast('You have been logged out.', 'info');
        });
      }
    }

    if (mobileAuthContainer) {
      mobileAuthContainer.innerHTML = authHtml;
      const logoutBtnMob = mobileAuthContainer.querySelector('#nav-logout-btn');
      if (logoutBtnMob) {
        logoutBtnMob.addEventListener('click', () => {
          window.auth.logout();
          showToast('You have been logged out.', 'info');
        });
      }
    }
  }

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    const dropdowns = document.querySelectorAll('.dropdown-menu.open');
    dropdowns.forEach(d => d.classList.remove('open'));
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-drawer');
  const mobileClose = document.getElementById('mobile-drawer-close');
  const mobileOverlay = document.getElementById('mobile-overlay');

  if (mobileToggle && mobileNav && mobileOverlay) {
    const openMenu = () => {
      mobileNav.classList.add('open');
      mobileOverlay.classList.add('open');
      document.body.classList.add('no-scroll');
    };
    const closeMenu = () => {
      mobileNav.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
    };

    mobileToggle.addEventListener('click', openMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);
  }

  // Global search form handler in nav
  const searchForms = document.querySelectorAll('.nav-search-form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="search"]');
      const query = input ? input.value.trim() : '';
      const target = `index.html?search=${encodeURIComponent(query)}`;
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('search', query);
        urlParams.set('page', '1');
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        if (typeof window.loadProductsGrid === 'function') {
          window.loadProductsGrid();
        }
      } else {
        window.location.href = target;
      }
    });
  });

  // Listen for cart & auth changes
  window.addEventListener('cartUpdated', updateCartBadge);
  window.addEventListener('authChanged', () => {
    updateNavAuth();
    updateCartBadge();
  });

  // Initial calls
  updateCartBadge();
  updateNavAuth();
}

// Global DOM Ready hook
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
