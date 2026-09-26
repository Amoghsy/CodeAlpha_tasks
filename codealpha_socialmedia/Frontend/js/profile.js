// Vibesta Profile Controller
// Renders profile header, follow/unfollow toggle with live counters, and 3-column square thumbnail grid with hover overlay

const Profile = {
  user: null,
  posts: [],
  isOwnProfile: false,

  async init() {
    Auth.requireAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const currentUser = Auth.getUser();
    let targetUsername = urlParams.get('username');

    if (!targetUsername) {
      targetUsername = currentUser ? currentUser.username : '';
    }

    this.isOwnProfile = currentUser && (currentUser.username.toLowerCase() === (targetUsername || '').toLowerCase());
    if (targetUsername) {
      await this.loadProfile(targetUsername);
    }
  },

  async loadProfile(username) {
    const headerContainer = document.getElementById('profile-header-container');
    const gridContainer = document.getElementById('profile-grid-container');

    try {
      const res = await api.get(`/users/${encodeURIComponent(username)}`);
      if (res && res.user) {
        this.user = res.user;

        try {
          const postsRes = await api.get(`/users/${encodeURIComponent(username)}/posts`);
          this.posts = (postsRes && postsRes.posts) ? postsRes.posts : (res.posts || []);
        } catch (e) {
          this.posts = res.posts || [];
        }

        this.renderHeader(headerContainer);
        this.renderGrid(gridContainer);
      }
    } catch (err) {
      api.showToast('Could not load profile data', 'error');
    }
  },

  renderHeader(container) {
    if (!container || !this.user) return;
    const u = this.user;
    const counts = u.counts || {};
    const postCount = counts.posts !== undefined ? counts.posts : (this.posts.length || u.postsCount || 0);
    const followers = counts.followers !== undefined ? counts.followers : (u.followersCount || 0);
    const following = counts.following !== undefined ? counts.following : (u.followingCount || 0);
    const isFollowing = u.is_following !== undefined ? u.is_following : !!u.isFollowing;
    const avatarUrl = u.avatar_url || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    const displayName = u.full_name || u.name || u.username;

    const stories = (typeof api !== 'undefined' && api.getStoredStories) ? api.getStoredStories() : [];
    const userStory = stories.find(s => s.userId === u.id || s.username === u.username);
    const hasStory = userStory && userStory.items && userStory.items.length > 0;

    container.innerHTML = `
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-14 mb-8">
        
        <!-- Large Avatar with Gradient Ring -->
        <div id="profile-avatar-container" class="p-1 rounded-full ${hasStory ? 'story-ring-gradient cursor-pointer hover:scale-105' : 'border border-zinc-200'} flex-shrink-0 transition-transform duration-200" title="${hasStory ? 'View Story' : ''}">
          <div class="p-1 bg-white rounded-full">
            <img 
              src="${avatarUrl}" 
              alt="${u.username}" 
              class="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
        </div>

        <!-- Info & Actions -->
        <div class="flex-1 text-center md:text-left space-y-4">
          
          <!-- Top Row: Username + Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <h2 class="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">${u.username}</h2>
            
            <div class="flex items-center gap-2">
              ${this.isOwnProfile ? `
                <a 
                  href="edit-profile.html" 
                  class="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors border border-zinc-200"
                >
                  Edit Profile
                </a>
                <a 
                  href="create-post.html" 
                  class="px-4 py-1.5 brand-gradient-bg text-white text-xs font-semibold rounded-lg shadow-sm shadow-pink-500/20 hover:opacity-95 transition-all"
                >
                  New Post
                </a>
              ` : `
                <button 
                  id="profile-follow-btn" 
                  class="px-5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isFollowing 
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300' 
                      : 'brand-gradient-bg text-white shadow-sm shadow-pink-500/20'
                  }"
                  data-following="${isFollowing}"
                >
                  ${isFollowing ? 'Following' : 'Follow'}
                </button>
                <button class="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-200">
                  Message
                </button>
              `}
            </div>
          </div>

          <!-- Stats Counters Row -->
          <div class="flex items-center justify-center md:justify-start gap-7 md:gap-9 text-sm text-zinc-800 py-1">
            <div>
              <span class="font-extrabold text-zinc-900">${postCount.toLocaleString()}</span> posts
            </div>
            <div>
              <span id="followers-count-display" class="font-extrabold text-zinc-900">${followers.toLocaleString()}</span> followers
            </div>
            <div>
              <span class="font-extrabold text-zinc-900">${following.toLocaleString()}</span> following
            </div>
          </div>

          <!-- Bio & Name -->
          <div class="text-xs md:text-sm text-zinc-700 space-y-1">
            <h3 class="font-bold text-zinc-900">${displayName}</h3>
            <p class="whitespace-pre-line text-zinc-600 leading-relaxed">${u.bio || '✨ Living life in vibrant colors • Vibesta creator'}</p>
          </div>
        </div>
      </div>
    `;

    // Story open on avatar click
    const avatarContainer = document.getElementById('profile-avatar-container');
    if (avatarContainer && hasStory) {
      avatarContainer.addEventListener('click', () => {
        if (typeof StoryViewer !== 'undefined') {
          StoryViewer.open(u.id);
        }
      });
    }

    // Follow / Unfollow Toggle Event
    const followBtn = document.getElementById('profile-follow-btn');
    const followersDisplay = document.getElementById('followers-count-display');

    if (followBtn && followersDisplay) {
      followBtn.addEventListener('click', async () => {
        const currentlyFollowing = followBtn.dataset.following === 'true';
        const newFollowingState = !currentlyFollowing;

        let count = parseInt(followersDisplay.textContent.replace(/[^0-9]/g, '')) || 0;
        count = newFollowingState ? count + 1 : Math.max(0, count - 1);

        // Optimistic UI updates
        followBtn.dataset.following = newFollowingState;
        followBtn.textContent = newFollowingState ? 'Following' : 'Follow';
        if (newFollowingState) {
          followBtn.className = 'px-5 py-1.5 text-xs font-semibold rounded-lg transition-all bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300';
        } else {
          followBtn.className = 'px-5 py-1.5 text-xs font-semibold rounded-lg transition-all brand-gradient-bg text-white shadow-sm shadow-pink-500/20';
        }
        followersDisplay.textContent = count.toLocaleString();

        try {
          await api.post(`/users/${encodeURIComponent(u.username)}/follow`);
          api.showToast(newFollowingState ? `You are now following ${u.username}` : `Unfollowed ${u.username}`, 'info');
        } catch (err) {
          // Revert
          followBtn.dataset.following = currentlyFollowing;
          followBtn.textContent = currentlyFollowing ? 'Following' : 'Follow';
          followersDisplay.textContent = followers.toLocaleString();
          api.showToast('Could not update follow state', 'error');
        }
      });
    }
  },

  renderGrid(container) {
    if (!container) return;

    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="col-span-3 py-16 text-center bg-white rounded-2xl border border-dashed border-zinc-200 my-4">
          <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h4 class="text-sm font-bold text-zinc-800">No Posts Yet</h4>
          <p class="text-xs text-zinc-500 mt-1">When ${this.isOwnProfile ? 'you share' : `${this.user.username} shares`} photos, they will appear here.</p>
          ${this.isOwnProfile ? `
            <a href="create-post.html" class="inline-block mt-4 px-4 py-2 brand-gradient-bg text-white text-xs font-semibold rounded-xl shadow-sm">
              Share your first photo
            </a>
          ` : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = this.posts.map(post => {
      const likes = post.likes_count !== undefined ? post.likes_count : (post.likesCount || 0);
      const comments = post.comments_count !== undefined ? post.comments_count : (post.comments ? post.comments.length : 0);
      const postImage = post.image_url || post.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

      return `
        <a href="post.html?id=${post.id}" class="grid-item relative aspect-square bg-zinc-100 overflow-hidden rounded-lg group block">
          <img 
            src="${postImage}" 
            alt="Thumbnail" 
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          <!-- Hover Overlay showing Like & Comment counts -->
          <div class="grid-item-overlay absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center gap-6 text-white text-sm font-bold z-10">
            <div class="flex items-center gap-1.5">
              <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>${likes.toLocaleString()}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>${comments.toLocaleString()}</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Profile.init();
});
