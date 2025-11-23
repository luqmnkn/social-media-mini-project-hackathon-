// ===== Global Variables =====
let currentUser = null;
let posts = [];
let filteredPosts = [];
let currentEditPostId = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();
    
    // Initialize theme
    initTheme();
    
    // Load posts from localStorage
    loadPosts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Display welcome message
    displayWelcomeMessage();
});

// ===== Authentication Functions =====
/**
 * Check if user is authenticated, redirect to login if not
 */
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(userStr);
}

/**
 * Display welcome message in header
 */
function displayWelcomeMessage() {
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl && currentUser) {
        welcomeEl.textContent = `Welcome, ${currentUser.name}`;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ===== Theme Functions =====
/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
}

/**
 * Set theme and update UI
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Toggle between dark and light theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ===== Post Management Functions =====
/**
 * Load posts from localStorage
 */
function loadPosts() {
    const postsStr = localStorage.getItem('posts');
    posts = postsStr ? JSON.parse(postsStr) : [];
    filteredPosts = [...posts];
    renderPosts();
}

/**
 * Save posts to localStorage
 */
function savePosts() {
    localStorage.setItem('posts', JSON.stringify(posts));
}

/**
 * Create a new post
 */
function createPost(text, imageUrl) {
    const newPost = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        text: text.trim(),
        imageUrl: imageUrl.trim() || null,
        time: new Date().toISOString(),
        likes: 0,
        isLiked: false
    };
    
    posts.unshift(newPost); // Add to beginning
    filteredPosts = [...posts];
    savePosts();
    renderPosts();
}

/**
 * Delete a post
 */
function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }
    
    posts = posts.filter(post => post.id !== postId);
    filteredPosts = filteredPosts.filter(post => post.id !== postId);
    savePosts();
    renderPosts();
}

/**
 * Toggle like on a post
 */
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.isLiked) {
        post.likes--;
        post.isLiked = false;
    } else {
        post.likes++;
        post.isLiked = true;
    }
    
    // Update filtered posts
    const filteredPost = filteredPosts.find(p => p.id === postId);
    if (filteredPost) {
        filteredPost.likes = post.likes;
        filteredPost.isLiked = post.isLiked;
    }
    
    savePosts();
    renderPosts();
}

/**
 * Get post for editing
 */
function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Check if user owns the post
    if (post.userId !== currentUser.id) {
        alert('You can only edit your own posts.');
        return;
    }
    
    currentEditPostId = postId;
    document.getElementById('editPostText').value = post.text;
    document.getElementById('editPostImageUrl').value = post.imageUrl || '';
    document.getElementById('editModal').classList.add('show');
}

/**
 * Update an existing post
 */
function updatePost(postId, text, imageUrl) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    post.text = text.trim();
    post.imageUrl = imageUrl.trim() || null;
    
    // Update filtered posts
    const filteredPost = filteredPosts.find(p => p.id === postId);
    if (filteredPost) {
        filteredPost.text = post.text;
        filteredPost.imageUrl = post.imageUrl;
    }
    
    savePosts();
    renderPosts();
    closeEditModal();
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    currentEditPostId = null;
    document.getElementById('editPostForm').reset();
}

// ===== Rendering Functions =====
/**
 * Render all posts to the DOM
 */
function renderPosts() {
    const container = document.getElementById('postsContainer');
    const noPostsMessage = document.getElementById('noPostsMessage');
    
    if (filteredPosts.length === 0) {
        container.innerHTML = '';
        noPostsMessage.style.display = 'block';
        return;
    }
    
    noPostsMessage.style.display = 'none';
    container.innerHTML = '';
    
    filteredPosts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

/**
 * Create a post element
 */
function createPostElement(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.setAttribute('data-post-id', post.id);
    
    const time = new Date(post.time);
    const timeString = formatDateTime(time);
    
    const isOwner = post.userId === currentUser.id;
    
    postCard.innerHTML = `
        <div class="post-header">
            <div>
                <div class="post-author">${escapeHtml(post.userName)}</div>
                <div class="post-time">${timeString}</div>
            </div>
        </div>
        <div class="post-content">
            <div class="post-text">${escapeHtml(post.text)}</div>
            ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Post image" class="post-image" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="post-actions">
            <div class="post-actions-left">
                <button class="btn btn-like ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ${post.isLiked ? '❤️' : '🤍'} Like
                </button>
                <span class="like-count">${post.likes} ${post.likes === 1 ? 'like' : 'likes'}</span>
            </div>
            <div class="post-actions-right">
                ${isOwner ? `
                    <button class="btn btn-edit" onclick="editPost('${post.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePost('${post.id}')">Delete</button>
                ` : ''}
            </div>
        </div>
    `;
    
    return postCard;
}

/**
 * Format date and time for display
 */
function formatDateTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (days < 7) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Search and Sort Functions =====
/**
 * Filter posts based on search query
 */
function filterPosts(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredPosts = [...posts];
    } else {
        filteredPosts = posts.filter(post => 
            post.text.toLowerCase().includes(searchTerm) ||
            post.userName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply current sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortPosts(sortSelect.value);
    } else {
        renderPosts();
    }
}

/**
 * Sort posts based on selected option
 */
function sortPosts(sortType) {
    switch (sortType) {
        case 'latest':
            filteredPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
            break;
        case 'oldest':
            filteredPosts.sort((a, b) => new Date(a.time) - new Date(b.time));
            break;
        case 'mostLiked':
            filteredPosts.sort((a, b) => b.likes - a.likes);
            break;
        default:
            break;
    }
    renderPosts();
}

// ===== Event Listeners Setup =====
/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Create post form
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const text = document.getElementById('postText').value;
            const imageUrl = document.getElementById('postImageUrl').value;
            
            if (!text.trim()) {
                alert('Please enter some text for your post.');
                return;
            }
            
            createPost(text, imageUrl);
            createPostForm.reset();
        });
    }
    
    // Edit post form
    const editPostForm = document.getElementById('editPostForm');
    if (editPostForm) {
        editPostForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentEditPostId) return;
            
            const text = document.getElementById('editPostText').value;
            const imageUrl = document.getElementById('editPostImageUrl').value;
            
            if (!text.trim()) {
                alert('Please enter some text for your post.');
                return;
            }
            
            updatePost(currentEditPostId, text, imageUrl);
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterPosts(e.target.value);
        });
    }
    
    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            sortPosts(e.target.value);
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Modal close
    const modal = document.getElementById('editModal');
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeEditModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });
}

// Make functions available globally for onclick handlers
window.toggleLike = toggleLike;
window.deletePost = deletePost;
window.editPost = editPost;

