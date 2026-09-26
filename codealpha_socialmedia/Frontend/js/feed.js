// Vibesta Feed Controller
// Renders stories, post cards, double-tap like, optimistic like toggle, inline comments, load more

const Feed = {
  posts: [],
  page: 1,
  isLoading: false,

  async init() {
    Auth.requireAuth();
    this.renderSidebar();
    await this.loadPosts();
    this.renderStories();
    this.bindScroll();
  },

  renderStories() {
    const storiesContainer = document.getElementById('stories-container');
    if (!storiesContainer) return;

    const stories = (typeof api !== 'undefined' && api.getStoredStories) ? api.getStoredStories() : [];
    const viewedStories = (typeof api !== 'undefined' && api.getViewedStories) ? api.getViewedStories() : [];
    const currentUser = Auth.getUser() || {
      id: 'user_1',
      username: 'vibesta_creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };

    const myStory = stories.find(s => s.userId === currentUser.id);
    const hasMyStory = myStory && myStory.items && myStory.items.length > 0;
    const isMyStoryViewed = viewedStories.includes(currentUser.id);

    let storiesHTML = `
      <!-- Your Story Bubble -->
      <div class="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group" id="my-story-bubble">
        <div class="relative p-0.5 rounded-full ${hasMyStory ? (isMyStoryViewed ? 'story-ring-viewed' : 'story-ring-gradient') : 'border border-dashed border-zinc-300'} group-hover:scale-105 transition-transform duration-200">
          <div class="p-0.5 bg-white rounded-full">
            <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" class="w-14 h-14 rounded-full object-cover">
          </div>
          <button id="add-story-plus-btn" class="absolute bottom-0 right-0 w-4 h-4 rounded-full brand-gradient-bg text-white flex items-center justify-center text-xs font-extrabold ring-2 ring-white hover:scale-110 transition-transform" title="Add to story">+</button>
        </div>
        <span class="text-xs text-zinc-700 font-medium">Your story</span>
      </div>
    `;

    // Render other users' stories
    stories.filter(s => s.userId !== currentUser.id).forEach(s => {
      const isViewed = viewedStories.includes(s.userId);
      storiesHTML += `
        <div class="story-user-bubble flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group" data-user-id="${s.userId}">
          <div class="p-0.5 rounded-full ${isViewed ? 'story-ring-viewed' : 'story-ring-gradient'} group-hover:scale-105 transition-transform duration-200">
            <div class="p-0.5 bg-white rounded-full">
              <img src="${s.avatar}" class="w-14 h-14 rounded-full object-cover">
            </div>
          </div>
          <span class="text-xs ${isViewed ? 'text-zinc-500' : 'text-zinc-800 font-semibold'} truncate max-w-[68px]">${s.username}</span>
        </div>
      `;
    });

    storiesContainer.innerHTML = storiesHTML;

    // Bind Click Events
    const myStoryBubble = document.getElementById('my-story-bubble');
    const addStoryPlusBtn = document.getElementById('add-story-plus-btn');

    if (myStoryBubble) {
      myStoryBubble.addEventListener('click', (e) => {
        if (e.target === addStoryPlusBtn || addStoryPlusBtn.contains(e.target)) {
          document.getElementById('add-story-modal')?.classList.remove('hidden');
        } else {
          if (hasMyStory) {
            StoryViewer.open(currentUser.id);
          } else {
            document.getElementById('add-story-modal')?.classList.remove('hidden');
          }
        }
      });
    }

    storiesContainer.querySelectorAll('.story-user-bubble').forEach(bubble => {
      bubble.addEventListener('click', () => {
        const userId = bubble.dataset.userId;
        StoryViewer.open(userId);
      });
    });
  },

  renderSidebar() {
    const sidebarEl = document.getElementById('feed-sidebar');
    if (!sidebarEl) return;

    const currentUser = Auth.getUser() || {
      username: 'vibesta_creator',
      name: 'Amogh | Vibesta',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };

    const users = JSON.parse(localStorage.getItem(CONFIG.MOCK_USERS_KEY) || '[]');
    const suggestions = users.filter(u => u.username !== currentUser.username).slice(0, 4);

    sidebarEl.innerHTML = `
      <!-- Current User Profile Pill -->
      <div class="flex items-center justify-between mb-6">
        <a href="profile.html?username=${encodeURIComponent(currentUser.username)}" class="flex items-center gap-3 group">
          <img src="${currentUser.avatar}" class="w-12 h-12 rounded-full object-cover border border-zinc-200 group-hover:opacity-90">
          <div>
            <h4 class="text-sm font-bold text-zinc-900 group-hover:underline">${currentUser.username}</h4>
            <p class="text-xs text-zinc-500 truncate max-w-[140px]">${currentUser.name || 'Vibesta User'}</p>
          </div>
        </a>
        <a href="edit-profile.html" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Switch</a>
      </div>

      ${suggestions.length > 0 ? `
        <!-- Suggested for you -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-bold text-zinc-400">Suggested for you</span>
          <a href="#" class="text-xs font-semibold text-zinc-800 hover:opacity-70">See All</a>
        </div>

        <div class="space-y-3.5">
          ${suggestions.map(u => `
            <div class="flex items-center justify-between">
              <a href="profile.html?username=${encodeURIComponent(u.username)}" class="flex items-center gap-2.5 group">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover border border-zinc-100">
                <div>
                  <p class="text-xs font-bold text-zinc-800 group-hover:underline">${u.username}</p>
                  <p class="text-[11px] text-zinc-400">Suggested for you</p>
                </div>
              </a>
              <button 
                class="sidebar-follow-btn text-xs font-semibold ${u.isFollowing ? 'text-zinc-500 hover:text-rose-500' : 'text-blue-600 hover:text-blue-700'}" 
                data-user-id="${u.id}"
              >
                ${u.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Footer Info -->
      <div class="mt-8 text-[11px] text-zinc-400 space-y-2">
        <div class="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" class="hover:underline">About</a> •
          <a href="#" class="hover:underline">Help</a> •
          <a href="#" class="hover:underline">Press</a> •
          <a href="#" class="hover:underline">API</a> •
          <a href="#" class="hover:underline">Privacy</a> •
          <a href="#" class="hover:underline">Terms</a>
        </div>
        <p>© 2026 VIBESTA SOCIAL FROM CODEALPHA</p>
      </div>
    `;

    // Bind sidebar follow buttons
    sidebarEl.querySelectorAll('.sidebar-follow-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = btn.dataset.userId;
        const isNowFollowing = btn.textContent.trim() === 'Follow';
        btn.textContent = isNowFollowing ? 'Following' : 'Follow';
        btn.className = `sidebar-follow-btn text-xs font-semibold ${isNowFollowing ? 'text-zinc-500 hover:text-rose-500' : 'text-blue-600 hover:text-blue-700'}`;
        await api.post(`/users/${userId}/follow`);
      });
    });
  },

  async loadPosts() {
    const feedContainer = document.getElementById('posts-container');
    if (!feedContainer) return;

    if (this.posts.length === 0) {
      // Show skeleton loader
      this.renderSkeletons(feedContainer, 2);
    }

    try {
      this.isLoading = true;
      const res = await api.get('/posts/feed');
      if (res && res.posts) {
        this.posts = res.posts;
        this.renderPosts(feedContainer);
      }
    } catch (err) {
      api.showToast('Could not load feed. Using offline cache.', 'warning');
    } finally {
      this.isLoading = false;
    }
  },

  renderSkeletons(container, count = 2) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
      skeletons += `
        <div class="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
          <div class="flex items-center gap-3 p-3.5">
            <div class="w-10 h-10 rounded-full skeleton"></div>
            <div class="space-y-1.5 flex-1">
              <div class="h-3 w-28 skeleton rounded"></div>
              <div class="h-2.5 w-16 skeleton rounded"></div>
            </div>
          </div>
          <div class="w-full aspect-square skeleton"></div>
          <div class="p-4 space-y-3">
            <div class="h-4 w-20 skeleton rounded"></div>
            <div class="h-3 w-3/4 skeleton rounded"></div>
            <div class="h-3 w-1/2 skeleton rounded"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = skeletons;
  },

  renderPosts(container) {
    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-sm">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h3 class="text-base font-bold text-zinc-800">No posts in your feed yet</h3>
          <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Follow other users or create your first post to see the magic happen!</p>
          <button id="empty-feed-create-btn" class="mt-4 px-4 py-2 brand-gradient-bg text-white text-xs font-semibold rounded-xl shadow-md shadow-pink-500/20">Create a Post</button>
        </div>
      `;
      document.getElementById('empty-feed-create-btn')?.addEventListener('click', () => {
        document.getElementById('create-post-modal')?.classList.remove('hidden');
      });
      return;
    }

    container.innerHTML = this.posts.map(post => this.createPostCardHTML(post)).join('');
    this.bindPostInteractions(container);
  },

  createPostCardHTML(post) {
    const author = post.user || post.author || {
      username: 'creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };

    const authorAvatar = author.avatar_url || author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    const postImage = post.image_url || post.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    const isLiked = post.is_liked !== undefined ? post.is_liked : !!post.isLiked;
    const likesCount = post.likes_count !== undefined ? post.likes_count : (post.likesCount || 0);
    const commentsCount = post.comments_count !== undefined ? post.comments_count : (post.comments ? post.comments.length : 0);
    const comments = post.comments || [];
    const dateVal = post.created_at || post.createdAt;
    const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently';

    return `
      <article class="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden mb-6 shadow-sm transition-all post-card" data-post-id="${post.id}">
        
        <!-- Post Header -->
        <header class="flex items-center justify-between px-4 py-3">
          <a href="profile.html?username=${encodeURIComponent(author.username)}" class="flex items-center gap-3 group">
            <div class="p-0.5 rounded-full story-ring-gradient">
              <img src="${authorAvatar}" alt="${author.username}" class="w-8 h-8 rounded-full object-cover border border-white">
            </div>
            <div>
              <span class="text-sm font-bold text-zinc-900 group-hover:underline">${author.username}</span>
              <span class="text-[11px] text-zinc-400 block">${formattedDate}</span>
            </div>
          </a>
          <button class="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" stroke-width="2"/><circle cx="6" cy="12" r="1.5" stroke-width="2"/><circle cx="18" cy="12" r="1.5" stroke-width="2"/></svg>
          </button>
        </header>

        <!-- Post Image with Double Tap Container -->
        <div class="relative w-full aspect-square bg-zinc-950 overflow-hidden post-image-wrapper cursor-pointer select-none">
          <img 
            src="${postImage}" 
            alt="Post photo" 
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]" 
            loading="lazy"
          />
          <!-- Double Tap Big Floating Heart Container -->
          <div class="heart-animation-container absolute inset-0 pointer-events-none flex items-center justify-center"></div>
        </div>

        <!-- Action Buttons -->
        <div class="p-4 pb-2">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <!-- Like Button -->
              <button 
                class="like-btn p-1 -ml-1 text-zinc-800 hover:opacity-80 transition-transform active:scale-125 focus:outline-none" 
                data-liked="${isLiked}"
              >
                ${isLiked ? `
                  <svg class="w-7 h-7 text-rose-500 fill-rose-500 animate-heart-pop" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ` : `
                  <svg class="w-7 h-7 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                `}
              </button>

              <!-- Comment Button -->
              <a href="post.html?id=${post.id}" class="p-1 text-zinc-800 hover:opacity-70 transition-opacity" title="Comment">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </a>

              <!-- Share Button -->
              <button class="share-btn p-1 text-zinc-800 hover:opacity-70 transition-opacity" title="Share">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </button>
            </div>

            <!-- Bookmark Button -->
            <button class="bookmark-btn p-1 text-zinc-800 hover:opacity-70 transition-opacity" title="Save">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </button>
          </div>

          <!-- Likes Count -->
          <div class="mb-1.5">
            <span class="likes-count-display text-sm font-bold text-zinc-900">${likesCount.toLocaleString()} ${likesCount === 1 ? 'like' : 'likes'}</span>
          </div>

          <!-- Caption -->
          <div class="text-sm text-zinc-900 space-x-1.5">
            <a href="profile.html?username=${encodeURIComponent(author.username)}" class="font-bold hover:underline">${author.username}</a>
            <span class="text-zinc-800 font-normal">${this.escapeHTML(post.caption || '')}</span>
          </div>

          <!-- Comments Link & Preview -->
          ${comments.length > 0 ? `
            <a href="post.html?id=${post.id}" class="inline-block mt-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors">
              View all ${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}
            </a>
            <!-- Latest comment snippet -->
            <div class="mt-1 text-xs text-zinc-700 truncate">
              <span class="font-bold">${this.escapeHTML(comments[comments.length - 1].username)}:</span>
              <span class="text-zinc-600">${this.escapeHTML(comments[comments.length - 1].text)}</span>
            </div>
          ` : `
            <span class="inline-block mt-1 text-xs text-zinc-400">No comments yet</span>
          `}
        </div>

        <!-- Inline Add Comment Input -->
        <form class="quick-comment-form border-t border-zinc-100 px-4 py-2.5 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Add a comment..." 
            class="comment-input flex-1 text-xs text-zinc-800 bg-transparent focus:outline-none placeholder-zinc-400"
          />
          <button 
            type="submit" 
            class="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-30 transition-opacity" 
            disabled
          >
            Post
          </button>
        </form>
      </article>
    `;
  },

  bindPostInteractions(container) {
    const cards = container.querySelectorAll('.post-card');

    cards.forEach(card => {
      const postId = card.dataset.postId;
      const likeBtn = card.querySelector('.like-btn');
      const likesCountDisplay = card.querySelector('.likes-count-display');
      const imageWrapper = card.querySelector('.post-image-wrapper');
      const commentForm = card.querySelector('.quick-comment-form');
      const commentInput = card.querySelector('.comment-input');
      const submitCommentBtn = commentForm?.querySelector('button');
      const shareBtn = card.querySelector('.share-btn');
      const bookmarkBtn = card.querySelector('.bookmark-btn');

      // 1. Like Toggle Action (Optimistic UI Update)
      const toggleLike = async () => {
        const isCurrentlyLiked = likeBtn.dataset.liked === 'true';
        const newLikedState = !isCurrentlyLiked;
        
        let count = parseInt(likesCountDisplay.textContent.replace(/[^0-9]/g, '')) || 0;
        count = newLikedState ? count + 1 : Math.max(0, count - 1);

        // Optimistic UI updates
        likeBtn.dataset.liked = newLikedState;
        likesCountDisplay.textContent = `${count.toLocaleString()} ${count === 1 ? 'like' : 'likes'}`;
        
        if (newLikedState) {
          likeBtn.innerHTML = `
            <svg class="w-7 h-7 text-rose-500 fill-rose-500 animate-heart-pop" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          `;
        } else {
          likeBtn.innerHTML = `
            <svg class="w-7 h-7 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          `;
        }

        try {
          await api.post(`/posts/${postId}/like`);
        } catch (err) {
          // Revert on error
          likeBtn.dataset.liked = isCurrentlyLiked;
          api.showToast('Could not update like state', 'error');
        }
      };

      if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleLike();
        });
      }

      // 2. Double Tap to Like on Post Image
      let lastTap = 0;
      if (imageWrapper) {
        imageWrapper.addEventListener('click', (e) => {
          const currentTime = new Date().getTime();
          const tapLength = currentTime - lastTap;
          if (tapLength < 300 && tapLength > 0) {
            // Double tap detected!
            this.triggerDoubleTapAnimation(imageWrapper);
            if (likeBtn.dataset.liked !== 'true') {
              toggleLike();
            }
          }
          lastTap = currentTime;
        });
      }

      // 3. Quick Comment Input
      if (commentInput && submitCommentBtn) {
        commentInput.addEventListener('input', () => {
          submitCommentBtn.disabled = !commentInput.value.trim();
        });

        commentForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const text = commentInput.value.trim();
          if (!text) return;

          try {
            submitCommentBtn.disabled = true;
            submitCommentBtn.textContent = '...';

            await api.post(`/posts/${postId}/comments`, { content: text, text });
            api.showToast('Comment posted!', 'success');
            commentInput.value = '';
            
            // Reload post list or increment comment count locally
            this.loadPosts();
          } catch (err) {
            api.showToast('Failed to post comment', 'error');
          } finally {
            submitCommentBtn.textContent = 'Post';
          }
        });
      }

      // 4. Share & Bookmark
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          const shareUrl = `${window.location.origin}/pages/post.html?id=${postId}`;
          navigator.clipboard?.writeText(shareUrl);
          api.showToast('Post link copied to clipboard!', 'info');
        });
      }

      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
          const isSaved = bookmarkBtn.classList.toggle('text-yellow-500');
          bookmarkBtn.querySelector('svg').setAttribute('fill', isSaved ? 'currentColor' : 'none');
          api.showToast(isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
        });
      }
    });
  },

  triggerDoubleTapAnimation(wrapper) {
    const container = wrapper.querySelector('.heart-animation-container');
    if (!container) return;

    const heart = document.createElement('div');
    heart.className = 'double-tap-heart';
    heart.innerHTML = `
      <svg class="w-24 h-24 text-white fill-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;
    container.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 900);
  },

  bindScroll() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        api.showToast('Feed is up to date! ✨', 'info');
      });
    }
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Feed.init();
});
