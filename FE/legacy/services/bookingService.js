// ========== Booking Service ==========
// Centralized booking API calls

const BookingService = {
  // Get all bookings for current user
  async getUserBookings() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not logged in');

      console.log('Fetching bookings for userId:', userId);
      const bookings = await window.API.get(`/Bookings/Get-By-User/${encodeURIComponent(userId)}`);
      
      // Normalize response
      return Array.isArray(bookings) ? bookings : bookings.data || [];
    } catch (err) {
      console.error('Error fetching bookings:', err);
      throw err;
    }
  },

  // Get single booking details
  async getBookingDetails(bookingId) {
    try {
      const bookings = await this.getUserBookings();
      return bookings.find(b => b.bookingId === bookingId);
    } catch (err) {
      console.error('Error getting booking details:', err);
      throw err;
    }
  },

  // Create new booking
  async createBooking(carId, pickupStationId, returnStationId, pickupDateTime, expectedReturnDateTime) {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not logged in');

      const payload = {
        carId,
        pickupStationId,
        returnStationId,
        pickupDateTime,
        expectedReturnDateTime
      };

      console.log('Creating booking:', payload);
      const result = await window.API.createBooking(payload, userId);
      
      showNotification('✅ Đặt xe thành công!', 'success');
      return result;
    } catch (err) {
      console.error('Error creating booking:', err);
      showNotification('❌ Lỗi khi đặt xe', 'error');
      throw err;
    }
  },

  // Cancel booking (for later implementation)
  async cancelBooking(bookingId) {
    try {
      console.log('Cancelling booking:', bookingId);
      // TODO: Implement cancel booking API call
      showNotification('Chức năng hủy đặt xe sẽ được cập nhật sớm', 'info');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      throw err;
    }
  },

  // Get booking status text
  getStatusText(status) {
    const statuses = {
      0: 'Chưa Bắt Đầu',
      1: 'Đang Cho Thuê',
      2: 'Hoàn Thành',
      3: 'Hủy'
    };
    return statuses[status] || 'Không Xác Định';
  },

  // Get booking status class
  getStatusClass(status) {
    const classes = {
      0: 'status-pending',
      1: 'status-active',
      2: 'status-completed',
      3: 'status-cancelled'
    };
    return classes[status] || 'status-unknown';
  }
};
