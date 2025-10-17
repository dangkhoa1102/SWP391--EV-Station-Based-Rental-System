// ========== Authentication Module ==========
// Handles auth state and user session management

const AuthModule = {
  // Check if user is logged in
  isLoggedIn() {
    const token = localStorage.getItem('token');
    return token && token !== 'null' && token !== '';
  },

  // Get current user data
  getCurrentUser() {
    return {
      email: localStorage.getItem('userEmail') || '',
      userId: localStorage.getItem('userId') || '',
      token: localStorage.getItem('token') || ''
    };
  },

  // Login - save credentials
  async login(email, password) {
    try {
      const result = await window.API.login(email, password);
      
      // Save to localStorage
      localStorage.setItem('token', result.token || result.raw.data.token);
      localStorage.setItem('userEmail', email);
      
      showNotification('✅ Đăng nhập thành công!', 'success');
      return result;
    } catch (err) {
      showNotification('❌ Email hoặc mật khẩu sai', 'error');
      throw err;
    }
  },

  // Logout - clear all user data
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    
    showNotification('✅ Đã đăng xuất', 'success');
    
    // Redirect to home after 1 second
    setTimeout(() => window.location.href = 'home_page.html', 1000);
  },

  // Update UI based on auth status
  updateUI() {
    const isLogged = this.isLoggedIn();
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userEmail = document.getElementById('userEmail');

    if (isLogged) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) userMenu.style.display = 'block';
      if (userEmail) userEmail.textContent = localStorage.getItem('userEmail') || 'User';
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userMenu) userMenu.style.display = 'none';
    }
  },

  // Redirect to login if not logged in
  requireLogin(redirectPath = 'home_page.html') {
    if (!this.isLoggedIn()) {
      showNotification('Vui lòng đăng nhập', 'error');
      setTimeout(() => window.location.href = redirectPath, 1500);
      return false;
    }
    return true;
  }
};

// Global function for backward compatibility
function checkAuthStatus() {
  AuthModule.updateUI();
}
