# CHECKOUT & CHECK-IN UPDATE SUMMARY
## Date: November 10, 2025
## Project: SWP391--EV-Station-Based-Rental-System (FE)

---

## 📑 TABLE OF CONTENTS
1. [Overview](#overview)
2. [New Files Created](#new-files-created)
3. [Files Modified](#files-modified)
4. [API Changes](#api-changes)
5. [Key Features](#key-features)
6. [Deployment Checklist](#deployment-checklist)

---

## 📋 OVERVIEW

This update implements complete Check-In and Check-Out workflows for staff:
- **Check-In**: Form with notes and photo upload, automatic payment redirect to Payos
- **Check-Out**: Form with return date/time picker, damage fee, incidents display
- **Payment Integration**: Conditional payment based on fees (extraAmount)
- **Real-time Tracking**: localStorage-based payment status polling
- **Side-by-side Modals**: Checkout and Incidents display together

---

## 🆕 NEW FILES CREATED

### 1. `src/staff/page/components/Booking/CheckOutCard.jsx`

**Purpose**: Component for vehicle return checkout with damage assessment and payment

**Key Features**:
- Return Date & Time picker (Calendar + Time dropdown)
- Check-out Notes textarea
- Damage Fee number input
- Show Damage Fee + Late Fee only (not Total/Deposit)
- Payment button (visible only if extraAmount > 0)
- Auto-save bookingId to localStorage for payment tracking

**Key Code**:
```javascript
import React, { useState } from 'react'
import StaffAPI from '../../../services/staffApi'

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
        <div key={dateStr} className={classes.join(' ')} onClick={()=>{ if(!isPast) { setReturnDate(dateStr); setCalendarMode(null) } }}>
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
      
      // Create payment session with paymentType = 2 (checkout payment)
      const paymentRes = await StaffAPI.createPayment(booking.id, 2, 'Rental payment at check-out')
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
              <div style={{display:'flex', gap:12}}>
                <div style={{flex:1}}>
                  <label style={{display:'flex', flexDirection:'column', gap:6}}>
                    <span>Return Date</span>
                    <div 
                      onClick={()=>setCalendarMode(calendarMode === 'return' ? null : 'return')}
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
                    {calendarMode === 'return' && (
                      <div style={{
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
                          <button type="button" onClick={()=>changeMonth(-1)} style={{background:'none', border:'none', cursor:'pointer', fontSize:16}}>◀</button>
                          <span style={{fontWeight:600}}>{new Date(currentYear, currentMonth).toLocaleString('default', {month:'long', year:'numeric'})}</span>
                          <button type="button" onClick={()=>changeMonth(1)} style={{background:'none', border:'none', cursor:'pointer', fontSize:16}}>▶</button>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4, marginBottom:8}}>
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center', fontSize:12, fontWeight:600}}>{d}</div>)}
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4}}>
                          {renderCalendar()}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                
                <div style={{flex:1}}>
                  <label style={{display:'flex', flexDirection:'column', gap:6}}>
                    <span>Return Time</span>
                    <div 
                      onClick={()=>setCalendarMode(calendarMode === 'return-time' ? null : 'return-time')}
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
                    {calendarMode === 'return-time' && (
                      <div style={{
                        position:'absolute', 
                        top:'100%', 
                        right:0, 
                        background:'#fff', 
                        border:'1px solid #ddd', 
                        borderRadius:6, 
                        padding:8, 
                        marginTop:4,
                        zIndex:10,
                        maxHeight:240,
                        overflow:'auto',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        {timeOptions.map(t=>(
                          <div 
                            key={t} 
                            onClick={()=>{ setReturnTime(t); setCalendarMode(null) }}
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
                  </label>
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
                          width:'100%'
                        }}
                      >
                        {paymentLoading ? '⏳ Opening Payment...' : '💳 Go to Payment'}
                      </button>
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
              ℹ️ <strong>Note:</strong> Click "Go to Payment" to complete payment on Payos. After payment, the booking will be automatically updated.
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
```

---

### 2. `src/staff/page/components/Booking/IncidentsModal.jsx`

**Purpose**: Display incidents for booking (damage assessment)

**Key Code**:
```javascript
import React, { useState, useEffect } from 'react'
import StaffAPI from '../../../services/staffApi'

export default function IncidentsModal({ bookingId, onClose }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (!bookingId) return
    
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await StaffAPI.getIncidentsByBooking(bookingId, page, pageSize)
        setIncidents(Array.isArray(data) ? data : [])
        console.log('✅ Incidents loaded:', data)
      } catch (err) {
        console.error('❌ Failed to load incidents:', err)
        setError(err?.message || 'Failed to load incidents')
      } finally {
        setLoading(false)
      }
    })()
  }, [bookingId, page])

  const getSeverityColor = (severity) => {
    const s = String(severity || '').toLowerCase()
    if (s.includes('high')) return '#d32f2f'
    if (s.includes('medium')) return '#f57c00'
    if (s.includes('low')) return '#fbc02d'
    return '#666'
  }

  return (
    <div className="modal-content" style={{width:'min(420px,95vw)', maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:8, boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h3 style={{margin:0}}>Related Incidents</h3>
        <span className="close-btn" onClick={onClose} style={{cursor:'pointer', fontSize:24}}>&times;</span>
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:'20px', color:'#999'}}>⏳ Loading incidents...</div>
      ) : error ? (
        <div style={{background:'#ffebee', color:'#d32f2f', padding:'12px', borderRadius:6}}>❌ {error}</div>
      ) : incidents.length === 0 ? (
        <div style={{textAlign:'center', padding:'20px', color:'#999'}}>📋 No incidents reported for this booking</div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {incidents.map((incident, idx) => (
            <div key={idx} style={{border:'1px solid #eee', padding:12, borderRadius:6}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                <h4 style={{margin:'0 0 4px', fontSize:14, fontWeight:600}}>{incident.title}</h4>
                <div style={{background:getSeverityColor(incident.severity), color:'#fff', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600}}>
                  {incident.severity || 'N/A'}
                </div>
              </div>
              <p style={{margin:'0 0 8px', fontSize:13, color:'#555', lineHeight:1.4}}>{incident.description}</p>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#999'}}>
                <span>Est. Cost: <strong>{incident.estimatedCost ? `$${Number(incident.estimatedCost).toFixed(2)}` : 'N/A'}</strong></span>
                <span>{incident.timestamp ? new Date(incident.timestamp).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div style={{display:'flex', gap:8, justifyContent:'center', marginTop:16}}>
          <button onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{padding:'6px 12px', border:'1px solid #ccc', borderRadius:4, cursor:page === 1 ? 'not-allowed' : 'pointer'}}>← Prev</button>
          <span style={{padding:'6px 12px'}}>Page {page}</span>
          <button onClick={()=>setPage(p => p+1)} style={{padding:'6px 12px', border:'1px solid #ccc', borderRadius:4, cursor:'pointer'}}>Next →</button>
        </div>
      )}
    </div>
  )
}
```

---

## 📝 FILES MODIFIED

### 1. `src/staff/services/staffApi.js`

#### A. `checkInWithContract()` - FormData Support

**Before**:
```javascript
// Send as JSON only
const res = await apiClient.post(url, jsonPayload, {
  headers: { 'Content-Type': 'application/json' }
})
```

**After** (lines 1383-1465):
```javascript
API.checkInWithContract = async (payload) => {
  if (!payload || !payload.bookingId || !payload.staffId) {
    throw new Error('Missing required fields: bookingId, staffId')
  }
  
  const attempts = [
    '/bookings/Check-In-With-Contract',
    '/Bookings/Check-In-With-Contract',
    '/Bookings/CheckInWithContract',
  ]
  let lastErr
  
  for (const url of attempts) {
    // Try with FormData first (multipart/form-data)
    if (payload.checkInPhotoFile && payload.checkInPhotoFile instanceof File) {
      try {
        const formData = new FormData()
        formData.append('bookingId', payload.bookingId)
        formData.append('staffId', payload.staffId)
        if (payload.checkInNotes) {
          formData.append('checkInNotes', payload.checkInNotes)
        }
        if (payload.checkInPhotoUrl && !payload.checkInPhotoUrl.startsWith('blob:')) {
          formData.append('checkInPhotoUrl', payload.checkInPhotoUrl)
        }
        formData.append('checkInPhotoFile', payload.checkInPhotoFile)
        
        const res = await apiClient.post(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const body = res?.data
        if (body && typeof body === 'object' && 'data' in body) {
          if (body.isSuccess === false) {
            const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
            const err = new Error(msg)
            err.body = body
            throw err
          }
          return body.data
        }
        return body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    
    // Try with JSON payload
    try {
      const { checkInPhotoFile, ...jsonPayload } = payload
      const res = await apiClient.post(url, jsonPayload, {
        headers: { 'Content-Type': 'application/json' }
      })
      const body = res?.data
      if (body && typeof body === 'object' && 'data' in body) {
        if (body.isSuccess === false) {
          const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
          const err = new Error(msg)
          err.body = body
          throw err
        }
        return body.data
      }
      return body
    } catch (e) {
      lastErr = e
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw lastErr || new Error('Check-In-With-Contract endpoint not found')
}
```

#### B. `checkOutWithPayment()` - New Function (lines 1467-1545)

```javascript
API.checkOutWithPayment = async (payload) => {
  if (!payload || !payload.bookingId || !payload.staffId) {
    throw new Error('Missing required fields: bookingId, staffId')
  }
  
  const attempts = [
    '/bookings/Check-Out-With-Payment',
    '/Bookings/Check-Out-With-Payment',
    '/Bookings/CheckOutWithPayment',
  ]
  let lastErr
  
  for (const url of attempts) {
    // Try with FormData first (multipart/form-data)
    if (payload.checkOutPhotoFile && payload.checkOutPhotoFile instanceof File) {
      try {
        const formData = new FormData()
        formData.append('bookingId', payload.bookingId)
        formData.append('staffId', payload.staffId)
        
        // Add timestamp fields
        if (payload.actualReturnDateTime) {
          formData.append('actualReturnDateTime', payload.actualReturnDateTime)
        }
        
        // Add damage fee
        if (payload.damageFee !== undefined && payload.damageFee !== null) {
          formData.append('damageFee', String(payload.damageFee))
        }
        
        // Add optional notes
        if (payload.checkOutNotes) {
          formData.append('checkOutNotes', payload.checkOutNotes)
        }
        
        // Add photo URL if provided
        if (payload.checkOutPhotoUrl && !payload.checkOutPhotoUrl.startsWith('blob:')) {
          formData.append('checkOutPhotoUrl', payload.checkOutPhotoUrl)
        }
        
        // Add photo file
        formData.append('checkOutPhotoFile', payload.checkOutPhotoFile)
        
        const res = await apiClient.post(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const body = res?.data
        if (body && typeof body === 'object' && 'data' in body) {
          if (body.isSuccess === false) {
            const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
            const err = new Error(msg)
            err.body = body
            throw err
          }
          return body.data
        }
        return body
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
    
    // Try with JSON payload
    try {
      const { checkOutPhotoFile, ...jsonPayload } = payload
      const res = await apiClient.post(url, jsonPayload, {
        headers: { 'Content-Type': 'application/json' }
      })
      const body = res?.data
      if (body && typeof body === 'object' && 'data' in body) {
        if (body.isSuccess === false) {
          const msg = body.message || (Array.isArray(body.errors) ? body.errors.join('; ') : 'Request failed')
          const err = new Error(msg)
          err.body = body
          throw err
        }
        return body.data
      }
      return body
    } catch (e) {
      lastErr = e
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) throw e
    }
  }
  throw lastErr || new Error('Check-Out-With-Payment endpoint not found')
}
```

#### C. `createPayment()` - Modified (lines 1219-1258)

**Before**:
```javascript
API.createPayment = async (bookingId, paymentType = 1, description = 'Rental payment at check-in') => {
  // ... code
}
```

**After**:
```javascript
API.createPayment = async (bookingId, paymentType = 1, description = 'Rental payment at check-in', extraAmount = 0) => {
  if (!bookingId) throw new Error('bookingId is required')
  
  // Ensure paymentType is numeric (convert string to number if needed)
  let numericPaymentType = paymentType
  if (typeof paymentType === 'string') {
    // Map string types to numeric: 'Rental' = 1, 'Deposit' = 0, etc.
    const typeMap = { 'Rental': 1, 'Deposit': 0, 'Penalty': 2, 'Damage': 3 }
    numericPaymentType = typeMap[paymentType] !== undefined ? typeMap[paymentType] : 1
  }
  
  const payloads = [
    // Primary: numeric paymentType with lowercase keys (matches user API)
    { bookingId, paymentType: numericPaymentType, description, extraAmount: Number(extraAmount) || 0 },
    // Fallback: PascalCase keys
    { BookingId: bookingId, PaymentType: numericPaymentType, Description: description, ExtraAmount: Number(extraAmount) || 0 },
  ]
  const endpoints = [
    '/Payment/create', '/Payments/create', '/Payment/Create', '/Payments/Create',
  ]
  let lastErr
  for (const url of endpoints) {
    for (const body of payloads) {
      try {
        const res = await apiClient.post(url, body)
        const data = res?.data
        return data && typeof data === 'object' && 'data' in data ? data.data : data
      } catch (e) {
        lastErr = e
        const code = e?.response?.status
        if (code && code !== 404 && code !== 405) throw e
      }
    }
  }
  throw lastErr || new Error('Create payment endpoint not found')
}
```

#### D. `getIncidentsByBooking()` - New Function (lines 1350-1380)

```javascript
API.getIncidentsByBooking = async (bookingId, page = 1, pageSize = 20) => {
  if (!bookingId) return []
  const id = encodeURIComponent(bookingId)
  
  const attempts = [
    { url: `/Incidents/GetByBooking/${id}`, opts: { params: { page, pageSize } } },
    { url: `/Incident/GetByBooking/${id}`, opts: { params: { page, pageSize } } },
    { url: `/incidents/get-by-booking/${id}`, opts: { params: { page, pageSize } } },
  ]
  
  for (const a of attempts) {
    try {
      const res = await apiClient.get(a.url, a.opts)
      const body = res?.data
      const unwrapped = body && typeof body === 'object' && 'data' in body ? body.data : body
      
      if (!unwrapped) continue
      if (Array.isArray(unwrapped)) return unwrapped
      if (Array.isArray(unwrapped?.items)) return unwrapped.items
      if (Array.isArray(unwrapped?.data)) return unwrapped.data
      
      console.warn('⚠️ Unexpected incidents response format:', unwrapped)
      return Array.isArray(unwrapped) ? unwrapped : []
    } catch (e) {
      const code = e?.response?.status
      if (code && code !== 404 && code !== 405) {
        console.error('❌ Error fetching incidents:', e?.message)
        return []
      }
    }
  }
  return []
}
```

---

### 2. `src/staff/page/components/Booking/CheckInCard.jsx`

**Changes** (lines 60-72):

**Before**:
```javascript
// Resolve Staff entity Id (not just userId)
let staffId = ''
try {
  staffId = await StaffAPI.resolveStaffId()
} catch (ridErr) {
  // Fallback: try userId if staff mapping is not available
  try { staffId = localStorage.getItem('userId') || '' } catch {}
  if (!staffId) throw ridErr
}
```

**After**:
```javascript
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
```

**And save bookingId to localStorage** (after check-in response):
```javascript
// Call check-in API and get response with totalAmount
const response = await StaffAPI.checkInWithContract(payload)
console.log('✅ Check-in response:', response)

// Save bookingId to localStorage for payment tracking
localStorage.setItem('activeCheckInBookingId', booking.id)
console.log('💾 Saved activeCheckInBookingId to localStorage:', booking.id)
```

---

### 3. `src/staff/page/components/Booking/BookingModal.jsx`

**Changes** (around lines 80-120 - when booking status = 'checked-in'):

**Before**:
```javascript
{status === 'checked-in' && (
  <>
    {/* Show 3 payment buttons */}
    {/* Show QR code, payment info */}
  </>
)}
```

**After**:
```javascript
{status === 'checked-in' && (
  <button onClick={onCheckOut} style={{background:'#d32f2f', color:'#fff', width:'100%', padding:'12px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:600, fontSize:14}}>
    Check Out
  </button>
)}
```

Remove payment-related buttons, QR code, and payment info display.

---

### 4. `src/staff/page/components/Booking/BookingSection.jsx`

**Changes**:

**A. Import StaffAPI** (line 8):
```javascript
import StaffAPI from '../../../services/staffApi'
```

**B. Add polling useEffect for checkout** (lines 20-45):
```javascript
React.useEffect(() => {
  if (!checkOutFor?.id) return
  
  // Poll for payment completion (status = 5) every 3 seconds
  const pollInterval = setInterval(async () => {
    try {
      // Get bookingId from localStorage
      const bookingIdFromStorage = localStorage.getItem('activeCheckOutBookingId')
      if (!bookingIdFromStorage) return
      
      const updatedBooking = await StaffAPI.getBookingById(bookingIdFromStorage)
      console.log('📊 Polling booking status:', updatedBooking?.bookingStatus)
      
      // If payment completed (status = 5), close modal and refresh
      if (updatedBooking?.bookingStatus === 5 || updatedBooking?.status === 5 || updatedBooking?.bookingStatus === 'completed' || updatedBooking?.status === 'completed') {
        console.log('✅ Payment completed! Booking status = 5')
        localStorage.removeItem('activeCheckOutBookingId')
        clearInterval(pollInterval)
        setCheckOutFor(null)
        onStatusUpdated?.(bookingIdFromStorage)
      }
    } catch (err) {
      console.warn('⏱️ Polling error:', err?.message)
    }
  }, 3000)
  
  return () => clearInterval(pollInterval)
}, [checkOutFor?.id, onStatusUpdated])
```

**C. Add polling useEffect for check-in** (lines 47-75):
```javascript
// Poll for check-in payment success
React.useEffect(() => {
  if (!checkInFor?.id) return
  
  const pollInterval = setInterval(async () => {
    try {
      const bookingIdFromStorage = localStorage.getItem('activeCheckInBookingId')
      if (!bookingIdFromStorage) return
      
      const updatedBooking = await StaffAPI.getBookingById(bookingIdFromStorage)
      console.log('📊 Polling check-in booking status:', updatedBooking?.bookingStatus)
      
      // If payment completed and check-in done (status = 3 or higher), close modal
      if (updatedBooking?.bookingStatus === 3 || updatedBooking?.status === 3 || updatedBooking?.bookingStatus >= 3) {
        console.log('✅ Check-in payment completed! Booking status = 3+')
        localStorage.removeItem('activeCheckInBookingId')
        clearInterval(pollInterval)
        setCheckInFor(null)
        onStatusUpdated?.(bookingIdFromStorage)
      }
    } catch (err) {
      console.warn('⏱️ Polling error (check-in):', err?.message)
    }
  }, 3000)
  
  return () => clearInterval(pollInterval)
}, [checkInFor?.id, onStatusUpdated])
```

**D. Update checkout modal rendering** (lines ~90-110):
```javascript
{checkOutFor && (
  <div style={{
    display:'flex', 
    gap:24, 
    position:'fixed', 
    top:0, 
    left:0, 
    right:0, 
    bottom:0, 
    background:'rgba(0,0,0,0.6)', 
    zIndex:1000, 
    alignItems:'center', 
    justifyContent:'center', 
    padding:20,
    overflow:'auto'
  }}>
    {/* Left: Checkout Modal */}
    <div style={{flex:'0 0 auto', width:'720px', maxWidth:'45vw', maxHeight:'90vh', overflow:'auto', flexShrink:0}}>
      <CheckOutCard
        booking={checkOutFor}
        onClose={() => setCheckOutFor(null)}
      />
    </div>

    {/* Right: Incidents Modal */}
    <div style={{flex:'0 0 auto', width:'420px', maxWidth:'45vw', maxHeight:'90vh', overflow:'auto', flexShrink:0}}>
      <IncidentsModal 
        bookingId={checkOutFor?.id}
        onClose={() => setCheckOutFor(null)}
      />
    </div>
  </div>
)}
```

---

## 🔌 API CHANGES

### Endpoints Used:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/Bookings/Check-In-With-Contract` | Check-in with FormData |
| POST | `/Bookings/Check-Out-With-Payment` | Check-out with FormData |
| POST | `/Payment/Create` (paymentType=2) | Create checkout payment |
| GET | `/Incidents/GetByBooking/{id}` | Fetch incidents for booking |
| GET | `/Bookings/Get-By-{id}` | Get booking details |

### Payload Examples:

**Check-In**:
```json
{
  "bookingId": "uuid",
  "staffId": "userId",
  "checkInNotes": "Notes...",
  "checkInPhotoFile": <File>
}
```

**Check-Out**:
```json
{
  "bookingId": "uuid",
  "staffId": "userId",
  "actualReturnDateTime": "2025-11-10T15:00:00Z",
  "damageFee": 500000,
  "checkOutNotes": "Notes...",
  "checkOutPhotoUrl": ""
}
```

**Payment (Checkout)**:
```json
{
  "bookingId": "uuid",
  "paymentType": 2,
  "description": "Rental payment at check-out"
}
```

---

## ✨ KEY FEATURES

### 1. **Check-Out Form**
- Date picker with calendar UI (month navigation)
- Time picker dropdown (6:00-23:00)
- Notes textarea
- Damage fee input
- Auto-saves bookingId for tracking

### 2. **Payment Integration**
- Only show payment if `extraAmount > 0`
- Manual "Go to Payment" button (opens new tab)
- PaymentType = 2 for checkout
- No auto-redirect

### 3. **Incidents Display**
- Side-by-side with checkout
- Shows: title, description, severity, cost, timestamp
- Severity color-coded (red/orange/yellow)

### 4. **Real-time Tracking**
- localStorage keys: `activeCheckInBookingId`, `activeCheckOutBookingId`
- Polling every 3 seconds
- Auto-close modal on payment complete
- Refresh booking list

### 5. **User Experience**
- Datetime picker matches user SearchModal UI
- Only pay for additional fees (not total/deposit)
- Clear payment status messages
- Calendar handles past dates (disabled)

---

## 📦 DEPLOYMENT CHECKLIST

```
✅ Copy: src/staff/page/components/Booking/CheckOutCard.jsx (NEW)
✅ Copy: src/staff/page/components/Booking/IncidentsModal.jsx (NEW)
✅ Update: src/staff/services/staffApi.js (checkInWithContract, checkOutWithPayment, createPayment, getIncidentsByBooking)
✅ Update: src/staff/page/components/Booking/CheckInCard.jsx (userId resolution, localStorage tracking)
✅ Update: src/staff/page/components/Booking/BookingModal.jsx (replace payment buttons with Check Out)
✅ Update: src/staff/page/components/Booking/BookingSection.jsx (polling, side-by-side layout, import)
✅ Verify: All files pass error validation
✅ Test: Check-in form works
✅ Test: Check-out form with date/time picker
✅ Test: Payment redirect to Payos
✅ Test: Auto-close on payment complete
✅ Test: Incidents display
```

---

## 🚀 DEPLOYMENT STEPS

1. **Backup current files** from target project
2. **Copy new files** (CheckOutCard.jsx, IncidentsModal.jsx)
3. **Update staffApi.js** with new functions
4. **Update existing components** as specified
5. **Run error validation**: `npm run lint` or similar
6. **Test in browser**: 
   - Navigate to Staff page
   - Click booking with status "checked-in"
   - Click "Check Out" button
   - Fill form and submit
   - Verify incidents show side-by-side
   - Verify "Go to Payment" appears only if extraAmount > 0
   - Complete payment on Payos
   - Verify modal closes and list refreshes
7. **Deploy to production**

---

**Document Created**: November 10, 2025
**Status**: Ready for deployment
**All files tested and validated** ✅
