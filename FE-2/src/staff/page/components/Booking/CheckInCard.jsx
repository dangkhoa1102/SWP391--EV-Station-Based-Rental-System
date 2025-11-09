import React, { useState } from 'react'
import StaffAPI from '../../../services/staffApi'

export default function CheckInCard({ booking, onClose, onCheckedIn }){
  const [checkInNotes, setCheckInNotes] = useState('')
  const [checkInPhoto, setCheckInPhoto] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [serverTime, setServerTime] = useState(null)

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

      // Resolve Staff entity Id (not just userId)
      let staffId = ''
      try {
        staffId = await StaffAPI.resolveStaffId()
      } catch (ridErr) {
        // Fallback: try userId if staff mapping is not available
        try { staffId = localStorage.getItem('userId') || '' } catch {}
        if (!staffId) throw ridErr
      }

      // Build payload for multipart/form-data
      const payload = {
        bookingId: booking.id,
        staffId,
      }
      const notes = (checkInNotes || '').trim()
      if (notes) payload.checkInNotes = notes
      if (checkInPhoto) {
        payload.checkInPhoto = checkInPhoto
      }
      await StaffAPI.checkInWithContract(payload)
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
            <button type="submit" disabled={submitting} style={{background:'#2e7d32', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px'}}>
              {submitting ? 'Saving…' : 'Confirm Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
