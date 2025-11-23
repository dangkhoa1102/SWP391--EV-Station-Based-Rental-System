import React, { useState, useEffect } from 'react'
import feedbackApi from '../../../../services/feedbackApi'

export default function FeedbackModal({
  isOpen,
  selectedBooking,
  feedbackData,
  setFeedbackData,
  isEditingFeedback,
  currentFeedbackId,
  onClose,
  onSubmitSuccess
}) {
  const [viewMode, setViewMode] = useState(false) // false = edit, true = view
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only set view mode when modal FIRST opens with existing feedback
    // Don't re-trigger when comment changes (that would auto-revert from edit to view mode)
    console.log('🔄 FeedbackModal useEffect triggered:', {
      isOpen,
      feedbackId: selectedBooking?.feedbackId,
      hasComment: !!feedbackData?.comment,
      feedbackData
    })
    
    if (isOpen && selectedBooking?.feedbackId && feedbackData?.comment) {
      console.log('📺 Entering VIEW mode - showing existing feedback')
      setViewMode(true)
    } else if (isOpen) {
      // If modal opens but no existing feedback, enter edit mode
      console.log('✏️ Entering EDIT mode - creating/editing feedback')
      setViewMode(false)
    }
    // When modal closes, don't do anything
  }, [isOpen, selectedBooking?.feedbackId])

  const handleEditFeedback = () => {
    setViewMode(false)
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

      setLoading(true)
      console.log('📝 Submitting feedback:', feedbackData)

      if (isEditingFeedback && currentFeedbackId) {
        // Update existing feedback
        await feedbackApi.updateFeedback(currentFeedbackId, feedbackData, userId)
        alert('Feedback updated successfully!')
      } else {
        // Create new feedback
        await feedbackApi.createFeedback(userId, feedbackData)
        alert('Feedback submitted successfully!')
      }

      // Reset and close
      setFeedbackData({ bookingId: '', carId: '', rating: 5, comment: '' })
      setViewMode(false)
      onClose()
      
      // Notify parent to reload bookings
      onSubmitSuccess()
    } catch (e) {
      console.error('❌ Error submitting feedback:', e)
      const errorMsg = e.response?.data?.errors?.[0] || 'Failed to submit feedback. Please try again.'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{viewMode ? 'Your Feedback' : 'We want your opinion!'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="feedback-form">
            <div className="form-group">
              <label>Car: {selectedBooking?.carInfo || 'N/A'}</label>
            </div>
            
            {viewMode ? (
              // View Mode
              <>
                <div className="form-group">
                  <label>Your Rating</label>
                  <div className="rating-display">
                    <div className="stars-display">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i
                          key={star}
                          className={`fas fa-star ${feedbackData.rating >= star ? 'active' : 'inactive'}`}
                          style={{ color: feedbackData.rating >= star ? '#ffc107' : '#ddd' }}
                        ></i>
                      ))}
                    </div>
                    <span className="rating-text">{feedbackData.rating} / 5</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Comment</label>
                  <div className="comment-display">
                    <p>{feedbackData.comment}</p>
                  </div>
                </div>

                <div className="feedback-meta">
                  <small>Created: {selectedBooking?.feedbackCreatedDate || 'N/A'}</small>
                  {selectedBooking?.feedbackUpdatedDate && selectedBooking.feedbackUpdatedDate !== selectedBooking.feedbackCreatedDate && (
                    <small>Updated: {selectedBooking.feedbackUpdatedDate}</small>
                  )}
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={onClose}>
                    Close
                  </button>
                  <button className="btn btn-continue" onClick={handleEditFeedback}>
                    <i className="fas fa-edit"></i> Edit Feedback
                  </button>
                </div>
              </>
            ) : (
              // Edit Mode
              <>
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
                  <button className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-continue" 
                    onClick={handleSubmitFeedback}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : (isEditingFeedback ? 'Update' : 'Continue')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
