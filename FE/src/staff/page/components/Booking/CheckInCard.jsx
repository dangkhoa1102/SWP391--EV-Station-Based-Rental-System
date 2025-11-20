import React, { useState } from 'react'
import StaffAPI from '../../../../services/staffApi'
import paymentApi from '../../../../services/paymentApi'
import bookingApi from '../../../../services/bookingApi'
import { decodeJwt } from '../../../../services/api'

function formatVND(n) {
  try {
    const x = Number(n) || 0
    return x.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
  } catch {
    return `${n} VND`
  }
}

export default function CheckInCard({ booking, onClose, onCheckedIn }){
  const [checkInNotes, setCheckInNotes] = useState('')
  const [checkInPhoto, setCheckInPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [serverTime, setServerTime] = useState(null)
  
  // Payment states
  const [checkInResponse, setCheckInResponse] = useState(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrText, setQrText] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const st = await StaffAPI.getServerTime()
        if (mounted) setServerTime(st)
        // Log for diagnosis: compare server vs client
        try {
          const deltaMs = st ? (st.getTime() - Date.now()) : 0
          console.log('⏱️ Server time:', st, 'Client time:', new Date(), 'Δ(ms):', deltaMs)
        } catch {}
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  async function handleSubmit(e){
    e.preventDefault()
    if (!booking?.id) return
    setSubmitting(true)
    setError('')
    try {
      // Ensure we have an auth token
      const token = localStorage.getItem('token')
      if (!token || token === 'null') {
        throw new Error('You are not signed in. Please sign in as Staff and try again (401).')
      }

      // Get userId from localStorage or token
      let userId = ''
      try { userId = localStorage.getItem('userId') || '' } catch {}
      if (!userId) {
        try {
          const t = localStorage.getItem('token')
          if (t) {
            const decoded = decodeJwt(t)
            userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || decoded.userId || decoded.UserId || decoded.id || decoded.Id || ''
          }
        } catch {}
      }
      if (!userId) throw new Error('Unable to determine userId. Please sign in again.')

      // Build payload for multipart/form-data
      const payload = {
        bookingId: booking.id,
        staffId: userId,
      }
      const notes = (checkInNotes || '').trim()
      if (notes) payload.checkInNotes = notes
      if (checkInPhoto) {
        payload.checkInPhotoFile = checkInPhoto
      }
      
      // Call check-in API and get response with totalAmount
      const response = await StaffAPI.checkInWithContract(payload)
      console.log('✅ Check-in response:', response)
      
      // Save bookingId to localStorage for payment tracking
      localStorage.setItem('activeCheckInBookingId', booking.id)
      console.log('💾 Saved activeCheckInBookingId to localStorage:', booking.id)
      
      // Set check-in response to display payment info
      setCheckInResponse(response)
      
      // Extract totalAmount from response
      const totalAmount = response?.totalAmount || response?.TotalAmount || 0
      console.log('💰 Total amount for payment:', totalAmount)
      
      if (totalAmount > 0) {
        setPaymentLoading(true)
        try {
          // Create payment session with numeric paymentType (1 = Rental)
          // Use central API instead of StaffAPI
          const paymentRes = await paymentApi.createPayment(booking.id, 1, 'Rental payment at check-in')
          console.log('✅ Payment created:', paymentRes)
          
          // Extract checkout URL from response
          const data = paymentRes || {}
          const checkoutUrlValue = data.checkoutUrl || data.url || data.payUrl || ''
          
          if (checkoutUrlValue) {
            console.log('🔄 Opening Payos checkout in new tab:', checkoutUrlValue)
            setCheckoutUrl(checkoutUrlValue)
            // Open PayOS in new tab instead of redirecting
            window.open(checkoutUrlValue, '_blank')
          } else {
            console.warn('⚠️ No checkout URL in payment response:', data)
            setCheckoutUrl('')
            setError('Payment session created but no checkout URL received. Please try again.')
          }
        } catch (payErr) {
          console.error('❌ Payment creation failed:', payErr?.message)
          setError(`Check-in succeeded but payment setup failed: ${payErr?.message}. Please try again.`)
        } finally {
          setPaymentLoading(false)
        }
      }
      
      if (typeof onCheckedIn === 'function') onCheckedIn(booking.id, payload)
    } catch (e) {
      const body = e?.body || e?.response?.data
      const errs = (body && (body.errors || body.Errors)) || null
      const msg = (Array.isArray(errs) && errs.length ? errs.join('; ') : null) || body?.message || e?.message || 'Failed to save check-in'
      setError(msg)
      try { console.error('❌ Check-in failed:', { error: e?.message, status: e?.status || e?.response?.status, body }) } catch {}
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSyncPayment() {
    if (!booking?.id) return
    setSyncing(true)
    setError('')
    try {
      console.log('🔄 Syncing payment for booking:', booking.id)
      await paymentApi.syncPayment(booking.id)
      console.log('✅ Payment synced successfully')
      
      // Fetch updated booking to check status
      const updatedBooking = await bookingApi.getBookingById(booking.id)
      console.log('📊 Updated booking status:', updatedBooking.bookingStatus)
      
      setSyncSuccess(true)
      setError('')
      
      // Notify parent and close after short delay
      setTimeout(() => {
        if (typeof onCheckedIn === 'function') onCheckedIn(booking.id)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('❌ Payment sync failed:', err)
      setError(`Payment sync failed: ${err.message}`)
      setSyncSuccess(false)
    } finally {
      setSyncing(false)
    }
  }

  const resolvedQrImage = qrImageUrl || (qrText ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrText)}` : '')

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{width:'min(720px,95vw)', maxHeight:'90vh', overflow:'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
        {!checkInResponse ? (
          <>
            <h3 style={{marginBottom:12}}>Check In</h3>
            {serverTime && (
              <div style={{fontSize:12, color:'#666', marginBottom:8}}>
                Server time: {serverTime.toLocaleString()}
              </div>
            )}
            {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>}
            <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:12}}>
              <img src={booking?.img || booking?.carImageUrl || 'https://via.placeholder.com/160x100?text=Car'} alt="Car" style={{width:160, height:100, objectFit:'cover', borderRadius:8}} />
              <div>
                <div style={{fontSize:18, fontWeight:700}}>{booking?.title || 'Vehicle'}</div>
                <div style={{color:'#555'}}>Booking: {booking?.id}</div>
              </div>
            </div>
            <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:12}}>
              <label style={{display:'flex', flexDirection:'column', gap:6}}>
                <span>Check-in Notes</span>
                <textarea rows={5} value={checkInNotes} onChange={e=>setCheckInNotes(e.target.value)} placeholder="Notes about the vehicle condition, accessories, battery, etc." />
              </label>
              <label style={{display:'flex', flexDirection:'column', gap:6}}>
                <span>Check-in Photo (Optional)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setCheckInPhoto(e.target.files[0] || null)} 
                  placeholder="Select an image file" 
                />
                {checkInPhoto && (
                  <div style={{fontSize:12, color:'#666'}}>
                    Selected: {checkInPhoto.name} ({(checkInPhoto.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </label>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
                <button type="button" onClick={onClose} style={{background:'transparent', color:'#333', border:'1px solid #aaa', borderRadius:8, padding:'8px 14px'}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{background: submitting ? '#9e9e9e' : '#2e7d32', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', cursor: submitting ? 'not-allowed' : 'pointer'}}>
                  {submitting ? 'Processing…' : 'Confirm Check In'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 style={{marginBottom:12}}>Check-in Successful</h3>
            <div style={{background:'#e8f5e9', color:'#2e7d32', padding:'12px', borderRadius:6, marginBottom:12}}>
              ✅ {checkInResponse?.message || 'Check-in successful!'}
            </div>
            
            {error && <div style={{background:'#ffebee', color:'#d32f2f', padding:'12px', borderRadius:6, marginBottom:12}}>{error}</div>}
            
            {paymentLoading && (
              <div style={{background:'#e3f2fd', color:'#1565c0', padding:'12px', borderRadius:6, marginBottom:12, textAlign:'center'}}>
                🔄 Creating payment session and redirecting to Payos...
              </div>
            )}
            
            {checkoutUrl && !paymentLoading && (
              <div style={{background:'#f3e5f5', color:'#7b1fa2', padding:'12px', borderRadius:6, marginBottom:12, textAlign:'center'}}>
                ✅ Payment session created. Payos opened in new tab.
              </div>
            )}
            
            {syncSuccess && (
              <div style={{background:'#e8f5e9', color:'#2e7d32', padding:'12px', borderRadius:6, marginBottom:12, textAlign:'center'}}>
                ✅ Payment synced successfully! Closing...
              </div>
            )}
            
            <div style={{display:'flex', gap:16, flexWrap:'wrap', marginBottom:16}}>
              {/* Left: Booking & Amount info */}
              <div style={{flex:'1 1 300px', minWidth:260}}>
                <div style={{display:'flex', gap:12, marginBottom:12}}>
                  <img src={booking?.img || booking?.carImageUrl || 'https://via.placeholder.com/120x80?text=Car'} alt="Car" style={{width:120, height:80, objectFit:'cover', borderRadius:6}} />
                  <div style={{flex:1}}>
                    <h4 style={{margin:'0 0 4px'}}>{booking?.title || 'Vehicle'}</h4>
                    <div style={{fontSize:12, color:'#666'}}>ID: {booking?.id}</div>
                  </div>
                </div>
                
                <div style={{borderTop:'1px solid #eee', paddingTop:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14}}>
                    <span>Total Amount:</span>
                    <strong>{formatVND(checkInResponse?.totalAmount || 0)}</strong>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:14}}>
                    <span>Deposit (30%):</span>
                    <strong>{formatVND(checkInResponse?.depositAmount || 0)}</strong>
                  </div>
                </div>
              </div>
              
              {/* Right: Status info */}
              <div style={{flex:'1 1 280px', minWidth:260}}>
                <div style={{background:'#f5f5f5', padding:16, borderRadius:8, textAlign:'center'}}>
                  <div style={{fontSize:16, fontWeight:600, marginBottom:12, color:'#333'}}>
                    💳 Payment Processing
                  </div>
                  {paymentLoading ? (
                    <>
                      <div style={{fontSize:13, color:'#666', marginBottom:12, lineHeight:1.5}}>
                        Preparing payment link...
                      </div>
                      <div style={{fontSize:12, color:'#999'}}>
                        You will be redirected to Payos to complete payment.
                      </div>
                    </>
                  ) : checkoutUrl ? (
                    <>
                      <div style={{fontSize:13, color:'#666', marginBottom:12, lineHeight:1.5}}>
                        ✅ Payment link opened in new tab
                      </div>
                      <div style={{fontSize:12, color:'#999', marginBottom:16}}>
                        After customer completes payment, click the button below to sync
                      </div>
                      <button 
                        onClick={handleSyncPayment}
                        disabled={syncing || syncSuccess}
                        style={{
                          background: syncSuccess ? '#2e7d32' : '#1976d2',
                          color:'#fff',
                          border:'none',
                          borderRadius:8,
                          padding:'10px 20px',
                          cursor: syncing || syncSuccess ? 'not-allowed' : 'pointer',
                          fontSize:14,
                          fontWeight:600,
                          width:'100%'
                        }}
                      >
                        {syncing ? '🔄 Syncing...' : syncSuccess ? '✅ Synced!' : '🔄 Sync Payment Status'}
                      </button>
                    </>
                  ) : (
                    <div style={{fontSize:13, color:'#d32f2f', padding:'12px', background:'#ffebee', borderRadius:6}}>
                      ⚠️ Payment setup incomplete
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{background:'#fff9c4', padding:12, borderRadius:6, marginBottom:16, fontSize:13, color:'#f57f17', lineHeight:1.5}}>
              ℹ️ <strong>Note:</strong> You will be redirected to Payos to complete payment. After payment completes, you will be redirected to the payment success page.
            </div>
            
            {!paymentLoading && !checkoutUrl && (
              <div style={{display:'flex', gap:12, justifyContent:'center'}}>
                <button onClick={onClose} style={{background:'#666', color:'#fff', border:'none', padding:'10px 20px', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600}}>
                  Close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
