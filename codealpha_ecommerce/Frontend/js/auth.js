/**
 * Authentication management module
 */
const auth = (function () {
  /**
   * Check if user is logged in
   */
  function isAuthenticated() {
    return !!localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get current user object
   */
  function getUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_INFO);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Set user session
   */
  function setSession(token, user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user, isAuthenticated: true } }));
  }

  /**
   * Clear user session
   */
  function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_INFO);
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null, isAuthenticated: false } }));
    
    // If currently on orders.html or a protected view, redirect to home or login
    const currentPath = window.location.pathname;
    if (currentPath.includes('orders.html')) {
      window.location.href = 'login.html';
    } else {
      window.location.reload();
    }
  }

  /**
   * Login action
   */
  async function login(email, password) {
    const res = await api.login({ email, password });
    if (res && res.token) {
      setSession(res.token, res.user);
      // Also sync cart if there are local cart items
      if (window.cartManager) {
        window.cartManager.syncWithBackend();
      }
      return res;
    }
    throw new Error('Invalid login response');
  }

  /**
   * Register action
   */
  async function register(name, email, password) {
    const res = await api.register({ name, email, password });
    if (res && res.token) {
      setSession(res.token, res.user);
      if (window.cartManager) {
        window.cartManager.syncWithBackend();
      }
      return res;
    }
    throw new Error('Registration failed');
  }

  /**
   * Protect private pages
   */
  function requireAuth(redirectUrl = 'login.html') {
    if (!isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${redirectUrl}?returnUrl=${returnUrl}`;
      return false;
    }
    return true;
  }

  return {
    isAuthenticated,
    getUser,
    setSession,
    logout,
    login,
    register,
    requireAuth
  };
})();

// Export globally
window.auth = auth;
