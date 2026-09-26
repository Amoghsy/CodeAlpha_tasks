// Vibesta Instagram-Style Story Viewer & Story Creator Module

const StoryViewer = {
  stories: [],
  currentStoryIndex: 0,
  currentItemIndex: 0,
  timer: null,
  progressStartTime: 0,
  duration: 5000, // 5 seconds per story
  remainingTime: 5000,
  isPaused: false,

  init() {
    this.injectViewerModal();
    this.injectAddStoryModal();
    this.bindGlobalKeyEvents();
  },

  injectViewerModal() {
    if (document.getElementById('story-viewer-modal')) return;

    const modalHTML = `
      <div id="story-viewer-modal" class="fixed inset-0 z-[100] hidden bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-200">
        
        <!-- Desktop Previous User Arrow -->
        <button id="story-prev-user-btn" class="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-20 backdrop-blur-md">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>

        <!-- Main Story Container Card (9:16 vertical ratio) -->
        <div id="story-card" class="relative w-full h-full md:h-[92vh] md:max-h-[820px] md:max-w-[430px] md:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between">
          
          <!-- Top Overlay: Multi-segment Progress Bars + User Info -->
          <div class="relative z-30 p-4 pt-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-3 pointer-events-auto">
            
            <!-- Progress Bars Container -->
            <div id="story-progress-container" class="flex items-center gap-1.5 w-full">
              <!-- Dynamically generated segments -->
            </div>

            <!-- User Header & Controls -->
            <div class="flex items-center justify-between">
              <a id="story-author-link" href="#" class="flex items-center gap-2.5 group">
                <img id="story-author-avatar" src="" alt="Avatar" class="w-9 h-9 rounded-full object-cover border border-white/80">
                <div>
                  <div class="flex items-center gap-2">
                    <span id="story-author-username" class="text-sm font-bold text-white group-hover:underline"></span>
                    <span id="story-timestamp" class="text-xs text-white/70"></span>
                  </div>
                </div>
              </a>

              <div class="flex items-center gap-2 text-white">
                <!-- Pause/Play Toggle -->
                <button id="story-pause-btn" class="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors" title="Pause / Play">
                  <svg id="story-pause-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </button>

                <!-- Close Button -->
                <button id="story-close-btn" class="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors" title="Close (Esc)">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Story Media (Image) Container -->
          <div class="absolute inset-0 z-10 bg-zinc-950 flex items-center justify-center overflow-hidden">
            <img id="story-media-image" src="" alt="Story media" class="w-full h-full object-cover select-none">
            <!-- Vignette shadow for legibility -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
          </div>

          <!-- Caption Text / Sticker Overlay -->
          <div id="story-caption-container" class="relative z-20 px-5 mb-3 pointer-events-none">
            <p id="story-caption-text" class="text-white text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] inline-block px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md max-w-full break-words"></p>
          </div>

          <!-- Invisible Tap Navigation Zones (Left 35% / Right 65%) -->
          <div class="absolute inset-0 z-20 flex">
            <div id="story-tap-left" class="w-[35%] h-[82%] cursor-pointer" title="Previous story"></div>
            <div id="story-tap-right" class="w-[65%] h-[82%] cursor-pointer" title="Next story"></div>
          </div>

          <!-- Bottom: Reply Input & Quick Heart Reaction Bar -->
          <div class="relative z-30 p-4 pt-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center gap-3">
            <form id="story-reply-form" class="flex-1 flex items-center gap-2">
              <input 
                type="text" 
                id="story-reply-input" 
                placeholder="Send message..." 
                autocomplete="off"
                class="w-full px-4 py-2.5 rounded-full bg-white/15 border border-white/25 focus:border-white/60 text-white placeholder-white/60 text-xs focus:outline-none transition-all backdrop-blur-md"
              />
              <button 
                type="submit" 
                class="hidden px-3 py-2 rounded-full brand-gradient-bg text-white text-xs font-bold transition-all"
                id="story-send-reply-btn"
              >
                Send
              </button>
            </form>

            <!-- Quick Heart Floating Reaction -->
            <button 
              type="button" 
              id="story-heart-reaction-btn" 
              class="p-2 text-white hover:text-rose-400 active:scale-125 transition-transform" 
              title="React with Love"
            >
              <svg class="w-7 h-7 fill-white hover:fill-rose-500 transition-colors" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          <!-- Reaction Container for floating hearts -->
          <div id="story-reactions-box" class="absolute inset-0 pointer-events-none z-40 overflow-hidden"></div>
        </div>

        <!-- Desktop Next User Arrow -->
        <button id="story-next-user-btn" class="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-20 backdrop-blur-md">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
        </button>

      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.bindViewerEvents();
  },

  injectAddStoryModal() {
    if (document.getElementById('add-story-modal')) return;

    const modalHTML = `
      <div id="add-story-modal" class="fixed inset-0 z-[110] hidden bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
        <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
          
          <div class="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between">
            <h3 class="text-sm font-bold text-zinc-900">Add to your Story</h3>
            <button id="close-add-story-modal" class="text-zinc-400 hover:text-zinc-700 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form id="add-story-form" class="p-5 space-y-4">
            <!-- Image Selector -->
            <div id="story-dropzone" class="border-2 border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-zinc-50/50">
              <input type="file" id="story-file-input" accept="image/*" class="hidden">
              <div id="story-dropzone-prompt" class="space-y-2">
                <div class="w-10 h-10 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <p class="text-xs font-bold text-zinc-700">Choose a photo for your story</p>
                <p class="text-[11px] text-zinc-400">JPG, PNG, or pick a sample below</p>
              </div>

              <!-- Preview -->
              <div id="story-preview-container" class="hidden relative rounded-lg overflow-hidden max-h-60 bg-black">
                <img id="story-image-preview" src="" alt="Preview" class="w-full h-full object-cover max-h-60">
              </div>
            </div>

            <!-- Preset Samples -->
            <div class="flex items-center gap-2 overflow-x-auto py-1">
              <span class="text-xs font-semibold text-zinc-500 whitespace-nowrap">Presets:</span>
              <button type="button" class="story-sample-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80">💻 Tech Vibe</button>
              <button type="button" class="story-sample-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80">🏝️ Sunset</button>
              <button type="button" class="story-sample-btn text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 whitespace-nowrap" data-url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80">🌆 City Lights</button>
            </div>

            <!-- Optional Caption / Sticker -->
            <div>
              <input 
                type="text" 
                id="story-caption-input" 
                placeholder="Add a caption or sticker text (optional)..." 
                class="w-full p-3 bg-zinc-50 focus:bg-white text-xs text-zinc-900 rounded-xl border border-zinc-200 focus:border-zinc-400 focus:outline-none transition-colors"
              />
            </div>

            <button 
              type="submit" 
              class="w-full py-2.5 rounded-xl font-bold text-xs text-white brand-gradient-bg hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-pink-500/20"
            >
              Share to Story
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.bindAddStoryEvents();
  },

  bindViewerEvents() {
    const modal = document.getElementById('story-viewer-modal');
    const closeBtn = document.getElementById('story-close-btn');
    const pauseBtn = document.getElementById('story-pause-btn');
    const tapLeft = document.getElementById('story-tap-left');
    const tapRight = document.getElementById('story-tap-right');
    const prevUserBtn = document.getElementById('story-prev-user-btn');
    const nextUserBtn = document.getElementById('story-next-user-btn');
    const heartBtn = document.getElementById('story-heart-reaction-btn');
    const replyForm = document.getElementById('story-reply-form');
    const replyInput = document.getElementById('story-reply-input');
    const sendBtn = document.getElementById('story-send-reply-btn');

    closeBtn?.addEventListener('click', () => this.close());
    
    // Tap Navigation (left/right)
    tapLeft?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });

    tapRight?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });

    prevUserBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevUser();
    });

    nextUserBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextUser();
    });

    pauseBtn?.addEventListener('click', () => {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    });

    // Quick heart reaction
    heartBtn?.addEventListener('click', () => {
      this.triggerFloatingReaction();
      api.showToast('Reacted with ❤️', 'info');
    });

    // Reply Form
    if (replyInput && sendBtn) {
      replyInput.addEventListener('focus', () => this.pause());
      replyInput.addEventListener('blur', () => {
        if (!replyInput.value.trim()) this.resume();
      });

      replyInput.addEventListener('input', () => {
        if (replyInput.value.trim()) {
          sendBtn.classList.remove('hidden');
        } else {
          sendBtn.classList.add('hidden');
        }
      });

      replyForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = replyInput.value.trim();
        if (!text) return;
        const currentStory = this.stories[this.currentStoryIndex];
        api.showToast(`Reply sent to ${currentStory.username}!`, 'success');
        replyInput.value = '';
        sendBtn.classList.add('hidden');
        replyInput.blur();
        this.resume();
      });
    }
  },

  bindAddStoryEvents() {
    const addModal = document.getElementById('add-story-modal');
    const closeBtn = document.getElementById('close-add-story-modal');
    const dropzone = document.getElementById('story-dropzone');
    const fileInput = document.getElementById('story-file-input');
    const promptEl = document.getElementById('story-dropzone-prompt');
    const previewContainer = document.getElementById('story-preview-container');
    const previewImg = document.getElementById('story-image-preview');
    const form = document.getElementById('add-story-form');
    let selectedImage = '';

    closeBtn?.addEventListener('click', () => addModal.classList.add('hidden'));

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            selectedImage = loadEvt.target.result;
            previewImg.src = selectedImage;
            previewContainer.classList.remove('hidden');
            promptEl.classList.add('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    document.querySelectorAll('.story-sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedImage = btn.dataset.url;
        previewImg.src = selectedImage;
        previewContainer.classList.remove('hidden');
        promptEl.classList.add('hidden');
      });
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedImage) {
        api.showToast('Please select or pick a photo for your story!', 'warning');
        return;
      }

      const caption = document.getElementById('story-caption-input').value.trim();
      const currentUser = Auth.getUser() || {
        id: 'user_1',
        username: 'vibesta_creator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      };

      const stories = api.getStoredStories();
      let userStory = stories.find(s => s.userId === currentUser.id);

      const newItem = {
        id: 's_' + Date.now(),
        image: selectedImage,
        caption: caption || '',
        timestamp: 'Just now'
      };

      if (userStory) {
        userStory.items.unshift(newItem);
      } else {
        stories.unshift({
          userId: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          items: [newItem]
        });
      }

      api.saveStoredStories(stories);
      api.showToast('Story added!', 'success');
      addModal.classList.add('hidden');
      form.reset();
      selectedImage = '';
      previewContainer.classList.add('hidden');
      promptEl.classList.remove('hidden');

      // Refresh stories bar on feed if available
      if (typeof Feed !== 'undefined' && Feed.renderStories) {
        Feed.renderStories();
      }

      // Automatically open the user's newly created story!
      this.open(currentUser.id, 0);
    });
  },

  bindGlobalKeyEvents() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('story-viewer-modal');
      if (!modal || modal.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (this.isPaused) this.resume(); else this.pause();
      }
    });
  },

  async open(userId, itemIndex = 0) {
    this.stories = api.getStoredStories();

    if (!this.stories || this.stories.length === 0) {
      api.showToast('No stories available right now', 'info');
      return;
    }

    let foundIdx = this.stories.findIndex(s => s.userId === userId || s.username === userId);
    if (foundIdx === -1) foundIdx = 0;

    this.currentStoryIndex = foundIdx;
    this.currentItemIndex = itemIndex;

    const modal = document.getElementById('story-viewer-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    this.renderCurrentItem();
  },

  close() {
    this.clearTimer();
    const modal = document.getElementById('story-viewer-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.isPaused = false;
  },

  renderCurrentItem() {
    this.clearTimer();

    const currentStory = this.stories[this.currentStoryIndex];
    if (!currentStory || !currentStory.items || currentStory.items.length === 0) {
      this.close();
      return;
    }

    // Mark current user's story as viewed
    api.markStoryViewed(currentStory.userId);
    if (typeof Feed !== 'undefined' && Feed.renderStories) {
      Feed.renderStories();
    }

    const item = currentStory.items[this.currentItemIndex];

    // Render Progress Bar Segments
    const progressContainer = document.getElementById('story-progress-container');
    const itemsCount = currentStory.items.length;

    progressContainer.innerHTML = Array.from({ length: itemsCount }).map((_, idx) => {
      let innerStyle = 'width: 0%;';
      if (idx < this.currentItemIndex) {
        innerStyle = 'width: 100%;';
      }
      return `
        <div class="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
          <div class="h-full bg-white rounded-full transition-all duration-100 ease-linear story-bar-fill" id="story-bar-${idx}" style="${innerStyle}"></div>
        </div>
      `;
    }).join('');

    // Update Header
    document.getElementById('story-author-avatar').src = currentStory.avatar;
    document.getElementById('story-author-username').textContent = currentStory.username;
    document.getElementById('story-author-link').href = `profile.html?username=${encodeURIComponent(currentStory.username)}`;
    document.getElementById('story-timestamp').textContent = `• ${item.timestamp || 'Just now'}`;

    // Update Media Image
    const mediaImg = document.getElementById('story-media-image');
    mediaImg.src = item.image;

    // Update Caption Text
    const captionContainer = document.getElementById('story-caption-container');
    const captionText = document.getElementById('story-caption-text');
    if (item.caption) {
      captionText.textContent = item.caption;
      captionContainer.classList.remove('hidden');
    } else {
      captionContainer.classList.add('hidden');
    }

    // Reset reply input
    const replyInput = document.getElementById('story-reply-input');
    if (replyInput) {
      replyInput.value = '';
      replyInput.placeholder = `Reply to ${currentStory.username}...`;
    }

    // Start 5-second progress animation & auto-advance timer
    this.remainingTime = this.duration;
    this.startTimer();
  },

  startTimer() {
    this.clearTimer();
    this.progressStartTime = Date.now();
    this.isPaused = false;
    this.updatePauseIcon();

    const activeBar = document.getElementById(`story-bar-${this.currentItemIndex}`);
    const initialElapsed = this.duration - this.remainingTime;

    // Frame-by-frame progress bar update for fluid animation
    const updateProgress = () => {
      if (this.isPaused) return;

      const elapsed = (Date.now() - this.progressStartTime) + initialElapsed;
      const progressPercent = Math.min(100, (elapsed / this.duration) * 100);

      if (activeBar) {
        activeBar.style.width = `${progressPercent}%`;
      }

      if (elapsed >= this.duration) {
        this.next();
      } else {
        this.timer = requestAnimationFrame(updateProgress);
      }
    };

    this.timer = requestAnimationFrame(updateProgress);
  },

  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    cancelAnimationFrame(this.timer);
    const elapsedSinceStart = Date.now() - this.progressStartTime;
    this.remainingTime = Math.max(0, this.remainingTime - elapsedSinceStart);
    this.updatePauseIcon();
  },

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.startTimer();
  },

  updatePauseIcon() {
    const pauseIcon = document.getElementById('story-pause-icon');
    if (!pauseIcon) return;
    if (this.isPaused) {
      // Play icon
      pauseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
    } else {
      // Pause icon
      pauseIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
    }
  },

  clearTimer() {
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  },

  next() {
    const currentStory = this.stories[this.currentStoryIndex];
    if (this.currentItemIndex < currentStory.items.length - 1) {
      this.currentItemIndex++;
      this.renderCurrentItem();
    } else {
      this.nextUser();
    }
  },

  prev() {
    if (this.currentItemIndex > 0) {
      this.currentItemIndex--;
      this.renderCurrentItem();
    } else {
      this.prevUser();
    }
  },

  nextUser() {
    if (this.currentStoryIndex < this.stories.length - 1) {
      this.currentStoryIndex++;
      this.currentItemIndex = 0;
      this.renderCurrentItem();
    } else {
      // Finished all stories!
      this.close();
    }
  },

  prevUser() {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
      this.currentItemIndex = 0;
      this.renderCurrentItem();
    } else {
      this.currentItemIndex = 0;
      this.renderCurrentItem();
    }
  },

  triggerFloatingReaction() {
    const container = document.getElementById('story-reactions-box');
    if (!container) return;

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'story-floating-reaction';
        heart.style.right = `${16 + Math.random() * 32}px`;
        heart.innerHTML = `
          <svg class="w-10 h-10 fill-rose-500 text-rose-500 filter drop-shadow-md" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        `;
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
      }, i * 150);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  StoryViewer.init();
});
