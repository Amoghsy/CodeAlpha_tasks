/**
 * Cart Manager: LocalStorage persistence, event dispatching, and Backend-calculated summaries
 */
const cartManager = (function () {
  let cachedSummary = {
    subtotal: 0,
    discount: 0,
    promo: null,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
    freeShippingThresholdRemaining: 0
  };

  /**
   * Get raw items from storage
   */
  function getItems() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading cart from storage', e);
      return [];
    }
  }

  /**
   * Save items and refresh backend summary
   */
  async function saveItems(items) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
    await refreshSummary();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items, count: getItemsCount(), summary: cachedSummary } }));
    syncWithBackend();
  }

  /**
   * Sync with backend if user is authenticated
   */
  async function syncWithBackend() {
    if (window.auth && window.auth.isAuthenticated()) {
      try {
        const items = getItems();
        await api.syncCart(items);
      } catch (err) {
        console.warn('Backend cart sync failed, using local store:', err.message);
      }
    }
  }

  /**
   * Add a product to the cart
   */
  function addItem(product, quantity = 1) {
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);
    const items = getItems();
    const existingIndex = items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      const maxStock = typeof product.stock === 'number' ? product.stock : (product.stock_quantity || 999);
      const newQty = items[existingIndex].quantity + qtyToAdd;
      
      if (newQty > maxStock) {
        items[existingIndex].quantity = maxStock;
        saveItems(items);
        if (window.showToast) {
          window.showToast(`Max stock reached (${maxStock} items).`, 'warning');
        }
        return false;
      }
      items[existingIndex].quantity = newQty;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || product.image_url,
        category: product.category,
        stock: product.stock || product.stock_quantity,
        quantity: qtyToAdd
      });
    }

    saveItems(items);
    if (window.showToast) {
      window.showToast(`"${product.name}" added to your cart!`, 'success');
    }
    return true;
  }

  /**
   * Update quantity of a product in the cart
   */
  function updateQuantity(productId, quantity) {
    const qty = parseInt(quantity, 10);
    const items = getItems();
    const index = items.findIndex(item => item.id === Number(productId) || item.id === productId);

    if (index > -1) {
      if (qty <= 0) {
        items.splice(index, 1);
      } else {
        const maxStock = items[index].stock || 999;
        items[index].quantity = Math.min(qty, maxStock);
      }
      saveItems(items);
    }
  }

  /**
   * Remove item from cart
   */
  function removeItem(productId) {
    let items = getItems();
    items = items.filter(item => item.id !== Number(productId) && item.id !== productId);
    saveItems(items);
    if (window.showToast) {
      window.showToast('Item removed from cart', 'info');
    }
  }

  /**
   * Clear all cart items
   */
  function clearCart() {
    saveItems([]);
  }

  /**
   * Total number of individual items
   */
  function getItemsCount() {
    const items = getItems();
    return items.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  /**
   * Get active applied promo code
   */
  function getActivePromo() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.PROMO_CODE);
  }

  /**
   * Apply promo code
   */
  async function applyPromoCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    localStorage.setItem(CONFIG.STORAGE_KEYS.PROMO_CODE, cleanCode);
    const summary = await refreshSummary();

    if (summary.promo) {
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: getItems(), count: getItemsCount(), summary } }));
      return { success: true, promo: summary.promo };
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.PROMO_CODE);
      await refreshSummary();
      return { success: false, message: 'Invalid or expired promo code.' };
    }
  }

  /**
   * Remove promo code
   */
  async function removePromoCode() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PROMO_CODE);
    await refreshSummary();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: getItems(), count: getItemsCount(), summary: cachedSummary } }));
  }

  /**
   * Delegate pricing calculations to backend API / fallback
   */
  async function refreshSummary() {
    const items = getItems();
    const promoCode = getActivePromo();
    try {
      const res = await api.calculateCart({ items, promoCode });
      cachedSummary = res.data;
      return cachedSummary;
    } catch (e) {
      console.warn('Could not refresh cart summary from backend:', e);
      return cachedSummary;
    }
  }

  /**
   * Return cached summary
   */
  function getSummary() {
    return cachedSummary;
  }

  // Initial load
  refreshSummary();

  return {
    getItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsCount,
    getActivePromo,
    applyPromoCode,
    removePromoCode,
    refreshSummary,
    getSummary,
    syncWithBackend
  };
})();

// Export globally
window.cartManager = cartManager;
