import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as API from '../../../services/userApi'
import { formatVND } from '../../../../utils/currency'
import './transaction_page.css'

const TransactionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [countdown, setCountdown] = useState(10)
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Get booking data from location state
  const { bookingId, depositAmount, totalAmount, carInfo, rentalInfo } = location.state || {}

  useEffect(() => {
    // Redirect if no booking data
    if (!bookingId) {
      navigate('/payment')
      return
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handlePaymentSuccess()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [bookingId])

  const handlePaymentSuccess = async () => {
    setProcessing(true)
    
    // NOTE: In production, confirmBooking and completeBooking would be called
    // after actual payment gateway confirmation. For now, we just create the booking
    // and let it remain in "Pending" status (0) until admin processes it.
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Payment simulation completed for booking:', bookingId)
      console.log('ℹ️  Booking is in Pending status. Admin will confirm after payment verification.')
      
      // Show success message
      setShowSuccess(true)
      
      // Redirect to booking history after 2 seconds
      setTimeout(() => {
        navigate('/booking-history')
      }, 2000)
    } catch (error) {
      console.error('Error in payment flow:', error)
      alert('An error occurred. Redirecting to booking history...')
      navigate('/booking-history')
    } finally {
      setProcessing(false)
    }
  }

  if (!bookingId) {
    return null
  }

  return (
    <main className="transaction-page">
      <div className="container">
        <div className="transaction-content">
          
          {!showSuccess ? (
            <>
              <div className="transaction-header">
                <div className="icon-circle">
                  <i className="fas fa-credit-card"></i>
                </div>
                <h2>Complete Your Payment</h2>
                <p className="booking-id">Booking ID: <span>{bookingId}</span></p>
              </div>

              <div className="payment-layout">
                {/* Left - QR Code Section */}
                <div className="qr-section">
                  <h3>Scan QR Code to Pay</h3>
                  <div className="qr-placeholder">
                    <i className="fas fa-qrcode"></i>
                    <p>QR Code Here</p>
                  </div>
                  <div className="payment-instructions">
                    <h4>Payment Instructions:</h4>
                    <ol>
                      <li>Open your banking app</li>
                      <li>Scan the QR code above</li>
                      <li>Confirm the payment amount</li>
                      <li>Complete the transaction</li>
                    </ol>
                  </div>
                </div>

                {/* Right - Payment Details */}
                <div className="payment-details">
                  <h3>Payment Details</h3>
                  
                  <div className="detail-card">
                    <div className="detail-row">
                      <span className="label">Deposit Amount:</span>
                      <span className="value highlight">{formatVND(depositAmount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Total Rental Cost:</span>
                      <span className="value">{formatVND(totalAmount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Remaining Balance:</span>
                      <span className="value">{formatVND((totalAmount || 0) - (depositAmount || 0))}</span>
                    </div>
                  </div>

                  {carInfo && (
                    <div className="detail-card">
                      <h4><i className="fas fa-car"></i> Vehicle</h4>
                      <p><strong>{carInfo.brand} {carInfo.model}</strong></p>
                      <p>{carInfo.color} • {carInfo.seats} seats • {carInfo.year}</p>
                    </div>
                  )}

                  {rentalInfo && (
                    <div className="detail-card">
                      <h4><i className="fas fa-calendar-alt"></i> Rental Period</h4>
                      <p><strong>Pick-up:</strong> {rentalInfo.pickupDate} {rentalInfo.pickupTime}</p>
                      <p><strong>Return:</strong> {rentalInfo.returnDate} {rentalInfo.returnTime}</p>
                      <p><strong>Location:</strong> {rentalInfo.stationName}</p>
                    </div>
                  )}

                  <div className="countdown-section">
                    <div className="countdown-circle">
                      <span className="countdown-number">{countdown}</span>
                      <span className="countdown-label">seconds</span>
                    </div>
                    <p className="countdown-text">
                      {processing ? 'Processing payment...' : 'Simulating payment completion in...'}
                    </p>
                  </div>

                  <div className="info-box">
                    <i className="fas fa-info-circle"></i>
                    <p>This is a demo. Your booking will be created in <strong>Pending</strong> status. Admin will confirm after receiving payment. Payment simulation completes after {countdown} second{countdown !== 1 ? 's' : ''}.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="success-section">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Booking Created Successfully!</h2>
              <p>Your booking is pending payment confirmation.</p>
              <p style={{fontSize: '0.95rem', color: '#666', margin: '1rem 0'}}>
                Booking ID: <strong>{bookingId}</strong>
              </p>
              <p className="redirect-text">Redirecting to booking history...</p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

export default TransactionPage
