import React, { useState } from 'react'
import StaffAPI from '../../../../services/staffApi'
import './Incident.css'

export default function IncidentModal({ open, onClose, onCreated }){
  const [bookingId, setBookingId] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e){
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await staffApi.createIncident(bookingId, description, files)
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
          <label>
            Images (optional)
            <input type="file" multiple accept="image/*" onChange={e=>setFiles(Array.from(e.target.files))} />
          </label>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Create Incident'}</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
