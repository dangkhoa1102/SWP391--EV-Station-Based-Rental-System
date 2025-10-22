import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import '../../styles/booking_history.css'

export default function BookingHistory(){
  const navigate = useNavigate()
  const [allBookings, setAllBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('newest')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(()=>{
    loadBookings()
  },[])

  useEffect(()=>{
    applyFilters()
  },[allBookings, statusFilter, sortFilter])

  const loadBookings = async ()=>{
    try{
      setLoading(true)
      const uid = localStorage.getItem('userId')
      if(!uid){
        console.error('No userId found')
        setLoading(false)
        return
      }
      console.log('Fetching bookings for userId:', uid)
      const res = await API.getUserBookings(uid)
      console.log('Bookings loaded:', res)
      setAllBookings(res || [])
    }catch(e){ 
      console.error('Error loading bookings:', e)
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

  const getBookingStatus = (status)=>{
    const statuses = {
      0: { text: 'Pending', class: 'status-pending' },
      1: { text: 'Active', class: 'status-active' },
      2: { text: 'Completed', class: 'status-completed' },
      3: { text: 'Cancelled', class: 'status-cancelled' }
    }
    return statuses[status] || { text: 'Unknown', class: 'status-unknown' }
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

  const contactSupport = (booking) => {
    const supportEmail = 'support@fec.com'
    const bookingId = booking.id || booking.bookingId || booking.bookingIdString || 'N/A'
    const subject = encodeURIComponent(`Booking Support: ${bookingId}`)
    const body = encodeURIComponent(`Hello,%0A%0AI need help with my booking.%0A%0ABooking ID: ${bookingId}%0ACar: ${booking.carInfo || ''}%0A%0APlease describe your issue here:`)
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`
  }

  const reportIssue = (booking) => {
    const bookingId = booking.id || booking.bookingId || 'N/A'
    const reason = window.prompt(`Please describe the issue you want to report for booking ${bookingId}:`)
    if (!reason) return
    // In a real app this would POST to a support/report endpoint. For now we log and show confirmation.
    console.log('Report submitted', { bookingId, reason })
    alert('Thank you. Your report has been submitted. Our team will review it shortly.')
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
                        <span className="value">${(booking.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="booking-footer">
                    <button className="btn btn-sm btn-primary" onClick={() => contactSupport(booking)}>
                      <i className="fas fa-envelope"></i> Contact Support
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => reportIssue(booking)}>
                      <i className="fas fa-flag"></i> Report
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
                      <p>${(selectedBooking.hourlyRate || 0).toFixed(2)}/hour</p>
                    </div>
                  </div>
                  <div className="pricing-item">
                    <span className="pricing-icon">📅</span>
                    <div>
                      <label>Daily Rate</label>
                      <p>${(selectedBooking.dailyRate || 0).toFixed(2)}/day</p>
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
                  <span className="total-amount">${(selectedBooking.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
