// Vibesta API Client
// Wraps native fetch(), attaches JWT Bearer token, handles JSON/Multipart, error states, and mock fallback

class ApiClient {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
    this.mockDataLoaded = false;
    // Do NOT load mock data on startup. Requests always hit the live backend first.
  }

  // Fetch mock data from JSON file only when fallback is actually triggered
  async ensureMockDataLoaded() {
    if (this.mockDataLoaded) return;
    const hasUsers = !!localStorage.getItem(CONFIG.MOCK_USERS_KEY);
    const hasPosts = !!localStorage.getItem(CONFIG.MOCK_POSTS_KEY);
    const hasStories = !!localStorage.getItem(CONFIG.MOCK_STORIES_KEY);
    
    if (!hasUsers || !hasPosts || !hasStories) {
      try {
        const url = CONFIG.getMockDataUrl();
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.users && !hasUsers) {
            localStorage.setItem(CONFIG.MOCK_USERS_KEY, JSON.stringify(data.users));
          }
          if (data.posts && !hasPosts) {
            localStorage.setItem(CONFIG.MOCK_POSTS_KEY, JSON.stringify(data.posts));
          }
          if (data.stories && !hasStories) {
            localStorage.setItem(CONFIG.MOCK_STORIES_KEY, JSON.stringify(data.stories));
          }
        }
      } catch (err) {
        console.warn('Could not fetch mock-data.json directly:', err);
      }
    }
    this.mockDataLoaded = true;
  }

  getStoredUsers() {
    return JSON.parse(localStorage.getItem(CONFIG.MOCK_USERS_KEY) || '[]');
  }

  getStoredPosts() {
    return JSON.parse(localStorage.getItem(CONFIG.MOCK_POSTS_KEY) || '[]');
  }

  getStoredStories() {
    return JSON.parse(localStorage.getItem(CONFIG.MOCK_STORIES_KEY) || '[]');
  }

  saveStoredStories(stories) {
    localStorage.setItem(CONFIG.MOCK_STORIES_KEY, JSON.stringify(stories));
  }

  getViewedStories() {
    return JSON.parse(localStorage.getItem(CONFIG.VIEWED_STORIES_KEY) || '[]');
  }

  markStoryViewed(userId) {
    const viewed = this.getViewedStories();
    if (!viewed.includes(userId)) {
      viewed.push(userId);
      localStorage.setItem(CONFIG.VIEWED_STORIES_KEY, JSON.stringify(viewed));
    }
  }

  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(CONFIG.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white shadow-emerald-200',
      error: 'bg-rose-600 text-white shadow-rose-200',
      info: 'bg-zinc-900 text-white shadow-zinc-200',
      warning: 'bg-amber-500 text-white shadow-amber-200'
    };

    const icons = {
      success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
      error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
      info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
      warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
    };

    toast.className = `toast-msg flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span>${message}</span>
      <button class="ml-auto opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3800);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = this.getToken();

    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
          this.showToast('Session expired. Please log in again.', 'warning');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1200);
        }
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      if (CONFIG.AUTO_MOCK_FALLBACK) {
        // Fallback to offline interactive mock store
        return this.handleMockFallback(endpoint, options);
      }
      throw err;
    }
  }

  // HTTP Shortcuts
  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, body = {}, isFormData = false) {
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  put(endpoint, body = {}, isFormData = false) {
    return this.request(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Mock Fallback Handler - Ensures complete zero-backend offline usability while backend is being stood up
  async handleMockFallback(endpoint, options) {
    await this.ensureMockDataLoaded();
    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.split('?')[0];

    // Helper to get stored posts & users
    const getStoredPosts = () => JSON.parse(localStorage.getItem(CONFIG.MOCK_POSTS_KEY) || '[]');
    const saveStoredPosts = (posts) => localStorage.setItem(CONFIG.MOCK_POSTS_KEY, JSON.stringify(posts));
    const getStoredUsers = () => JSON.parse(localStorage.getItem(CONFIG.MOCK_USERS_KEY) || '[]');
    const saveStoredUsers = (users) => localStorage.setItem(CONFIG.MOCK_USERS_KEY, JSON.stringify(users));

    // 1. Posts Feed
    if (cleanEndpoint === '/posts/feed' || cleanEndpoint === '/posts') {
      if (method === 'GET') {
        const posts = getStoredPosts();
        return { success: true, posts };
      }
      if (method === 'POST') {
        // Create post
        let newPostData = {};
        if (options.body instanceof FormData) {
          const caption = options.body.get('caption');
          const imageUrl = options.body.get('imagePreview') || options.body.get('image') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
          newPostData = { caption, image: imageUrl };
        } else if (typeof options.body === 'string') {
          newPostData = JSON.parse(options.body);
        }

        const currentUser = this.getCurrentUser() || {
          id: 'user_1',
          username: 'vibesta_creator',
          name: 'Amogh | Vibesta',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        };

        const currentAvatar = currentUser.avatar_url || currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.username)}`;

        const newPost = {
          id: 'post_' + Date.now(),
          userId: currentUser.id,
          author: {
            id: currentUser.id,
            username: currentUser.username,
            name: currentUser.name || currentUser.full_name,
            avatar: currentAvatar,
            avatar_url: currentAvatar
          },
          image: newPostData.image,
          caption: newPostData.caption || '',
          likesCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString(),
          comments: []
        };

        const posts = getStoredPosts();
        posts.unshift(newPost);
        saveStoredPosts(posts);

        // Increment user postsCount
        const users = getStoredUsers();
        const uIdx = users.findIndex(u => u.id === currentUser.id);
        if (uIdx !== -1) {
          users[uIdx].postsCount = (users[uIdx].postsCount || 0) + 1;
          saveStoredUsers(users);
        }

        return { success: true, post: newPost };
      }
    }

    // 2. Single Post by ID: /posts/:id
    const postDetailMatch = cleanEndpoint.match(/^\/posts\/([a-zA-Z0-9_\-]+)$/);
    if (postDetailMatch && method === 'GET') {
      const postId = postDetailMatch[1];
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        return { success: true, post };
      }
      throw new Error('Post not found');
    }

    // 3. Like Post: /posts/:id/like
    const likeMatch = cleanEndpoint.match(/^\/posts\/([a-zA-Z0-9_\-]+)\/like$/);
    if (likeMatch && method === 'POST') {
      const postId = likeMatch[1];
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.isLiked = !post.isLiked;
        post.likesCount = post.isLiked ? (post.likesCount + 1) : Math.max(0, post.likesCount - 1);
        saveStoredPosts(posts);
        return { success: true, isLiked: post.isLiked, likesCount: post.likesCount };
      }
      throw new Error('Post not found');
    }

    // 4. Add Comment: /posts/:id/comments
    const commentMatch = cleanEndpoint.match(/^\/posts\/([a-zA-Z0-9_\-]+)\/comments$/);
    if (commentMatch && method === 'POST') {
      const postId = commentMatch[1];
      const body = JSON.parse(options.body || '{}');
      const currentUser = this.getCurrentUser();
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === postId);
      if (post) {
        const newComment = {
          id: 'c_' + Date.now(),
          username: currentUser ? currentUser.username : 'vibesta_creator',
          avatar: currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          text: body.text || '',
          createdAt: 'Just now'
        };
        post.comments = post.comments || [];
        post.comments.push(newComment);
        saveStoredPosts(posts);
        return { success: true, comment: newComment };
      }
      throw new Error('Post not found');
    }

    // 5. User Profile: /users/:username
    const profileMatch = cleanEndpoint.match(/^\/users\/([a-zA-Z0-9_\-]+)$/);
    if (profileMatch && method === 'GET') {
      const username = profileMatch[1];
      const users = getStoredUsers();
      let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      const currentUser = this.getCurrentUser();

      if (!user && currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
        user = currentUser;
      }
      if (!user) {
        user = users[0]; // fallback
      }

      const posts = getStoredPosts().filter(p => p.userId === user.id || (p.author && p.author.username === user.username));
      return { success: true, user: { ...user, postsCount: posts.length }, posts };
    }

    // 6. Follow / Unfollow User: /users/:id/follow
    const followMatch = cleanEndpoint.match(/^\/users\/([a-zA-Z0-9_\-]+)\/follow$/);
    if (followMatch && method === 'POST') {
      const targetUserId = followMatch[1];
      const users = getStoredUsers();
      const targetUser = users.find(u => u.id === targetUserId);
      if (targetUser) {
        targetUser.isFollowing = !targetUser.isFollowing;
        targetUser.followersCount = targetUser.isFollowing ? (targetUser.followersCount + 1) : Math.max(0, targetUser.followersCount - 1);
        saveStoredUsers(users);
        return { success: true, isFollowing: targetUser.isFollowing, followersCount: targetUser.followersCount };
      }
      return { success: true, isFollowing: true, followersCount: 100 };
    }

    // 7. Update Profile: /users/profile
    if (cleanEndpoint === '/users/profile' && method === 'PUT') {
      const updateData = JSON.parse(options.body || '{}');
      const currentUser = this.getCurrentUser() || {};
      const updatedUser = {
        ...currentUser,
        ...updateData
      };
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(updatedUser));

      // Also update in users list
      const users = getStoredUsers();
      const idx = users.findIndex(u => u.id === currentUser.id || u.username === currentUser.username);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updateData };
        saveStoredUsers(users);
      }
      return { success: true, user: updatedUser };
    }

    // 8. Auth Login: /auth/login
    if (cleanEndpoint === '/auth/login' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      if (!body.password || body.password.trim() === '') {
        throw new Error('Password is required');
      }
      const users = getStoredUsers();
      const user = users.find(u => 
        (u.email && u.email.toLowerCase() === body.identifier?.toLowerCase()) || 
        (u.username && u.username.toLowerCase() === body.identifier?.toLowerCase())
      ) || users[0];

      const token = 'mock-jwt-token-' + Date.now();
      return { success: true, token, user };
    }

    // 9. Auth Register: /auth/register
    if (cleanEndpoint === '/auth/register' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newUser = {
        id: 'user_' + Date.now(),
        username: body.username,
        name: body.fullName || body.name || body.username,
        email: body.email,
        avatar: body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.username)}`,
        bio: 'Hello, I just joined Vibesta! ✨',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isFollowing: false
      };
      const users = getStoredUsers();
      users.push(newUser);
      saveStoredUsers(users);

      const token = 'mock-jwt-token-' + Date.now();
      return { success: true, token, user: newUser };
    }

    return { success: true, message: 'Mock response' };
  }
}

const api = new ApiClient();
