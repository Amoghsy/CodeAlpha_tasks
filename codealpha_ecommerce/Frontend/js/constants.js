/**
 * Application Constants and Network Configuration
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
  }
};

// Make accessible to all scripts
window.CONFIG = CONFIG;
