// Vibesta Authentication Module
// Route guards, login/signup handlers, token persistence, and logout

const Auth = {
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },

  getUser() {
    try {
      const user = localStorage.getItem(CONFIG.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Guard for protected pages (feed, profile, post, create-post, edit-profile)
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // Guard for guest pages (login, register)
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = 'index.html';
      return true;
    }
    return false;
  },

  // Logout current user
  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    api.showToast('You have been logged out.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  },

  // Initialize Auth Listeners for Login / Register Pages
  init() {
    // 1. Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      this.redirectIfAuthenticated();
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifierInput = document.getElementById('identifier');
        const passwordInput = document.getElementById('password');
        const errorBanner = document.getElementById('auth-error');
        const submitBtn = document.getElementById('login-submit-btn');

        if (errorBanner) errorBanner.classList.add('hidden');

        const identifier = identifierInput.value.trim();
        const password = passwordInput.value.trim();

        if (!identifier || !password) {
          this.showError('Please fill in all fields.');
          return;
        }

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Logging in...
            `;
          }

          const response = await api.post('/auth/login', { identifier, password });

          if (response && response.token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
            api.showToast('Welcome back to Vibesta!', 'success');
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 600);
          } else {
            throw new Error(response.message || 'Invalid credentials');
          }
        } catch (err) {
          this.showError(err.message || 'Invalid email/username or password.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Log In';
          }
        }
      });
    }

    // 2. Register Form Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      this.redirectIfAuthenticated();
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('reg-username');
        const fullNameInput = document.getElementById('reg-fullname');
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const submitBtn = document.getElementById('register-submit-btn');

        const username = usernameInput.value.trim().toLowerCase().replace(/\s+/g, '_');
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!username || !fullName || !email || !password) {
          this.showError('Please complete all fields.');
          return;
        }

        if (password.length < 6) {
          this.showError('Password must be at least 6 characters long.');
          return;
        }

        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Creating Account...
            `;
          }

          const response = await api.post('/auth/register', {
            username,
            fullName,
            email,
            password
          });

          if (response && response.token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
            api.showToast('Account created successfully!', 'success');
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 600);
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (err) {
          this.showError(err.message || 'Registration failed. Try a different username.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign Up';
          }
        }
      });
    }

    // Bind logout buttons across pages
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  },

  showError(message) {
    const errorBanner = document.getElementById('auth-error');
    if (errorBanner) {
      errorBanner.textContent = message;
      errorBanner.classList.remove('hidden');
    } else {
      api.showToast(message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
