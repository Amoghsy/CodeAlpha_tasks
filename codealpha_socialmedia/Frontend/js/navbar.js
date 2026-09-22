// Vibesta Common Navigation & Global Modals Component

const Navbar = {
  render() {
    const user = Auth.getUser() || {
      username: 'guest',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };

    const currentPath = window.location.pathname;
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/');
    const isProfile = currentPath.includes('profile.html');
    const isCreate = currentPath.includes('create-post.html');

    // 1. Top Navbar Container
    const headerContainer = document.getElementById('navbar-container');
    if (headerContainer) {
      headerContainer.innerHTML = `
        <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 transition-all">
          <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            
            <!-- Brand Logo -->
            <a href="index.html" class="flex items-center gap-2.5 group">
              <img src="../assets/logo.svg" alt="Vibesta" class="w-9 h-9 rounded-xl shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform" />
              <span class="text-2xl font-extrabold tracking-tight brand-gradient-text hidden sm:inline">Vibesta</span>
            </a>

            <!-- Search Bar -->
            <div class="relative flex-1 max-w-xs hidden md:block">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input 
                type="text" 
                id="nav-search-input" 
                placeholder="Search Vibesta..." 
                class="w-full pl-9 pr-4 py-1.5 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-sm text-zinc-800 rounded-lg border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
                autocomplete="off"
              />
              <div id="search-dropdown" class="hidden absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50 py-1 max-h-72 overflow-y-auto">
                <!-- Search items rendered via JS -->
              </div>
            </div>

            <!-- Action Navigation Icons -->
            <div class="flex items-center gap-2 sm:gap-4">
              <!-- Home -->
              <a href="index.html" class="p-2 text-zinc-700 hover:text-black rounded-lg transition-colors ${isHome ? 'text-black font-bold' : ''}" title="Home">
                <svg class="w-6 h-6" fill="${isHome ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
              </a>

              <!-- Create Post Modal Button -->
              <button id="open-create-modal-btn" class="p-2 text-zinc-700 hover:text-black rounded-lg transition-colors ${isCreate ? 'text-black font-bold' : ''}" title="Create Post">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>

              <!-- Profile Avatar -->
              <a href="profile.html?username=${encodeURIComponent(user.username || '')}" class="relative p-0.5 rounded-full ${isProfile ? 'ring-2 ring-zinc-800' : 'hover:opacity-80'} transition-all" title="Profile">
                <img 
                  src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" 
                  alt="${user.username}" 
                  class="w-7 h-7 rounded-full object-cover border border-zinc-200"
                />
              </a>

              <!-- Logout -->
              <button class="logout-btn p-2 text-zinc-500 hover:text-rose-600 rounded-lg transition-colors ml-1" title="Log Out">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </nav>
      `;
    }

    // 2. Mobile Bottom Bar
    const mobileBottomBar = document.getElementById('mobile-bottom-bar');
    if (mobileBottomBar) {
      mobileBottomBar.innerHTML = `
        <div class="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-40 sm:hidden">
          <div class="flex items-center justify-around h-14 px-2">
            <a href="index.html" class="p-2 text-zinc-800 ${isHome ? 'text-black' : 'text-zinc-500'}">
              <svg class="w-6 h-6" fill="${isHome ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </a>
            <button id="mobile-create-btn" class="p-2 text-zinc-500 hover:text-black">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
            <a href="create-post.html" class="p-2 text-zinc-500 hover:text-black">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </a>
            <a href="profile.html?username=${encodeURIComponent(user.username || '')}" class="p-1">
              <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" class="w-6 h-6 rounded-full object-cover border ${isProfile ? 'ring-2 ring-zinc-900' : ''}">
            </a>
          </div>
        </div>
      `;
    }

    // 3. Inject Create Post Modal HTML into document
    this.injectCreatePostModal();

    // 4. Bind events
    this.bindEvents();
  },

  injectCreatePostModal() {
    if (document.getElementById('create-post-modal')) return;

    const modalHTML = `
      <div id="create-post-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
        <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
          
          <!-- Modal Header -->
          <div class="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between">
            <h3 class="text-base font-bold text-zinc-900">Create new post</h3>
            <button id="close-create-modal" class="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Modal Body -->
          <form id="modal-create-post-form" class="p-5 space-y-4">
            <!-- Image Selector / Dropzone -->
            <div id="modal-dropzone" class="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50">
              <input type="file" id="modal-image-input" accept="image/*" class="hidden">
              <div id="modal-dropzone-prompt" class="space-y-2">
                <div class="w-12 h-12 mx-auto rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <p class="text-sm font-semibold text-zinc-700">Drag photo here or click to browse</p>
                <p class="text-xs text-zinc-400">Supports JPG, PNG, WEBP</p>
              </div>
              
              <!-- Image Preview Container -->
              <div id="modal-preview-container" class="hidden relative rounded-lg overflow-hidden max-h-80 bg-black">
                <img id="modal-image-preview" src="" alt="Preview" class="w-full h-full object-contain mx-auto max-h-80">
                <button type="button" id="modal-remove-image-btn" class="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <!-- Quick sample photo picks -->
            <div class="flex items-center gap-2 overflow-x-auto py-1">
              <span class="text-xs font-semibold text-zinc-500 whitespace-nowrap">Or pick sample:</span>
              <button type="button" class="sample-photo-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80">🏝️ Beach</button>
              <button type="button" class="sample-photo-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80">💻 Tech</button>
              <button type="button" class="sample-photo-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80">🍜 Food</button>
              <button type="button" class="sample-photo-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80">🛋️ Architecture</button>
            </div>

            <!-- Caption Input -->
            <div>
              <textarea 
                id="modal-caption-input" 
                rows="3" 
                placeholder="Write a caption... Add #vibesta or tags ✨" 
                class="w-full p-3 bg-zinc-50 focus:bg-white text-sm text-zinc-800 rounded-xl border border-zinc-200 focus:border-zinc-400 focus:outline-none resize-none transition-all"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              id="modal-submit-post-btn" 
              class="w-full py-2.5 rounded-xl font-semibold text-white brand-gradient-bg hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-pink-500/20 disabled:opacity-50"
            >
              Share Post
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  bindEvents() {
    // Modal Openers
    const openBtns = [
      document.getElementById('open-create-modal-btn'),
      document.getElementById('mobile-create-btn')
    ];
    const modal = document.getElementById('create-post-modal');
    const closeBtn = document.getElementById('close-create-modal');

    openBtns.forEach(btn => {
      if (btn && modal) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          modal.classList.remove('hidden');
        });
      }
    });

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }

    // Modal Image Picker & Sample Photos
    const fileInput = document.getElementById('modal-image-input');
    const dropzone = document.getElementById('modal-dropzone');
    const promptEl = document.getElementById('modal-dropzone-prompt');
    const previewContainer = document.getElementById('modal-preview-container');
    const previewImg = document.getElementById('modal-image-preview');
    const removeBtn = document.getElementById('modal-remove-image-btn');
    let selectedImageBase64 = '';

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== removeBtn && !removeBtn?.contains(e.target)) {
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            selectedImageBase64 = loadEvt.target.result;
            previewImg.src = selectedImageBase64;
            previewContainer.classList.remove('hidden');
            promptEl.classList.add('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedImageBase64 = '';
        fileInput.value = '';
        previewContainer.classList.add('hidden');
        promptEl.classList.remove('hidden');
      });
    }

    // Quick Sample photos
    document.querySelectorAll('.sample-photo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        selectedImageBase64 = url;
        previewImg.src = url;
        previewContainer.classList.remove('hidden');
        promptEl.classList.add('hidden');
      });
    });

    // Modal Form Submit
    const modalForm = document.getElementById('modal-create-post-form');
    if (modalForm) {
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const caption = document.getElementById('modal-caption-input').value.trim();
        const submitBtn = document.getElementById('modal-submit-post-btn');

        if (!selectedImageBase64) {
          api.showToast('Please select or pick a photo first!', 'warning');
          return;
        }

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Posting...';

          const formData = new FormData();
          formData.append('caption', caption);
          formData.append('imagePreview', selectedImageBase64);
          if (fileInput && fileInput.files[0]) {
            formData.append('image', fileInput.files[0]);
          }

          const res = await api.post('/posts', formData, true);
          if (res && res.success) {
            api.showToast('Post shared to Vibesta!', 'success');
            modal.classList.add('hidden');
            modalForm.reset();
            selectedImageBase64 = '';
            previewContainer.classList.add('hidden');
            promptEl.classList.remove('hidden');

            // If we are on the feed or profile page, refresh posts
            if (typeof Feed !== 'undefined' && Feed.loadPosts) {
              Feed.loadPosts();
            } else if (typeof Profile !== 'undefined' && Profile.loadProfile) {
              Profile.loadProfile();
            } else {
              window.location.href = 'index.html';
            }
          }
        } catch (err) {
          api.showToast(err.message || 'Failed to create post', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Share Post';
        }
      });
    }

    // Search bar functionality
    const searchInput = document.getElementById('nav-search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    if (searchInput && searchDropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          searchDropdown.classList.add('hidden');
          return;
        }

        const users = (typeof api !== 'undefined' && api.getStoredUsers) 
          ? api.getStoredUsers() 
          : JSON.parse(localStorage.getItem(CONFIG.MOCK_USERS_KEY) || '[]');
        const matches = users.filter(u => 
          u.username.toLowerCase().includes(query) || 
          (u.name && u.name.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
          searchDropdown.innerHTML = `<div class="p-3 text-xs text-zinc-400 text-center">No users found for "${query}"</div>`;
        } else {
          searchDropdown.innerHTML = matches.map(u => `
            <a href="profile.html?username=${encodeURIComponent(u.username)}" class="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 transition-colors">
              <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover border border-zinc-200">
              <div class="text-left">
                <p class="text-xs font-bold text-zinc-800">${u.username}</p>
                <p class="text-[11px] text-zinc-400 truncate max-w-[180px]">${u.name || ''}</p>
              </div>
            </a>
          `).join('');
        }
        searchDropdown.classList.remove('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.add('hidden');
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Navbar.render();
});
