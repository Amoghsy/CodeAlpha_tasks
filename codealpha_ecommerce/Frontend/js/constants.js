/**
 * Application Constants and Global Configurations
 */
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  MOCK_DATA_URL: './data/mockdata.json',
  API_TIMEOUT_MS: 3000,
  STORAGE_KEYS: {
    AUTH_TOKEN: 'ecommerce_jwt_token',
    USER_INFO: 'ecommerce_user_info',
    CART: 'ecommerce_cart_items',
    ORDERS: 'ecommerce_local_orders',
    PROMO_CODE: 'ecommerce_active_promo'
  },
  SHIPPING: {
    FREE_THRESHOLD: 50.00,
    FLAT_RATE: 5.00
  },
  TAX_RATE: 0.08, // 8% sales tax
  PROMO_CODES: {
    'SAVE10': { discount: 0.10, label: '10% Off' },
    'ALPHA20': { discount: 0.20, label: '20% Off' },
    'FREESHIP': { freeShipping: true, label: 'Free Shipping' }
  }
};

// Make accessible to all scripts
window.CONFIG = CONFIG;
