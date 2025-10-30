import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../services/api'
import { formatVND } from '../../utils/currency'
import '../../styles/payment_page.css'

export default function PaymentPage(){
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [rentalContext, setRentalContext] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load rental context and car info
    try {
      const rc = JSON.parse(localStorage.getItem('rentalContext') || 'null')
      if (!rc) {
        alert('No rental information found. Please search for a car first.')
        navigate('/')
        return
      }
      setRentalContext(rc)

      // Load car info from selectedCarId in localStorage
      const carId = localStorage.getItem('selectedCarId')
      if (carId) {
        API.getCarById(carId).then(carData => setCar(carData))
      }
    } catch (e) {
      console.error(e)
    }
  }, [navigate])

  const calculateTotalPrice = () => {
    if (!rentalContext || !car) return 0
    const pickup = new Date(`${rentalContext.pickupDate}T${rentalContext.pickupTime}`)
    const returnDate = new Date(`${rentalContext.returnDate}T${rentalContext.returnTime}`)
    const hours = Math.ceil((returnDate - pickup) / (1000 * 60 * 60))
    const pricePerHour = parseFloat(car.rentalPricePerHour || car.RentalPricePerHour || 0)
    return hours * pricePerHour
  }

  const calculateDepositAmount = () => {
    return calculateTotalPrice() * 0.3 // 25% deposit
  }

  const handleCreateBooking = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the Terms and Conditions and Privacy Policy to continue.')
      return
    }

    if (!car || !rentalContext) {
      alert('Missing booking information. Please try again.')
      return
    }

    setLoading(true)
    try {
      const userId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')
      
      console.log('📋 Current userId from localStorage:', userId)
      console.log('📋 Current token exists:', !!token)
      
      if (!userId) {
        alert('User ID not found. Please logout and login again.')
        navigate('/')
        return
      }

      // Create booking with ISO DateTime format
      const pickupDateTime = new Date(`${rentalContext.pickupDate}T${rentalContext.pickupTime}`).toISOString()
      const returnDateTime = new Date(`${rentalContext.returnDate}T${rentalContext.returnTime}`).toISOString()
      
      const bookingData = {
        carId: car.id || car.Id,
        userId: userId,
        pickupStationId: rentalContext.stationId,
        returnStationId: rentalContext.stationId,
        pickupDateTime: pickupDateTime,
        expectedReturnDateTime: returnDateTime,
        totalAmount: calculateTotalPrice()
      }

      console.log('📝 Creating booking with data:', bookingData)
      const bookingResponse = await API.createBooking(bookingData, userId)
      
      // Extract booking ID from response
      const newBookingId = bookingResponse.id || bookingResponse.Id || bookingResponse.bookingId
      if (!newBookingId) {
        throw new Error('Booking ID not received from server')
      }
      
      console.log('✅ Booking created with ID:', newBookingId)
      
      // Step 2: Save booking ID and calculate deposit (30%)
      const depositAmount = calculateTotalPrice() * 0.30
      try {
        localStorage.setItem('currentBookingId', newBookingId)
        localStorage.setItem('depositAmount', depositAmount.toString())
      } catch (e) {
        console.warn('Failed to save booking ID:', e)
      }
      
      // Step 3: Create payment via PayOS API
      console.log('💳 Creating payment with deposit amount:', depositAmount)
      try {
        const paymentResponse = await API.post('/Payment/create', {
          bookingId: newBookingId,
          amount: Math.round(depositAmount)
        })
        
        const checkoutUrl = paymentResponse.checkoutUrl
        if (!checkoutUrl) {
          throw new Error('No checkout URL received from payment service')
        }
        
        console.log('🔗 Redirecting to PayOS:', checkoutUrl)
        // Redirect to PayOS for payment
        window.location.href = checkoutUrl
      } catch (paymentError) {
        console.error('Payment creation failed:', paymentError)
        alert('Failed to create payment. Please try again.')
        setLoading(false)
      }

    } catch (error) {
      console.error('Error creating booking:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!rentalContext || !car) {
    return <div style={{ padding: '2rem' }}><p>Loading...</p></div>
  }

  const totalPrice = calculateTotalPrice()
  const depositAmount = calculateDepositAmount()

  return (
    <main className="payment-page">
      <div className="container">
        <h2>Confirm Your Reservation</h2>
        
        <div className="payment-layout">
          {/* Left Column - Rental & Car Info */}
          <div className="payment-info-column">
            {/* Rental Information */}
            <div className="info-section">
                <h3 className="section-heading">Rental Information</h3>
              <div className="info-row">
                <span className="info-label">Pick-up Location:</span>
                <span className="info-value">{rentalContext.stationName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Pick-up Date & Time:</span>
                <span className="info-value">{rentalContext.pickupDate} {rentalContext.pickupTime}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Return Date & Time:</span>
                <span className="info-value">{rentalContext.returnDate} {rentalContext.returnTime}</span>
              </div>
            </div>

            {/* Car Information */}
            <div className="info-section">
                <h3 className="section-heading">Car Information</h3>
              <div className="car-preview">
                <img src={car.imageUrl || car.image || '/Picture/E car 1.jpg'} alt={car.model} />
                <div className="car-details">
                  <h4>{car.brand} {car.model}</h4>
                  <p><strong>Color:</strong> {car.color}</p>
                  <p><strong>Seats:</strong> {car.seats}</p>
                  <p><strong>Year:</strong> {car.year}</p>
                  <p><strong>Price:</strong> {formatVND(parseFloat(car.rentalPricePerHour || 0))}/hour</p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="info-section">
                <h3 className="section-heading">Price Summary</h3>
              <div className="info-row">
                <span className="info-label">Total Rental Cost:</span>
                <span className="info-value">{formatVND(totalPrice)}</span>
              </div>
              <div className="info-row deposit-row">
                <span className="info-label">Deposit Required (30%):</span>
                <span className="info-value">{formatVND(depositAmount)}</span>
              </div>
            </div>

            {/* Terms and Conditions moved to page bottom */}

          </div>

          {/* Right Column - Summary & CTA */}
          <aside className="payment-summary-column" aria-label="Payment summary">
            <div className="summary-card">
                <div className="summary-pricing">
                <div className="label">Total Rental Cost</div>
                <div className="price-large">{formatVND(totalPrice)}</div>
                <div className="label small">Deposit Required (30%)</div>
                <div className="deposit-badge">{formatVND(depositAmount)}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Terms and Conditions placed at the bottom of the page */}
        <div className="terms-section" style={{ marginTop: '18px' }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span style={{ marginLeft: '10px' }}>I agree to the <button type="button" className="link-button" onClick={() => setShowTermsModal(true)}>Terms and Conditions</button> and <button type="button" className="link-button" onClick={() => setShowPolicyModal(true)}>Privacy Policy</button></span>
          </label>
        </div>

      </div>

      {/* Bottom action bar */}
      <div className="page-actions" style={{ maxWidth: '980px', margin: '20px auto 60px', padding: '0 1rem' }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-create-booking" onClick={handleCreateBooking} disabled={!agreedToTerms || loading}>{loading ? 'Creating...' : 'Confirm & Pay'}</button>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Terms and Conditions</h3>
              <button className="modal-close" onClick={() => setShowTermsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4>1. Rental Agreement</h4>
              <p>By renting a vehicle from our service, you agree to use the vehicle responsibly and return it in the same condition as received.</p>
              
              <h4>2. Driver Requirements</h4>
              <p>The driver must be at least 21 years old and possess a valid driver's license for at least 1 year.</p>
              
              <h4>3. Vehicle Usage</h4>
              <p>The vehicle may only be driven by the person(s) listed on the rental agreement. Unauthorized drivers are prohibited.</p>
              
              <h4>4. Fuel Policy</h4>
              <p>For electric vehicles, please return the car with at least 70% battery charge. Additional charging fees may apply if returned below this level.</p>
              
              <h4>5. Damage and Liability</h4>
              <p>The renter is responsible for any damage to the vehicle during the rental period, excluding normal wear and tear.</p>
              
              <h4>6. Cancellation Policy</h4>
              <p>Cancellations made more than 24 hours before pick-up time will receive a full refund. Cancellations within 24 hours will forfeit the deposit.</p>
              
              <h4>7. Late Returns</h4>
              <p>Late returns will be charged at 1.5x the hourly rate for each additional hour.</p>
              
              <h4>8. Insurance</h4>
              <p>Basic insurance is included in the rental price. Additional coverage options are available at checkout.</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPolicyModal && (
        <div className="modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Privacy Policy</h3>
              <button className="modal-close" onClick={() => setShowPolicyModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4>1. Information Collection</h4>
              <p>We collect personal information including name, email, phone number, driver's license details, and payment information necessary to process your rental booking.</p>
              
              <h4>2. Use of Information</h4>
              <p>Your information is used solely for processing rentals, communication regarding your booking, and improving our services.</p>
              
              <h4>3. Data Security</h4>
              <p>We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or misuse.</p>
              
              <h4>4. Third-Party Sharing</h4>
              <p>We do not sell or share your personal information with third parties except as required for payment processing or legal compliance.</p>
              
              <h4>5. Cookies</h4>
              <p>Our website uses cookies to enhance user experience and analyze site traffic. You can disable cookies in your browser settings.</p>
              
              <h4>6. Data Retention</h4>
              <p>We retain your booking information for 7 years as required by law. You may request deletion of your data at any time.</p>
              
              <h4>7. Your Rights</h4>
              <p>You have the right to access, correct, or delete your personal information. Contact our support team to exercise these rights.</p>
              
              <h4>8. Contact</h4>
              <p>For privacy concerns or questions, please contact us at privacy@carental.com</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
