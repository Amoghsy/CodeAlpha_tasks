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
      return { products: [], categories: [], mockOrders: [] };
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

      // If backend returns a clear error status (like 400 or 401), parse backend error message
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `Request failed with status ${response.status}` };
      }

      // If it's a 404 or 500 series error and we have a fallback handler, fallback
      if ((response.status >= 500 || response.status === 404) && fallbackHandler) {
        console.info(`Backend endpoint ${endpoint} returned ${response.status}. Using mock fallback.`);
        return await fallbackHandler();
      }

      const error = new Error(errorData.message || `HTTP Error ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    } catch (err) {
      clearTimeout(timeoutId);

      // If fetch failed due to network error, timeout, or backend not running
      if (fallbackHandler) {
        console.info(`Backend unavailable at ${url} (${err.message}). Using mock fallback.`);
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
          else if (params.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
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
          throw new Error(`Product with ID ${id} not found.`);
        }
        return { data: product };
      });
    },

    /**
     * Get all categories
     */
    async getCategories() {
      return request('/categories', { method: 'GET' }, async () => {
        const mock = await getMockData();
        return { data: mock.categories || [] };
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
        // Fallback demo login
        const { email, password } = credentials;
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        if (password.length < 4) {
          throw new Error('Invalid credentials. Password is too short.');
        }

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
        if (!name || !email || !password) {
          throw new Error('Please fill in all required fields.');
        }
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

        // Save into local orders storage
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
        
        // Merge mock orders with local placed orders
        const mockOrders = mock.mockOrders || [];
        const merged = [...localOrders, ...mockOrders];
        return { data: merged };
      });
    }
  };
})();

// Export globally
window.api = api;
