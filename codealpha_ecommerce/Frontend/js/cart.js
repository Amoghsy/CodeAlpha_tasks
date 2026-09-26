/**
 * Cart Manager: LocalStorage persistence, calculations, promo codes, and backend synchronization
 */
const cartManager = (function () {
  /**
   * Internal get raw items
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
   * Internal save items and notify listeners
   */
  function saveItems(items) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items, count: getItemsCount() } }));
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
        console.warn('Backend cart sync failed, relying on local cart:', err.message);
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
      const maxStock = typeof product.stock === 'number' ? product.stock : 999;
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
        image: product.image,
        category: product.category,
        stock: product.stock,
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
   * Subtotal
   */
  function getSubtotal() {
    const items = getItems();
    return items.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  }

  /**
   * Get active applied promo
   */
  function getActivePromo() {
    const code = localStorage.getItem(CONFIG.STORAGE_KEYS.PROMO_CODE);
    if (!code) return null;
    const details = CONFIG.PROMO_CODES[code.toUpperCase()];
    return details ? { code: code.toUpperCase(), ...details } : null;
  }

  /**
   * Apply promo code
   */
  function applyPromoCode(code) {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!CONFIG.PROMO_CODES[cleanCode]) {
      return { success: false, message: 'Invalid promo code. Try SAVE10 or FREESHIP' };
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.PROMO_CODE, cleanCode);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: getItems(), count: getItemsCount() } }));
    return { success: true, promo: CONFIG.PROMO_CODES[cleanCode] };
  }

  /**
   * Remove promo code
   */
  function removePromoCode() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.PROMO_CODE);
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: getItems(), count: getItemsCount() } }));
  }

  /**
   * Calculate full breakdown
   */
  function getSummary() {
    const subtotal = getSubtotal();
    const promo = getActivePromo();
    
    let discount = 0;
    let isFreeShipping = subtotal >= CONFIG.SHIPPING.FREE_THRESHOLD || subtotal === 0;

    if (promo) {
      if (promo.discount) {
        discount = subtotal * promo.discount;
      }
      if (promo.freeShipping) {
        isFreeShipping = true;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping = (subtotal === 0 || isFreeShipping) ? 0 : CONFIG.SHIPPING.FLAT_RATE;
    const tax = discountedSubtotal * CONFIG.TAX_RATE;
    const total = discountedSubtotal + shipping + tax;

    return {
      subtotal,
      discount,
      promo,
      shipping,
      tax,
      total,
      itemCount: getItemsCount(),
      freeShippingThresholdRemaining: Math.max(0, CONFIG.SHIPPING.FREE_THRESHOLD - subtotal)
    };
  }

  return {
    getItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemsCount,
    getSubtotal,
    getActivePromo,
    applyPromoCode,
    removePromoCode,
    getSummary,
    syncWithBackend
  };
})();

// Export globally
window.cartManager = cartManager;
