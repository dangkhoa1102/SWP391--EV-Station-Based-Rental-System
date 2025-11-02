// ========== Notification Component ==========
// Reusable notification system for all pages

const NotificationComponent = {
  // Show notification with type (success, error, info, warning)
  show(message, type = 'success', duration = 5000) {
    const container = document.getElementById('notification') || this.createContainer();
    
    container.className = `notification ${type} show`;
    container.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.classList.remove('show')" class="close-btn">×</button>
      </div>
    `;

    if (duration) {
      setTimeout(() => container.classList.remove('show'), duration);
    }

    return container;
  },

  // Create notification container if doesn't exist
  createContainer() {
    const div = document.createElement('div');
    div.id = 'notification';
    div.className = 'notification';
    document.body.appendChild(div);
    return div;
  },

  // Shorthand methods
  success(msg, duration = 5000) { return this.show(msg, 'success', duration); },
  error(msg, duration = 5000) { return this.show(msg, 'error', duration); },
  info(msg, duration = 5000) { return this.show(msg, 'info', duration); },
  warning(msg, duration = 5000) { return this.show(msg, 'warning', duration); }
};

// Global shorthand function for all pages
function showNotification(message, type = 'success') {
  return NotificationComponent.show(message, type);
}
