// Vibesta Upload & Create Post Controller
// Handles drag-and-drop image selection, live aspect-ratio preview, caption tags, and multipart/form-data submission

const UploadController = {
  selectedFile: null,
  selectedDataUrl: '',
  aspectRatio: 'square', // 'square' or 'portrait'

  init() {
    Auth.requireAuth();

    // 1. Post Creation Form (if on create-post.html)
    const createForm = document.getElementById('create-post-page-form');
    if (createForm) {
      this.initPostCreation(createForm);
    }

    // 2. Profile Editor Form (if on edit-profile.html)
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
      this.initEditProfile(editProfileForm);
    }
  },

  initPostCreation(form) {
    const fileInput = document.getElementById('page-image-input');
    const dropzone = document.getElementById('page-dropzone');
    const dropPrompt = document.getElementById('page-dropzone-prompt');
    const previewContainer = document.getElementById('page-preview-container');
    const previewImage = document.getElementById('page-image-preview');
    const removeBtn = document.getElementById('page-remove-btn');
    const captionInput = document.getElementById('page-caption-input');
    const charCounter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('page-submit-btn');

    // Click dropzone to browse
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== removeBtn && !removeBtn?.contains(e.target)) {
          fileInput.click();
        }
      });

      // Drag and drop events
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('border-pink-500', 'bg-pink-50/20');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-pink-500', 'bg-pink-50/20');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          this.handleImageFile(files[0], previewImage, previewContainer, dropPrompt);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageFile(e.target.files[0], previewImage, previewContainer, dropPrompt);
        }
      });
    }

    // Remove photo
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedFile = null;
        this.selectedDataUrl = '';
        if (fileInput) fileInput.value = '';
        previewContainer.classList.add('hidden');
        dropPrompt.classList.remove('hidden');
      });
    }

    // Aspect ratio toggles
    document.querySelectorAll('.aspect-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.aspect-toggle-btn').forEach(b => b.classList.remove('ring-2', 'ring-pink-500', 'font-bold'));
        btn.classList.add('ring-2', 'ring-pink-500', 'font-bold');
        this.aspectRatio = btn.dataset.aspect;
        if (previewImage) {
          previewImage.className = this.aspectRatio === 'portrait' 
            ? 'w-full h-full object-cover aspect-portrait max-h-[440px]' 
            : 'w-full h-full object-cover aspect-square max-h-[440px]';
        }
      });
    });

    // Preset sample images for quick testing
    document.querySelectorAll('.create-sample-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        this.selectedDataUrl = url;
        this.selectedFile = null;
        if (previewImage) previewImage.src = url;
        previewContainer.classList.remove('hidden');
        dropPrompt.classList.add('hidden');
      });
    });

    // Caption character counter
    if (captionInput && charCounter) {
      captionInput.addEventListener('input', () => {
        const count = captionInput.value.length;
        charCounter.textContent = `${count} / 2,200`;
      });
    }

    // Hashtag quick pills
    document.querySelectorAll('.tag-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const tag = pill.dataset.tag;
        if (captionInput) {
          captionInput.value = captionInput.value ? `${captionInput.value} ${tag}` : tag;
          captionInput.dispatchEvent(new Event('input'));
        }
      });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const caption = captionInput.value.trim();

      if (!this.selectedDataUrl && !this.selectedFile) {
        api.showToast('Please select or drop an image for your post', 'warning');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Publishing...
        `;

        const formData = new FormData();
        formData.append('caption', caption);
        formData.append('aspectRatio', this.aspectRatio);
        formData.append('imagePreview', this.selectedDataUrl);
        if (this.selectedFile) {
          formData.append('image', this.selectedFile);
        }

        const res = await api.post('/posts', formData, true);
        if (res && res.success) {
          api.showToast('Post created successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        } else {
          throw new Error(res.message || 'Failed to publish post');
        }
      } catch (err) {
        api.showToast(err.message || 'Failed to create post', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Share Post';
      }
    });
  },

  handleImageFile(file, imgElement, container, promptEl) {
    if (!file.type.startsWith('image/')) {
      api.showToast('Please upload an image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedDataUrl = e.target.result;
      if (imgElement) imgElement.src = this.selectedDataUrl;
      if (container) container.classList.remove('hidden');
      if (promptEl) promptEl.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  },

  // Edit Profile Form Handling
  initEditProfile(form) {
    const currentUser = Auth.getUser() || {};
    const avatarInput = document.getElementById('edit-avatar-input');
    const avatarPreview = document.getElementById('edit-avatar-preview');
    const nameInput = document.getElementById('edit-name-input');
    const usernameInput = document.getElementById('edit-username-input');
    const bioInput = document.getElementById('edit-bio-input');
    const saveBtn = document.getElementById('edit-save-btn');

    // Populate current values
    if (nameInput) nameInput.value = currentUser.name || '';
    if (usernameInput) usernameInput.value = currentUser.username || '';
    if (bioInput) bioInput.value = currentUser.bio || '';
    if (avatarPreview && currentUser.avatar) avatarPreview.src = currentUser.avatar;

    let updatedAvatarDataUrl = currentUser.avatar || '';

    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            updatedAvatarDataUrl = evt.target.result;
            if (avatarPreview) avatarPreview.src = updatedAvatarDataUrl;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const username = usernameInput.value.trim().toLowerCase().replace(/\s+/g, '_');
      const bio = bioInput.value.trim();

      if (!username) {
        api.showToast('Username cannot be empty', 'warning');
        return;
      }

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const updatePayload = {
          name,
          username,
          bio,
          avatar: updatedAvatarDataUrl
        };

        const res = await api.put('/users/profile', updatePayload);
        if (res && res.success) {
          api.showToast('Profile updated!', 'success');
          setTimeout(() => {
            window.location.href = `profile.html?username=${encodeURIComponent(username)}`;
          }, 600);
        }
      } catch (err) {
        api.showToast(err.message || 'Failed to update profile', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UploadController.init();
});
