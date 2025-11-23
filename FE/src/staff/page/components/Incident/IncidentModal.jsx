import React, { useState } from 'react'
import StaffAPI from '../../../../services/staffApi'
import './Incident.css'

export default function IncidentModal({ open, onClose, onCreated }){
  const [bookingId, setBookingId] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e){
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await StaffAPI.createIncident(bookingId, description, images)
      console.log('Incident created:', res)
      onCreated && onCreated(res)
      onClose && onClose()
    } catch (err) {
      console.error('Create incident failed:', err)
      setError(err?.message || 'Failed to create incident')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // avoid duplicates by name+size
    const existing = new Set(images.map(f => `${f.name}_${f.size}`))
    const valid = files.filter(f => {
      const key = `${f.name}_${f.size}`
      if (existing.has(key)) return false
      existing.add(key)
      return true
    })
    if (!valid.length) return

    setImages(prev => [...prev, ...valid])
    const newPreviews = valid.map(f => URL.createObjectURL(f))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    try { URL.revokeObjectURL(imagePreviews[index]) } catch {}
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content incident-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Report Incident</h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} className="incident-form">
          <label>
            Booking ID
            <input value={bookingId} onChange={e=>setBookingId(e.target.value)} placeholder="booking GUID" required />
          </label>
          <label>
            Description
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the incident" required />
          </label>
          <label style={{display:'block', marginBottom:8}}>
            Images (optional)
            <input type="file" multiple accept="image/*" onChange={handleImageChange} />
          </label>

          {imagePreviews.length > 0 && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:12, marginTop:8}}>
              {imagePreviews.map((p, idx) => (
                <div key={idx} style={{position:'relative'}}>
                  <img src={p} alt={`preview-${idx}`} style={{width:'100%', height:100, objectFit:'cover', borderRadius:6}} />
                  <button type="button" onClick={() => removeImage(idx)} style={{position:'absolute', top:6, right:6, background:'#dc2626', color:'#fff', border:'none', borderRadius:'50%', width:24, height:24, cursor:'pointer'}}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Create Incident'}</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
