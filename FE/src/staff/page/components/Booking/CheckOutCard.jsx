import React, { useState } from 'react'
import StaffAPI from '../../../services/staffApi'
import API from '../../../../services/api' // Add central API for payment

function formatVND(n) {
  try {
    const x = Number(n) || 0
    return x.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
  } catch {
    return `${n} VND`
  }
}

export default function CheckOutCard({ booking, onClose, onCheckedOut }){
  const [checkOutNotes, setCheckOutNotes] = useState('')
  const [damageFee, setDamageFee] = useState(0)
  const [returnDate, setReturnDate] = useState('')
  const [returnTime, setReturnTime] = useState('15:00')
  const [calendarMode, setCalendarMode] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [serverTime, setServerTime] = useState(null)
  
  // Payment states
  const [checkOutResponse, setCheckOutResponse] = useState(null)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  // Time options (6:00 - 23:00)
  const timeOptions = Array.from({ length: 18 }, (_,i)=> `${(6+i).toString().padStart(2,'0')}:00`)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const st = await StaffAPI.getServerTime()
        if (mounted) {
          setServerTime(st)
          // Set initial date to today
          if (st) {
            const isoString = st.toISOString()
            const dateOnly = isoString.split('T')[0]
            setReturnDate(dateOnly)
          }
        }
        try {
          const deltaMs = st ? (st.getTime() - Date.now()) : 0
          console.log('⏱️ Server time:', st, 'Client time:', new Date(), 'Δ(ms):', deltaMs)
        } catch {}
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  function renderCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const cells = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      cells.push(<div key={`empty-${i}`}></div>)
    }
    
    // Days of month
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      const dateObj = new Date(dateStr)
      const isPast = dateObj < today
      const isSelected = dateStr === returnDate
      const classes = ['calendar-day']
      if (isPast) classes.push('past')
      if (isSelected) classes.push('selected')
      
      cells.push(
        <div 
          key={dateStr} 
          className={classes.join(' ')} 
          onClick={(e)=>{ 
            e.stopPropagation()
            if(!isPast) { 
              setReturnDate(dateStr)
              setCalendarMode(null) 
            } 
          }}
          style={{cursor: isPast ? 'not-allowed' : 'pointer'}}
        >
          {day}
        </div>
      )
    }
    return cells
  }

  function changeMonth(delta) {
    let m = currentMonth + delta
    let y = currentYear
    if(m > 11){ m = 0; y++ }
    if(m < 0){ m = 11; y-- }
    setCurrentMonth(m)
    setCurrentYear(y)
  }

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
            const decoded = StaffAPI.decodeJwt(t)
            userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || decoded.userId || decoded.UserId || decoded.id || decoded.Id || ''
          }
        } catch {}
      }
      if (!userId) throw new Error('Unable to determine userId. Please sign in again.')

      // Build payload for checkout
      const payload = {
        bookingId: booking.id,
        staffId: userId,
        actualReturnDateTime: returnDate && returnTime ? new Date(`${returnDate}T${returnTime}`).toISOString() : new Date().toISOString(),
        checkOutPhotoUrl: '',
        damageFee: Number(damageFee) || 0,
      }
      const notes = (checkOutNotes || '').trim()
      if (notes) payload.checkOutNotes = notes
      
      // Call check-out API
      const response = await StaffAPI.checkOutWithPayment(payload)
      console.log('✅ Check-out response:', response)
      
      // Save bookingId to localStorage for payment tracking
      localStorage.setItem('activeCheckOutBookingId', booking.id)
      console.log('💾 Saved activeCheckOutBookingId to localStorage:', booking.id)
      
      // Set check-out response to display payment info
      setCheckOutResponse(response)
      
      // Get updated booking info to fetch totalAmount and fees
      const updatedBooking = await StaffAPI.getBookingById(booking.id)
      console.log('📚 Updated booking:', updatedBooking)
      
      // Store updated booking data in response for display
      if (updatedBooking) {
        setCheckOutResponse(prev => ({...prev, ...updatedBooking}))
      }
      
      // Auto-create payment if there's damage fee OR extraAmount from backend
      const damageAmount = Number(damageFee) || 0
      const backendExtraAmount = Number(updatedBooking?.extraAmount || 0)
      const totalExtraAmount = damageAmount + backendExtraAmount
      
      console.log('💰 Payment amounts - Damage:', damageAmount, 'Backend Extra:', backendExtraAmount, 'Total:', totalExtraAmount)
      
      if (totalExtraAmount > 0) {
        setPaymentLoading(true)
        try {
          // Create payment session with paymentType = 2 (checkout payment)
          // Use totalExtraAmount to include both damage fee and backend calculated fees
          const paymentRes = await API.createPayment(booking.id, 2, 'Rental payment at check-out', totalExtraAmount)
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
          setError(`Check-out succeeded but payment setup failed: ${payErr?.message}. Please try again.`)
        } finally {
          setPaymentLoading(false)
        }
      }
      
      if (typeof onCheckedOut === 'function') onCheckedOut(booking.id, payload)
    } catch (e) {
      const body = e?.body || e?.response?.data
      const errs = (body && (body.errors || body.Errors)) || null
      const msg = (Array.isArray(errs) && errs.length ? errs.join('; ') : null) || body?.message || e?.message || 'Failed to save check-out'
      setError(msg)
      try { console.error('❌ Check-out failed:', { error: e?.message, status: e?.status || e?.response?.status, body }) } catch {}
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoToPayment() {
    if (!booking?.id) return
    setPaymentLoading(true)
    setError('')
    try {
      // Save bookingId for payment tracking
      localStorage.setItem('activeCheckOutBookingId', booking.id)
      
      // Get amount to pay from checkOutResponse
      const extraAmount = Number(checkOutResponse?.extraAmount || 0)
      const damageAmount = Number(damageFee) || 0
      const totalAmount = Math.max(extraAmount, damageAmount) // Use whichever is larger
      
      console.log('💰 Creating payment - ExtraAmount:', extraAmount, 'DamageFee:', damageAmount, 'Using:', totalAmount)
      
      // Create payment session with paymentType = 2 (checkout payment)
      // Use central API instead of StaffAPI
      const paymentRes = await API.createPayment(booking.id, 2, 'Rental payment at check-out', totalAmount)
      console.log('✅ Payment created:', paymentRes)
      
      // Extract checkout URL from response
      const data = paymentRes || {}
      const checkoutUrlValue = data.checkoutUrl || data.url || data.payUrl || ''
      
      if (checkoutUrlValue) {
        console.log('🔄 Opening Payos checkout:', checkoutUrlValue)
        setCheckoutUrl(checkoutUrlValue)
        // Open in new window/tab instead of redirecting
        window.open(checkoutUrlValue, '_blank')
      } else {
        console.warn('⚠️ No checkout URL in payment response:', data)
        setError('No checkout URL received. Please try again.')
      }
    } catch (payErr) {
      console.error('❌ Payment creation failed:', payErr?.message)
      setError(`Payment setup failed: ${payErr?.message}`)
    } finally {
      setPaymentLoading(false)
    }
  }

  async function handleSyncPayment() {
    if (!booking?.id) return
    setSyncing(true)
    setError('')
    try {
      console.log('🔄 Syncing payment for booking:', booking.id)
      await API.syncPayment(booking.id)
      console.log('✅ Payment synced successfully')
      
      // Fetch updated booking to check status
      const updatedBooking = await API.getBookingById(booking.id)
      console.log('📊 Updated booking status:', updatedBooking.bookingStatus)
      
      setSyncSuccess(true)
      setError('')
      
      // Notify parent and close after short delay
      setTimeout(() => {
        if (typeof onCheckedOut === 'function') onCheckedOut(booking.id)
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

  return (
    <div className="modal-content" style={{width:'min(720px,95vw)', maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:8, boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
      <span className="close-btn" onClick={onClose}>&times;</span>
      
      {!checkOutResponse ? (
          <>
            <h3 style={{marginBottom:12}}>Check Out</h3>
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
              {/* Return Date & Time */}
              <div style={{display:'flex', gap:12, position:'relative'}}>
                <div style={{flex:1, position:'relative'}}>
                  <label style={{display:'flex', flexDirection:'column', gap:6}}>
                    <span>Return Date</span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setCalendarMode(calendarMode === 'return' ? null : 'return') }}
                      style={{
                        padding:'8px 12px', 
                        border:'1px solid #ccc', 
                        borderRadius:6, 
                        cursor:'pointer',
                        background:'#fff'
                      }}
                    >
                      {returnDate ? new Date(returnDate).toLocaleDateString() : 'Select date'}
                    </div>
                  </label>
                  {calendarMode === 'return' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position:'absolute', 
                        top:'100%', 
                        left:0, 
                        background:'#fff', 
                        border:'1px solid #ddd', 
                        borderRadius:6, 
                        padding:12, 
                        marginTop:4,
                        zIndex:10,
                        minWidth:280,
                        boxShadow:'0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(-1) }} style={{background:'none', border:'none', cursor:'pointer', fontSize:16}}>◀</button>
                        <span style={{fontWeight:600}}>{new Date(currentYear, currentMonth).toLocaleString('default', {month:'long', year:'numeric'})}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(1) }} style={{background:'none', border:'none', cursor:'pointer', fontSize:16}}>▶</button>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:8}}>
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center', fontSize:12, fontWeight:600}}>{d}</div>)}
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4}}>
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{flex:1, position:'relative'}}>
                  <label style={{display:'flex', flexDirection:'column', gap:6}}>
                    <span>Return Time</span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setCalendarMode(calendarMode === 'return-time' ? null : 'return-time') }}
                      style={{
                        padding:'8px 12px', 
                        border:'1px solid #ccc', 
                        borderRadius:6, 
                        cursor:'pointer',
                        background:'#fff'
                      }}
                    >
                      {returnTime}
                    </div>
                  </label>
                  {calendarMode === 'return-time' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position:'absolute', 
                        top:'100%', 
                        left:0, 
                        right:0, 
                        background:'#fff', 
                        border:'1px solid #ddd', 
                        borderRadius:6, 
                        padding:8, 
                        marginTop:4,
                        zIndex:1001,
                        maxHeight:240,
                        overflow:'auto',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                      {timeOptions.map(t=>(
                        <div 
                          key={t} 
                          onClick={(e) => { e.stopPropagation(); setReturnTime(t); setCalendarMode(null) }}
                          style={{
                            padding:'8px 12px',
                            cursor:'pointer',
                            background: t === returnTime ? '#e3f2fd' : '#fff',
                            color: t === returnTime ? '#1976d2' : '#333',
                            fontWeight: t === returnTime ? '600' : '400',
                            borderRadius:4,
                            marginBottom:4
                          }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label style={{display:'flex', flexDirection:'column', gap:6}}>
                <span>Check-out Notes</span>
                <textarea rows={4} value={checkOutNotes} onChange={e=>setCheckOutNotes(e.target.value)} placeholder="Notes about the vehicle condition upon return, battery level, etc." />
              </label>
              <label style={{display:'flex', flexDirection:'column', gap:6}}>
                <span>Damage Fee (VND)</span>
                <input 
                  type="number" 
                  min="0" 
                  value={damageFee} 
                  onChange={e => setDamageFee(e.target.value)} 
                  placeholder="Enter damage fee (based on incidents reviewed)" 
                />
              </label>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
                <button type="button" onClick={onClose} style={{background:'transparent', color:'#333', border:'1px solid #aaa', borderRadius:8, padding:'8px 14px'}}>Cancel</button>
                <button type="submit" disabled={submitting} style={{background:'#d32f2f', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px'}}>
                  {submitting ? 'Processing…' : 'Confirm Check Out'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 style={{marginBottom:12}}>Check-out Successful</h3>
            <div style={{background:'#e8f5e9', color:'#2e7d32', padding:'12px', borderRadius:6, marginBottom:12}}>
              ✅ {checkOutResponse?.message || 'Check-out successful!'}
            </div>
            
            {error && <div style={{background:'#ffebee', color:'#d32f2f', padding:'12px', borderRadius:6, marginBottom:12}}>{error}</div>}
            
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
                    <span>Damage Fee:</span>
                    <strong style={{color:'#d32f2f'}}>{formatVND(checkOutResponse?.damageFee || 0)}</strong>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14}}>
                    <span>Late Fee:</span>
                    <strong style={{color:'#d32f2f'}}>{formatVND(checkOutResponse?.lateFee || 0)}</strong>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', borderTop:'1px solid #eee', paddingTop:8, fontSize:14, fontWeight:600}}>
                    <span>Total Additional Fees:</span>
                    <strong style={{color:'#d32f2f'}}>{formatVND((checkOutResponse?.damageFee || 0) + (checkOutResponse?.lateFee || 0))}</strong>
                  </div>
                </div>
              </div>
              
              {/* Right: Payment button or status */}
              <div style={{flex:'1 1 280px', minWidth:260}}>
                <div style={{background:'#f5f5f5', padding:16, borderRadius:8, textAlign:'center'}}>
                  <div style={{fontSize:16, fontWeight:600, marginBottom:12, color:'#333'}}>
                    💳 Payment
                  </div>
                  {(checkOutResponse?.extraAmount || 0) > 0 ? (
                    <>
                      <div style={{fontSize:13, color:'#666', marginBottom:16, lineHeight:1.5}}>
                        Amount to pay: <strong>{formatVND(checkOutResponse?.extraAmount || 0)}</strong>
                      </div>
                      {!checkoutUrl ? (
                        <button 
                          onClick={handleGoToPayment}
                          disabled={paymentLoading}
                          style={{
                            background:'#4CAF50', 
                            color:'#fff', 
                            border:'none', 
                            padding:'10px 20px', 
                            borderRadius:6, 
                            cursor:paymentLoading ? 'not-allowed' : 'pointer',
                            fontSize:14, 
                            fontWeight:600,
                            width:'100%',
                            marginBottom:8
                          }}
                        >
                          {paymentLoading ? '⏳ Opening Payment...' : '💳 Go to Payment'}
                        </button>
                      ) : (
                        <>
                          <div style={{fontSize:12, color:'#666', marginBottom:12}}>
                            ✅ Payment link opened in new tab
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
                      )}
                    </>
                  ) : (
                    <div style={{fontSize:13, color:'#2e7d32', padding:'12px', background:'#e8f5e9', borderRadius:6}}>
                      ✅ No additional payment needed
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{background:'#fff9c4', padding:12, borderRadius:6, marginBottom:16, fontSize:13, color:'#f57f17', lineHeight:1.5}}>
              ℹ️ <strong>Note:</strong> Click "Go to Payment" to open Payos in new tab. After customer completes payment, click "Sync Payment Status" to update booking.
            </div>
            
            <div style={{display:'flex', gap:12, justifyContent:'center'}}>
              <button onClick={onClose} style={{background:'#666', color:'#fff', border:'none', padding:'10px 20px', borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600}}>
                Close
              </button>
            </div>
          </>
        )}
    </div>
  )
}
