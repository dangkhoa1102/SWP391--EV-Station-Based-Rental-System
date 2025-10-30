import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { formatVND } from '../../utils/currency'
import '../../styles/booking_history.css'

export default function BookingHistory(){
  const navigate = useNavigate()
  const [allBookings, setAllBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('newest')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ carId: '', rating: 5, comment: '' })
  const [isEditingFeedback, setIsEditingFeedback] = useState(false)
  const [currentFeedbackId, setCurrentFeedbackId] = useState(null)

  console.log('🔍 BookingHistory render - showFeedbackModal:', showFeedbackModal, 'selectedBooking:', selectedBooking)

  useEffect(()=>{
    loadBookings()
  },[])

  useEffect(()=>{
    applyFilters()
  },[allBookings, statusFilter, sortFilter])

  const loadBookings = async ()=>{
    try{
      setLoading(true)
      console.log('Fetching bookings for current user')
      setFetchError('')
      // ensure user has a token locally before calling
      const token = localStorage.getItem('token')
      if (!token || token === 'null') {
        console.warn('No auth token found in localStorage')
        setAllBookings([])
        setFetchError('You are not signed in. Please sign in to view your bookings.')
        return
      }

      const res = await API.getUserBookings()
      console.log('Bookings loaded:', res)
      setAllBookings(res || [])
    }catch(e){ 
      console.error('Error loading bookings:', e)
      // If request was unauthorized, show helpful message
      if (e && e.response && e.response.status === 401) {
        setFetchError('Session expired or unauthorized. Please sign in again.')
        setAllBookings([])
        return
      }
      setFetchError('Failed to load bookings. Please try again later.')
    }finally{
      setLoading(false)
    }
  }

  const applyFilters = ()=>{
    let filtered = [...allBookings]

    // Filter by status
    if(statusFilter){
      filtered = filtered.filter(b => String(b.bookingStatus) === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch(sortFilter){
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'price-high':
          return (b.totalAmount || 0) - (a.totalAmount || 0)
        case 'price-low':
          return (a.totalAmount || 0) - (b.totalAmount || 0)
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

    setFilteredBookings(filtered)
  }

  const getBookingStatus = (status) => {
    const statuses = {
      0: { text: 'Pending', class: 'status-pending' },
      1: { text: 'Active', class: 'status-active' },
      2: { text: 'Completed', class: 'status-completed' },
      3: { text: 'Cancelled', class: 'status-cancelled' },
      7: { text: 'Cancelled', class: 'status-cancelled' } // BookingStatus 7 = Cancelled
    }

    const idx = Number(status)
    if (Number.isNaN(idx) || !(idx in statuses)) return statuses[3]
    return statuses[idx]
  }

  const formatDateTime = (dateString)=>{
    if(!dateString) return 'N/A'
    try{
      const date = new Date(dateString)
      if(isNaN(date.getTime())) return dateString
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }catch(e){
      return dateString
    }
  }

  // Details view removed: bookings are shown without a "Details" button

  const handleCancelBooking = async (booking, event) => {
    // Prevent event bubbling
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    const bookingId = booking.id || booking.bookingId || booking.bookingIdString
    if (!bookingId) {
      alert('Cannot cancel: Booking ID not found')
      return
    }

    // If booking is already cancelled (status 7) do not proceed
    if (Number(booking.bookingStatus) === 7) {
      alert('This booking has already been cancelled.')
      return
    }

    const confirmCancel = window.confirm(`Are you sure you want to cancel booking for "${booking.carInfo || 'this car'}"?`)
    if (!confirmCancel) return

    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('User ID not found. Please login again.')
        return
      }

      console.log('🚫 Cancelling booking:', bookingId, 'for user:', userId)
      await API.cancelBooking(bookingId, userId)
      alert('Booking cancelled successfully!')
      
      // Reload bookings to reflect the change
      loadBookings()
    } catch (e) {
      console.error('❌ Error cancelling booking:', e)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  const handleOpenFeedbackModal = (booking, event) => {
    // Prevent event bubbling and multiple triggers
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Prevent opening if already open
    if (showFeedbackModal) {
      console.log('⚠️ Modal already open, ignoring click')
      return
    }
    
    console.log('📝 Opening feedback modal for booking:', booking)
    const bookingId = booking.id || booking.bookingId || booking.bookingIdString || ''
    const carId = booking.carId || booking.car?.id || booking.car?.carId || ''
    console.log('📋 Extracted bookingId:', bookingId)
    console.log('� Extracted carId:', carId)
    
    if (!bookingId) {
      alert('Cannot create feedback: Booking ID not found.')
      return
    }
    
    if (!carId) {
      alert('Cannot create feedback: Car ID not found in booking data. Please contact support.')
      return
    }
    
    // Check if booking has existing feedback
    if (booking.feedbackId) {
      // Edit mode
      setIsEditingFeedback(true)
      setCurrentFeedbackId(booking.feedbackId)
      setFeedbackData({
        carId: carId,
        rating: booking.feedbackRating || 5,
        comment: booking.feedbackComment || ''
      })
    } else {
      // Create mode
      setIsEditingFeedback(false)
      setCurrentFeedbackId(null)
      setFeedbackData({
        carId: carId,
        rating: 5,
        comment: ''
      })
    }
    
    setSelectedBooking(booking)
    setShowFeedbackModal(true)
    console.log('✅ Modal state set to true, selectedBooking:', booking)
  }

  const handleSubmitFeedback = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('User ID not found. Please login again.')
        return
      }

      if (!feedbackData.carId) {
        alert('Car ID not found for this booking.')
        return
      }

      if (!feedbackData.comment.trim()) {
        alert('Please enter your feedback comment.')
        return
      }

      console.log('📝 Submitting feedback:', feedbackData)

      if (isEditingFeedback && currentFeedbackId) {
        // Update existing feedback
        await API.updateFeedback(currentFeedbackId, userId, feedbackData)
        alert('Feedback updated successfully!')
      } else {
        // Create new feedback
        await API.createFeedback(userId, feedbackData)
        alert('Feedback submitted successfully!')
      }

      setShowFeedbackModal(false)
      setFeedbackData({ carId: '', rating: 5, comment: '' })
      setIsEditingFeedback(false)
      setCurrentFeedbackId(null)
      
      // Reload bookings to reflect feedback status
      loadBookings()
    } catch (e) {
      console.error('❌ Error submitting feedback:', e)
      alert('Failed to submit feedback. Please try again.')
    }
  }

  return (
    <main className="main-content">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <i className="fas fa-history"></i>
          <div className="page-header-text">
            <h1>Booking History</h1>
            <p>Manage all your car rentals</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="0">Pending</option>
              <option value="1">Active</option>
              <option value="2">Completed</option>
              <option value="3">Cancelled</option>
              <option value="7">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By:</label>
            <select value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-high">Price (High to Low)</option>
              <option value="price-low">Price (Low to High)</option>
            </select>
          </div>
          <button className="btn-refresh" onClick={loadBookings}>
            <i className="fas fa-sync"></i> Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Loading...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h2>No Bookings Yet</h2>
            <p>Start booking a car to find your perfect ride</p>
            <button className="btn btn-primary" onClick={()=> navigate('/cars')}>
              <i className="fas fa-car"></i> View Cars
            </button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="bookings-list">
            {filteredBookings.map((booking, idx)=>{
              const status = getBookingStatus(booking.bookingStatus)
              const pickupDate = formatDateTime(booking.startTime || booking.pickupDateTime)
              const returnDate = formatDateTime(booking.endTime || booking.expectedReturnDateTime)

              return (
                <div key={idx} className={`booking-card ${status.class}`}>
                  <div className="booking-header">
                    <h3>{booking.carInfo || 'Car Rental'}</h3>
                    <span className={`status-badge ${status.class}`}>{status.text}</span>
                  </div>
                  <div className="booking-body">
                    <div className="booking-info">
                      <div className="info-row">
                        <span className="label"><i className="fas fa-map-marker-alt"></i> Pick-up:</span>
                        <span className="value">{booking.pickupStationName || 'N/A'}</span>
                      </div>
                      <div className="info-row">
                        <span className="label"><i className="fas fa-calendar"></i> Start:</span>
                        <span className="value">{pickupDate}</span>
                      </div>
                      <div className="info-row">
                        <span className="label"><i className="fas fa-calendar-check"></i> End:</span>
                        <span className="value">{returnDate}</span>
                      </div>
                      <div className="info-row price">
                        <span className="label"><i className="fas fa-tag"></i> Total:</span>
                        <span className="value">{formatVND(booking.totalAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="booking-footer">
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={(e) => handleOpenFeedbackModal(booking, e)}
                      type="button"
                    >
                      <i className="fas fa-comment"></i> {booking.feedbackId ? 'Edit Feedback' : 'Feedback'}
                    </button>
                    {
                      /* Disable Cancel when bookingStatus === 7 */
                    }
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => handleCancelBooking(booking, e)}
                      disabled={Number(booking.bookingStatus) === 7}
                      title={Number(booking.bookingStatus) === 7 ? 'Already cancelled' : 'Cancel booking'}
                      type="button"
                    >
                      <i className="fas fa-times-circle"></i> Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={()=> setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={()=> setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Car Info Section */}
              <div className="detail-section car-section">
                <div className="section-icon">🚗</div>
                <div className="section-content">
                  <h3>{selectedBooking.carInfo || 'Car Rental'}</h3>
                  <div className="status-row">
                    <span className={`status-badge ${getBookingStatus(selectedBooking.bookingStatus).class}`}>
                      {getBookingStatus(selectedBooking.bookingStatus).text}
                    </span>
                  </div>
                </div>
              </div>

              {/* DateTime Section */}
              <div className="detail-section datetime-section">
                <div className="datetime-card pickup">
                  <div className="datetime-icon">📍</div>
                  <div className="datetime-info">
                    <label>Pick-up</label>
                    <p className="location">{selectedBooking.pickupStationName || 'N/A'}</p>
                    <p className="time">{formatDateTime(selectedBooking.startTime || selectedBooking.pickupDateTime)}</p>
                  </div>
                </div>
                <div className="datetime-arrow">→</div>
                <div className="datetime-card return">
                  <div className="datetime-icon">🏁</div>
                  <div className="datetime-info">
                    <label>Return</label>
                    <p className="location">{selectedBooking.returnStationName || 'N/A'}</p>
                    <p className="time">{formatDateTime(selectedBooking.endTime || selectedBooking.expectedReturnDateTime)}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="detail-section pricing-section">
                <div className="pricing-grid">
                  <div className="pricing-item">
                    <span className="pricing-icon">⏱️</span>
                    <div>
                      <label>Hourly Rate</label>
                      <p>{formatVND(selectedBooking.hourlyRate || 0)}/hour</p>
                    </div>
                  </div>
                  <div className="pricing-item">
                    <span className="pricing-icon">📅</span>
                    <div>
                      <label>Daily Rate</label>
                      <p>{formatVND(selectedBooking.dailyRate || 0)}/day</p>
                    </div>
                  </div>
                  <div className="pricing-item">
                    <span className="pricing-icon">🕒</span>
                    <div>
                      <label>Created At</label>
                      <p>{formatDateTime(selectedBooking.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Section */}
              <div className="detail-section total-section">
                <div className="total-content">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount">{formatVND(selectedBooking.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>We want your opinion!</h2>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="feedback-form">
                <div className="form-group">
                  <label>Car: {selectedBooking?.carInfo || 'N/A'}</label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="rating">Rating</label>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${feedbackData.rating >= star ? 'active' : ''}`}
                        onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      >
                        <i className={`fas fa-star ${feedbackData.rating >= star ? '' : 'far'}`}></i>
                      </button>
                    ))}
                    <span className="rating-text">{feedbackData.rating} / 5</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="comment">Comment</label>
                  <textarea
                    id="comment"
                    rows="5"
                    value={feedbackData.comment}
                    onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                    placeholder="Share your experience with this car..."
                  />
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-continue" onClick={handleSubmitFeedback}>
                    {isEditingFeedback ? 'Update' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
