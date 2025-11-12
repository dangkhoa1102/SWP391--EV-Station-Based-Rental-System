import React, { useState } from 'react'
import AdminAPI from '../../../../services/adminApi'

export default function CheckInCard({ booking, onClose, onCheckedIn }){
  const [checkInNotes, setCheckInNotes] = useState('')
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState('')
  const [adminSignature, setAdminSignature] = useState('')
  const [customerSignature, setCustomerSignature] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [serverTime, setServerTime] = useState(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const st = await adminApi.getServerTime()
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

      // Resolve Admin/Staff entity Id (not just userId)
      let adminId = ''
      try {
        adminId = await adminApi.resolveStaffId()
      } catch (ridErr) {
        // Fallback: try userId if staff mapping is not available
        try { adminId = localStorage.getItem('userId') || '' } catch {}
        if (!adminId) throw ridErr
      }

      // Build payload with required fields
      const payload = {
        bookingId: booking.id,
        adminId: adminId,
        adminSignature: adminSignature.trim() || 'Admin',
        customerSignature: customerSignature.trim() || 'Customer',
      }
      const notes = (checkInNotes || '').trim()
      if (notes) payload.checkInNotes = notes
      const photo = (checkInPhotoUrl || '').trim()
      if (photo) {
        try {
          // Simple URL validation to avoid backend rejecting invalid URLs
          const u = new URL(photo)
          if (u.protocol === 'http:' || u.protocol === 'https:') {
            payload.checkInPhotoUrl = photo
          }
        } catch {}
      }
      await adminApi.checkInWithContract(payload)
      if (typeof onCheckedIn === 'function') onCheckedIn(booking.id, payload)
      onClose?.()
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

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{width:'min(720px,95vw)', maxHeight:'90vh', overflow:'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
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
            <span>Check-in Photo URL</span>
            <input type="url" value={checkInPhotoUrl} onChange={e=>setCheckInPhotoUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <span>Admin/Staff Signature <span style={{color:'red'}}>*</span></span>
            <input 
              type="text" 
              value={adminSignature} 
              onChange={e=>setAdminSignature(e.target.value)} 
              placeholder="Type admin/staff name or paste signature URL"
              required
            />
          </label>
          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <span>Customer Signature <span style={{color:'red'}}>*</span></span>
            <input 
              type="text" 
              value={customerSignature} 
              onChange={e=>setCustomerSignature(e.target.value)} 
              placeholder="Type customer name or paste signature URL"
              required
            />
          </label>
          <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
            <button type="button" onClick={onClose} style={{background:'transparent', color:'#333', border:'1px solid #aaa', borderRadius:8, padding:'8px 14px'}}>Cancel</button>
            <button 
              type="submit" 
              disabled={submitting || !adminSignature.trim() || !customerSignature.trim()} 
              style={{
                background: (submitting || !adminSignature.trim() || !customerSignature.trim()) ? '#ccc' : '#2e7d32', 
                color:'#fff', 
                border:'none', 
                borderRadius:8, 
                padding:'8px 14px',
                cursor: (submitting || !adminSignature.trim() || !customerSignature.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Saving…' : 'Confirm Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
