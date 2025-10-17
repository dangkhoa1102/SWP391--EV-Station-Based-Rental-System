// ========== Modal Utilities ==========
// Reusable modal functions for all pages

const ModalUtils = {
  // Toggle user dropdown menu
  toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
  },

  // Open login modal
  openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
  },

  // Close login modal
  closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
  },

  // Handle login form submission
  async handleLoginSubmit(e, redirectPath = null) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      showNotification('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      await AuthModule.login(email, password);
      this.closeLoginModal();
      AuthModule.updateUI();
      
      // Reload page or redirect
      if (redirectPath) {
        setTimeout(() => window.location.href = redirectPath, 500);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  },

  // Close modal when clicking outside
  setupModalClickHandlers() {
    window.onclick = (event) => {
      const loginModal = document.getElementById('loginModal');
      const bookingModal = document.getElementById('bookingModal');

      if (event.target === loginModal) this.closeLoginModal();
      if (event.target === bookingModal && bookingModal) {
        bookingModal.style.display = 'none';
      }
    };
  }
};

// Global functions for backward compatibility
function toggleUserMenu() { ModalUtils.toggleUserMenu(); }
function openModal() { ModalUtils.openLoginModal(); }
function closeModal() { ModalUtils.closeLoginModal(); }
