import React, { useState } from 'react'
import StaffAPI from '../../../services/staffApi'
import { PLACEHOLDER } from '../../../../utils/placeholder'
import { performAutoCheckIn, getCheckInInfoAutomatic } from '../../../services/staffCheckInAutomatic'

export default function CheckInCard({ booking, onClose, onCheckedIn }){
  const [checkInNotes, setCheckInNotes] = useState('')
  const [checkInPhoto, setCheckInPhoto] = useState(null)
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
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

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }
    
    setCheckInPhoto(file)
    setError('')
    
    // Upload image immediately
    setUploadingImage(true)
    try {
      const url = await StaffAPI.uploadImage(file)
      setCheckInPhotoUrl(url)
      setError('')
    } catch (err) {
      setError('Failed to upload image: ' + (err?.message || 'Unknown error'))
      setCheckInPhoto(null)
      setCheckInPhotoUrl('')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    if (!booking?.id) return
    setSubmitting(true)
    setError('')
    try {
      console.log('🔍 Starting auto check-in for booking:', booking.id)
      
      // First, validate all check-in requirements
      const checkInInfo = await getCheckInInfoAutomatic(booking.id)
      
      console.log('📋 Check-in validation:', {
        bookingId: checkInInfo.bookingId,
        customer: checkInInfo.customerName,
        staffId: checkInInfo.staffId,
        validation: checkInInfo.validation,
        readyForCheckIn: checkInInfo.readyForCheckIn
      })
      
      if (!checkInInfo.readyForCheckIn) {
        const errors = []
        if (!checkInInfo.validation.bookingStatusValid) 
          errors.push('❌ Booking status must be "DepositPaid"')
        if (!checkInInfo.validation.contractConfirmed) 
          errors.push('❌ Contract must be confirmed')
        if (!checkInInfo.validation.contractSigned) 
          errors.push('❌ Contract must be signed')
        if (!checkInInfo.validation.depositPaid) 
          errors.push('❌ Deposit payment must be completed')
        
        throw new Error(`Cannot check in:\n${errors.join('\n')}`)
      }
      
      // Perform the auto check-in
      const result = await performAutoCheckIn(
        booking.id,
        (checkInNotes || '').trim() || 'Car checked in successfully',
        checkInPhotoUrl || null
      )
      
      console.log('✅ Check-in successful!', result)
      if (typeof onCheckedIn === 'function') onCheckedIn(booking.id, result)
      onClose?.()
    } catch (e) {
      let msg = e?.message || 'Failed to complete check-in'
      
      setError(msg)
      console.error('❌ Check-in failed:', { 
        error: e?.message, 
        bookingId: booking.id
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{width:'min(720px,95vw)', maxHeight:'90vh', overflow:'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{marginBottom:12}}>Check In - {booking.customer || booking.fullName || 'Customer'}</h3>
        
        {serverTime && (
          <div style={{fontSize:12, color:'#666', marginBottom:8}}>
            Server time: {serverTime.toLocaleString()}
          </div>
        )}
        {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>}
        <div style={{display:'flex', gap:16, alignItems:'center', marginBottom:12}}>
          <img src={booking?.img || booking?.carImageUrl || PLACEHOLDER.small('Car')} alt="Car" style={{width:160, height:100, objectFit:'cover', borderRadius:8}} />
          <div>
            <div style={{fontSize:18, fontWeight:700}}>{booking?.title || 'Vehicle'}</div>
            <div style={{color:'#555'}}>Booking: {booking?.id}</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:12}}>
          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <span>Check-in Notes <span style={{color:'#999', fontSize:'0.9em'}}>(Optional)</span></span>
            <textarea 
              rows={5} 
              value={checkInNotes} 
              onChange={e=>setCheckInNotes(e.target.value)} 
              placeholder="Notes about the vehicle condition, accessories, battery, etc." 
            />
          </label>
          
          <label style={{display:'flex', flexDirection:'column', gap:6}}>
            <span>Check-in Photo <span style={{color:'#999', fontSize:'0.9em'}}>(Optional)</span></span>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: uploadingImage ? 'not-allowed' : 'pointer'
              }}
            />
            {uploadingImage && (
              <div style={{color:'#1976d2', fontSize:'0.9em'}}>
                <i className="fas fa-spinner fa-spin"></i> Uploading image...
              </div>
            )}
            {checkInPhotoUrl && (
              <div style={{marginTop:8}}>
                <img 
                  src={checkInPhotoUrl} 
                  alt="Check-in preview" 
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
                <div style={{fontSize:'0.85em', color:'#666', marginTop:4}}>✓ Image uploaded</div>
              </div>
            )}
          </label>

          <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
            <button type="button" onClick={onClose} style={{background:'transparent', color:'#333', border:'1px solid #aaa', borderRadius:8, padding:'8px 14px'}}>Cancel</button>
            <button 
              type="submit" 
              disabled={submitting || uploadingImage} 
              style={{
                background: (submitting || uploadingImage) ? '#ccc' : '#2e7d32', 
                color:'#fff', 
                border:'none', 
                borderRadius:8, 
                padding:'8px 14px',
                cursor: (submitting || uploadingImage) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Saving…' : uploadingImage ? 'Uploading…' : 'Confirm Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
