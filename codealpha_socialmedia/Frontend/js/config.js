// Vibesta App Configuration
const CONFIG = {
  // Base URL for the Express.js backend
  API_BASE_URL: 'http://localhost:5000/api',
  
  // LocalStorage keys
  TOKEN_KEY: 'vibesta_token',
  USER_KEY: 'vibesta_user',
  MOCK_POSTS_KEY: 'vibesta_mock_posts',
  MOCK_USERS_KEY: 'vibesta_mock_users',

  // Fallback to interactive mock data if backend server is unreachable
  AUTO_MOCK_FALLBACK: true
};

// Initial Mock Dataset for immediate UI testing & offline exploration
const INITIAL_MOCK_USERS = [
  {
    id: 'user_1',
    username: 'vibesta_creator',
    name: 'Amogh | Vibesta',
    email: 'creator@vibesta.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: '✨ Building Vibesta • Creative tech & aesthetics 📸\n📍 San Francisco, CA\nlinktr.ee/vibesta',
    followersCount: 1420,
    followingCount: 382,
    postsCount: 6,
    isFollowing: false
  },
  {
    id: 'user_2',
    username: 'sarah_designs',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Visual designer & photographer 🎨 capturing moments in 35mm',
    followersCount: 8930,
    followingCount: 412,
    postsCount: 12,
    isFollowing: true
  },
  {
    id: 'user_3',
    username: 'alex_wanderer',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Alpine climber & outdoor addict 🏔️ Never stop exploring',
    followersCount: 3410,
    followingCount: 195,
    postsCount: 9,
    isFollowing: false
  },
  {
    id: 'user_4',
    username: 'elena_snaps',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Coffee, books, and golden hour vibes ☕📖',
    followersCount: 5210,
    followingCount: 560,
    postsCount: 15,
    isFollowing: true
  }
];

const INITIAL_MOCK_POSTS = [
  {
    id: 'post_1',
    userId: 'user_2',
    author: {
      id: 'user_2',
      username: 'sarah_designs',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
    },
    image: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=80',
    caption: 'Golden hour in Kyoto. The way light filters through the ancient cedar trees feels like stepping into another dimension. ⛩️✨ #kyoto #japan #travelphotography #goldenhour',
    likesCount: 342,
    isLiked: false,
    createdAt: '2026-09-22T10:30:00Z',
    comments: [
      {
        id: 'c_1',
        username: 'alex_wanderer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        text: 'Incredible mood and color grade! What lens did you use?',
        createdAt: '1h ago'
      },
      {
        id: 'c_2',
        username: 'elena_snaps',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        text: 'This is pure magic ❤️ Adding Kyoto to my bucket list right now.',
        createdAt: '30m ago'
      }
    ]
  },
  {
    id: 'post_2',
    userId: 'user_3',
    author: {
      id: 'user_3',
      username: 'alex_wanderer',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    caption: 'Underneath a billion stars. High altitude camping in the Swiss Alps tested our gear and grit, but woke up to this. ⛺🌌 #alps #adventure #camping #milkyway',
    likesCount: 894,
    isLiked: true,
    createdAt: '2026-09-22T08:15:00Z',
    comments: [
      {
        id: 'c_3',
        username: 'sarah_designs',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        text: 'Breathtaking capture Alex! The exposure is on point.',
        createdAt: '4h ago'
      }
    ]
  },
  {
    id: 'post_3',
    userId: 'user_4',
    author: {
      id: 'user_4',
      username: 'elena_snaps',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
    },
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Sunday mornings are strictly reserved for artisanal espresso, slow vinyl jazz, and warm cinnamon rolls ☕🥐 #slowmorning #weekendvibes #coffeelover',
    likesCount: 512,
    isLiked: false,
    createdAt: '2026-09-21T18:40:00Z',
    comments: [
      {
        id: 'c_4',
        username: 'vibesta_creator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        text: 'The coziest vibe ever!',
        createdAt: '1d ago'
      }
    ]
  },
  {
    id: 'post_4',
    userId: 'user_1',
    author: {
      id: 'user_1',
      username: 'vibesta_creator',
      name: 'Amogh | Vibesta',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    caption: 'Fluid shapes, glowing neon curves, and abstract digital art. Exploring futuristic aesthetic concepts for Vibesta UI/UX ⚡🔮 #digitalart #glassmorphism #abstract #vibesta',
    likesCount: 1205,
    isLiked: true,
    createdAt: '2026-09-21T12:00:00Z',
    comments: []
  }
];

// Initialize mock storage if not already seeded
(function initStorage() {
  if (!localStorage.getItem(CONFIG.MOCK_USERS_KEY)) {
    localStorage.setItem(CONFIG.MOCK_USERS_KEY, JSON.stringify(INITIAL_MOCK_USERS));
  }
  if (!localStorage.getItem(CONFIG.MOCK_POSTS_KEY)) {
    localStorage.setItem(CONFIG.MOCK_POSTS_KEY, JSON.stringify(INITIAL_MOCK_POSTS));
  }
  // If no logged in user, provide a default logged in creator session for seamless initial testing
  if (!localStorage.getItem(CONFIG.USER_KEY)) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(INITIAL_MOCK_USERS[0]));
    localStorage.setItem(CONFIG.TOKEN_KEY, 'mock-jwt-token-vibesta-session');
  }
})();
