// Vibesta Single Post Detail Controller
// Renders desktop split-view / mobile stacked view, handles like toggle & comment posting

const PostDetail = {
  post: null,

  async init() {
    Auth.requireAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
      api.showToast('No post ID provided', 'error');
      setTimeout(() => window.location.href = 'index.html', 1000);
      return;
    }

    await this.fetchPost(postId);
  },

  async fetchPost(postId) {
    const container = document.getElementById('post-detail-container');
    if (!container) return;

    try {
      const res = await api.get(`/posts/${postId}`);
      if (res && res.post) {
        this.post = res.post;

        try {
          const comRes = await api.get(`/posts/${postId}/comments`);
          if (comRes && comRes.comments) {
            this.post.comments = comRes.comments;
          }
        } catch (e) {
          // comments fallback
        }

        this.renderPost(container);
      } else {
        throw new Error('Post not found');
      }
    } catch (err) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl p-12 text-center border border-zinc-200">
          <p class="text-zinc-600 font-semibold mb-3">Oops! This post doesn't exist or was removed.</p>
          <a href="index.html" class="inline-block px-4 py-2 brand-gradient-bg text-white text-xs font-bold rounded-xl">Back to Feed</a>
        </div>
      `;
    }
  },

  renderPost(container) {
    const post = this.post;
    const author = post.user || post.author || {
      username: 'vibesta_user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };
    const authorAvatar = author.avatar_url || author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    const authorName = author.full_name || author.name || '';
    const postImage = post.image_url || post.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    const isLiked = post.is_liked !== undefined ? post.is_liked : !!post.isLiked;
    const likesCount = post.likes_count !== undefined ? post.likes_count : (post.likesCount || 0);
    const comments = post.comments || [];
    const dateVal = post.created_at || post.createdAt;
    const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

    container.innerHTML = `
      <div class="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row max-w-4xl mx-auto min-h-[520px]">
        
        <!-- Left Side: Post Photo -->
        <div class="md:w-7/12 bg-black flex items-center justify-center relative overflow-hidden group select-none post-photo-box">
          <img src="${postImage}" alt="Post image" class="w-full h-full object-contain max-h-[600px]">
          <div class="heart-animation-container absolute inset-0 pointer-events-none flex items-center justify-center"></div>
        </div>

        <!-- Right Side: Header, Comments, & Actions -->
        <div class="md:w-5/12 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-200 bg-white">
          
          <!-- Author Header -->
          <div class="p-4 border-b border-zinc-100 flex items-center justify-between">
            <a href="profile.html?username=${encodeURIComponent(author.username)}" class="flex items-center gap-3 group">
              <div class="p-0.5 rounded-full story-ring-gradient">
                <img src="${authorAvatar}" class="w-9 h-9 rounded-full object-cover border border-white">
              </div>
              <div>
                <p class="text-sm font-bold text-zinc-900 group-hover:underline">${author.username}</p>
                <p class="text-[11px] text-zinc-400">${authorName}</p>
              </div>
            </a>
            <button class="text-zinc-400 hover:text-zinc-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" stroke-width="2"/><circle cx="6" cy="12" r="1.5" stroke-width="2"/><circle cx="18" cy="12" r="1.5" stroke-width="2"/></svg>
            </button>
          </div>

          <!-- Scrollable Content: Caption + Comments List -->
          <div class="p-4 flex-1 overflow-y-auto max-h-[360px] md:max-h-[420px] space-y-4" id="comments-list">
            <!-- Caption as First Comment -->
            <div class="flex items-start gap-3">
              <a href="profile.html?username=${encodeURIComponent(author.username)}">
                <img src="${authorAvatar}" class="w-8 h-8 rounded-full object-cover border border-zinc-100">
              </a>
              <div class="text-xs text-zinc-800 space-y-1">
                <p>
                  <a href="profile.html?username=${encodeURIComponent(author.username)}" class="font-bold text-zinc-900 mr-1.5 hover:underline">${author.username}</a>
                  <span>${this.escapeHTML(post.caption || '')}</span>
                </p>
                <p class="text-[10px] text-zinc-400">${formattedDate}</p>
              </div>
            </div>

            <!-- Separator -->
            <div class="border-b border-zinc-100"></div>

            <!-- Comments List -->
            <div id="comments-inner" class="space-y-3.5">
              ${comments.length === 0 ? `
                <div class="py-8 text-center text-xs text-zinc-400" id="no-comments-msg">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ` : comments.map(c => {
                const comUser = c.user || { username: c.username || 'user', avatar_url: c.avatar };
                const comAvatar = comUser.avatar_url || comUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                const comUsername = comUser.username || c.username || 'user';
                const comText = c.content || c.text || '';
                const comDate = c.created_at || c.createdAt ? new Date(c.created_at || c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : (c.createdAt || 'Recently');

                return `
                  <div class="flex items-start gap-3">
                    <img src="${comAvatar}" class="w-8 h-8 rounded-full object-cover border border-zinc-100">
                    <div class="text-xs text-zinc-800 flex-1">
                      <p>
                        <a href="profile.html?username=${encodeURIComponent(comUsername)}" class="font-bold text-zinc-900 mr-1.5 hover:underline">${this.escapeHTML(comUsername)}</a>
                        <span>${this.escapeHTML(comText)}</span>
                      </p>
                      <span class="text-[10px] text-zinc-400 block mt-0.5">${comDate}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Bottom: Action Buttons, Likes Count, Date -->
          <div class="border-t border-zinc-100 p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <!-- Like Button -->
                <button id="post-like-btn" class="p-1 -ml-1 text-zinc-800 hover:opacity-80 transition-transform active:scale-125 focus:outline-none">
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

                <!-- Share -->
                <button id="post-share-btn" class="p-1 text-zinc-800 hover:opacity-70">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                </button>
              </div>

              <!-- Bookmark -->
              <button id="post-bookmark-btn" class="p-1 text-zinc-800 hover:opacity-70">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
              </button>
            </div>

            <!-- Likes Count Display -->
            <p id="post-likes-count" class="text-xs font-bold text-zinc-900">${likesCount.toLocaleString()} ${likesCount === 1 ? 'like' : 'likes'}</p>
            <p class="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">${formattedDate}</p>
          </div>

          <!-- Add Comment Form -->
          <form id="detail-comment-form" class="border-t border-zinc-100 p-3 flex items-center gap-2">
            <input 
              type="text" 
              id="detail-comment-input" 
              placeholder="Add a comment..." 
              class="flex-1 text-xs text-zinc-800 bg-transparent focus:outline-none placeholder-zinc-400"
            />
            <button 
              type="submit" 
              id="detail-comment-btn" 
              class="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-30 transition-opacity" 
              disabled
            >
              Post
            </button>
          </form>
        </div>
      </div>
    `;

    this.bindDetailEvents();
  },

  bindDetailEvents() {
    const post = this.post;
    const likeBtn = document.getElementById('post-like-btn');
    const likesCountDisplay = document.getElementById('post-likes-count');
    const photoBox = document.querySelector('.post-photo-box');
    const commentForm = document.getElementById('detail-comment-form');
    const commentInput = document.getElementById('detail-comment-input');
    const commentBtn = document.getElementById('detail-comment-btn');
    const commentsInner = document.getElementById('comments-inner');
    const noCommentsMsg = document.getElementById('no-comments-msg');
    const shareBtn = document.getElementById('post-share-btn');
    const bookmarkBtn = document.getElementById('post-bookmark-btn');

    // Toggle Like
    const toggleLike = async () => {
      const isCurrentlyLiked = post.is_liked !== undefined ? post.is_liked : !!post.isLiked;
      const newLikedState = !isCurrentlyLiked;
      post.is_liked = newLikedState;
      post.isLiked = newLikedState;
      
      let count = post.likes_count !== undefined ? post.likes_count : (post.likesCount || 0);
      count = newLikedState ? count + 1 : Math.max(0, count - 1);
      post.likes_count = count;
      post.likesCount = count;

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

      await api.post(`/posts/${post.id}/like`);
    };

    if (likeBtn) likeBtn.addEventListener('click', toggleLike);

    // Double tap on photo
    let lastTap = 0;
    if (photoBox) {
      photoBox.addEventListener('click', () => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          const container = photoBox.querySelector('.heart-animation-container');
          if (container) {
            const heart = document.createElement('div');
            heart.className = 'double-tap-heart';
            heart.innerHTML = `<svg class="w-24 h-24 text-white fill-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
            container.appendChild(heart);
            setTimeout(() => heart.remove(), 900);
          }
          if (!post.is_liked && !post.isLiked) toggleLike();
        }
        lastTap = currentTime;
      });
    }

    // Comment Input & Submit
    if (commentInput && commentBtn) {
      commentInput.addEventListener('input', () => {
        commentBtn.disabled = !commentInput.value.trim();
      });

      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const currentUser = Auth.getUser() || { username: 'vibesta_user' };
        const userAvatar = currentUser.avatar_url || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
        
        try {
          commentBtn.disabled = true;
          commentBtn.textContent = '...';

          if (noCommentsMsg) noCommentsMsg.remove();

          const newCommentHTML = `
            <div class="flex items-start gap-3 animate-in fade-in duration-200">
              <img src="${userAvatar}" class="w-8 h-8 rounded-full object-cover border border-zinc-100">
              <div class="text-xs text-zinc-800 flex-1">
                <p>
                  <span class="font-bold text-zinc-900 mr-1.5">${this.escapeHTML(currentUser.username)}</span>
                  <span>${this.escapeHTML(text)}</span>
                </p>
                <span class="text-[10px] text-zinc-400 block mt-0.5">Just now</span>
              </div>
            </div>
          `;
          commentsInner.insertAdjacentHTML('beforeend', newCommentHTML);

          // Scroll comments to bottom
          const commentsList = document.getElementById('comments-list');
          if (commentsList) commentsList.scrollTop = commentsList.scrollHeight;

          commentInput.value = '';

          await api.post(`/posts/${post.id}/comments`, { content: text, text });
          api.showToast('Comment added!', 'success');
        } catch (err) {
          api.showToast('Failed to post comment', 'error');
        } finally {
          commentBtn.textContent = 'Post';
        }
      });
    }

    // Share & Bookmark
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(window.location.href);
        api.showToast('Link copied to clipboard!', 'info');
      });
    }

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', () => {
        const isSaved = bookmarkBtn.classList.toggle('text-yellow-500');
        bookmarkBtn.querySelector('svg').setAttribute('fill', isSaved ? 'currentColor' : 'none');
        api.showToast(isSaved ? 'Saved to bookmarks' : 'Removed from bookmarks', 'info');
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
  PostDetail.init();
});
