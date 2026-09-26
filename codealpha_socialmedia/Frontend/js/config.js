// Vibesta App Configuration
const CONFIG = {
  // Base URL for the Express.js backend
  API_BASE_URL: 'http://localhost:5000/api',
  
  // LocalStorage keys
  TOKEN_KEY: 'vibesta_token',
  USER_KEY: 'vibesta_user',
  MOCK_POSTS_KEY: 'vibesta_mock_posts',
  MOCK_USERS_KEY: 'vibesta_mock_users',
  MOCK_STORIES_KEY: 'vibesta_mock_stories',
  VIEWED_STORIES_KEY: 'vibesta_viewed_stories',

  // Fallback to mock data from JSON file ONLY if backend server is unreachable
  AUTO_MOCK_FALLBACK: true,

  // Helper to dynamically resolve mock JSON path depending on current HTML directory
  getMockDataUrl() {
    return window.location.pathname.includes('/pages/') 
      ? '../data/mock-data.json' 
      : 'data/mock-data.json';
  }
};
