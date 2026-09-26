/**
 * API Service with seamless REST API invocation and local mockdata fallback
 */
const api = (function () {
  let cachedMockData = null;

  /**
   * Helper to fetch mockdata.json once and cache it
   */
  async function getMockData() {
    if (cachedMockData) return cachedMockData;
    try {
      const res = await fetch(CONFIG.MOCK_DATA_URL);
      if (!res.ok) throw new Error('Failed to load local mock data');
      cachedMockData = await res.json();
      return cachedMockData;
    } catch (err) {
      console.warn('Mock data fetch error:', err);
      return { products: [], categories: [], mockOrders: [], storeConfig: {} };
    }
  }

  /**
   * Core request wrapper with automatic Authorization header and mock fallback
   */
  async function request(endpoint, options = {}, fallbackHandler = null) {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

    const url = `${CONFIG.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `Request failed with status ${response.status}` };
      }

      if ((response.status >= 500 || response.status === 404) && fallbackHandler) {
        console.info(`Backend endpoint ${endpoint} returned ${response.status}. Using fallback.`);
        return await fallbackHandler();
      }

      const error = new Error(errorData.error || errorData.message || `HTTP Error ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    } catch (err) {
      clearTimeout(timeoutId);

      if (fallbackHandler) {
        console.info(`Backend unavailable at ${url} (${err.message}). Using fallback data.`);
        return await fallbackHandler();
      }
      throw err;
    }
  }

  return {
    /**
     * Get all products with optional filtering, search, sorting and pagination
     */
    async getProducts(params = {}) {
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `/products?${query}` : '/products';

      return request(endpoint, { method: 'GET' }, async () => {
        const mock = await getMockData();
        let list = [...(mock.products || [])];

        // Search query filter
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          list = list.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        }

        // Category filter
        if (params.category && params.category !== 'all') {
          list = list.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
        }

        // Sorting
        if (params.sort) {
          if (params.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
          else if (params.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
          else if (params.sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          else if (params.sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const limit = parseInt(params.limit, 10) || 6;
        const total = list.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const start = (page - 1) * limit;
        const paginated = list.slice(start, start + limit);

        return {
          data: paginated,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        };
      });
    },

    /**
     * Get single product by ID
     */
    async getProductById(id) {
      const numId = Number(id);
      return request(`/products/${id}`, { method: 'GET' }, async () => {
        const mock = await getMockData();
        const product = (mock.products || []).find(p => p.id === numId || String(p.id) === String(id));
        if (!product) {
          throw new Error(`Product with ID "${id}" not found.`);
        }
        return { data: product };
      });
    },

    /**
     * Get all categories from backend or fallback
     */
    async getCategories() {
      return request('/products/categories', { method: 'GET' }, async () => {
        const mock = await getMockData();
        return { data: mock.categories || [] };
      });
    },

    /**
     * Request backend to calculate cart totals, tax, shipping, and promotional discounts
     */
    async calculateCart(payload) {
      return request('/cart/calculate', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, async () => {
        const mock = await getMockData();
        const config = mock.storeConfig || {};
        const items = payload.items || [];
        const promoCode = (payload.promoCode || '').trim().toUpperCase();

        const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);
        const promos = config.promos || {};
        const promo = promos[promoCode] || null;

        let discount = 0;
        let isFreeShipping = subtotal >= (config.shipping?.freeThreshold || 999) || subtotal === 0;

        if (promo) {
          if (promo.discount) discount = subtotal * promo.discount;
          if (promo.freeShipping) isFreeShipping = true;
        }

        const discountedSubtotal = Math.max(0, subtotal - discount);
        const shipping = (subtotal === 0 || isFreeShipping) ? 0 : (config.shipping?.flatRate || 99);
        const tax = discountedSubtotal * (config.taxRate || 0.08);
        const total = discountedSubtotal + shipping + tax;

        return {
          data: {
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            promo: promo ? { code: promoCode, ...promo } : null,
            shipping: Number(shipping.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            total: Number(total.toFixed(2)),
            itemCount: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
            freeShippingThresholdRemaining: Math.max(0, (config.shipping?.freeThreshold || 999) - subtotal)
          }
        };
      });
    },

    /**
     * Authenticate user login
     */
    async login(credentials) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }, async () => {
        const { email, password } = credentials;
        if (!email || !password) throw new Error('Please enter both email and password.');
        if (password.length < 4) throw new Error('Invalid credentials.');

        const mock = await getMockData();
        const demoUser = mock.mockUser || {
          id: 'usr_demo',
          name: email.split('@')[0],
          email: email
        };

        const token = 'mock_jwt_token_' + Date.now();
        return {
          token,
          user: {
            id: demoUser.id,
            name: demoUser.name || email.split('@')[0],
            email: email
          }
        };
      });
    },

    /**
     * Register a new user
     */
    async register(userData) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }, async () => {
        const { name, email, password } = userData;
        if (!name || !email || !password) throw new Error('Please fill in all required fields.');
        const token = 'mock_jwt_token_new_' + Date.now();
        return {
          token,
          user: {
            id: 'usr_' + Date.now(),
            name,
            email
          }
        };
      });
    },

    /**
     * Fetch user cart from backend or return local
     */
    async getCart() {
      return request('/cart', { method: 'GET' }, async () => {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
        return { data: raw ? JSON.parse(raw) : [] };
      });
    },

    /**
     * Sync full cart to backend
     */
    async syncCart(items) {
      return request('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ items })
      }, async () => {
        localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
        return { success: true, data: items };
      });
    },

    /**
     * Create an order
     */
    async createOrder(orderPayload) {
      return request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      }, async () => {
        const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
        const newOrder = {
          id: orderId,
          date: new Date().toISOString(),
          status: 'Processing',
          ...orderPayload
        };

        const rawOrders = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
        const existing = rawOrders ? JSON.parse(rawOrders) : [];
        existing.unshift(newOrder);
        localStorage.setItem(CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(existing));

        return { success: true, data: newOrder };
      });
    },

    /**
     * Fetch user order history
     */
    async getOrders() {
      return request('/orders', { method: 'GET' }, async () => {
        const mock = await getMockData();
        const rawOrders = localStorage.getItem(CONFIG.STORAGE_KEYS.ORDERS);
        const localOrders = rawOrders ? JSON.parse(rawOrders) : [];
        const mockOrders = mock.mockOrders || [];
        return { data: [...localOrders, ...mockOrders] };
      });
    }
  };
})();

// Export globally
window.api = api;
