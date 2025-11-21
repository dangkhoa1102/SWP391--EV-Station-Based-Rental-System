import React, { useState, useEffect } from 'react'
import '../../styles/modals.css'
import userApi from '../../../../services/userApi'
import carApi from '../../../../services/carApi'

export default function FeedbackDetailsModal({ open, onClose, feedback }) {
  if (!open) return null
  if (!feedback) return null

  const [displayName, setDisplayName] = useState(null)
  const [carLabel, setCarLabel] = useState(null)

  const id = feedback.id || feedback.Id
  const subject = feedback.subject || feedback.title || 'Feedback'
  const message = feedback.message || feedback.description || feedback.content || ''
  const rating = feedback.rating ?? feedback.rate ?? null
  const comment = feedback.comment ?? ''
  const from = displayName || feedback.userName || feedback.user?.fullName || feedback.userEmail || feedback.email || 'Anonymous'
  const date = new Date(feedback.createdAt || feedback.createdDate || feedback.created || Date.now()).toLocaleString()

  useEffect(() => {
    let mounted = true
    async function loadExtras() {
      // Fetch user name if we only have an id and no display name
      try {
        if (feedback.userId && !feedback.userName) {
          const u = await userApi.getUserById(feedback.userId)
          if (mounted && u) {
            const name = u.fullName || u.name || u.userName || u.displayName || u.email || null
            if (name) setDisplayName(name)
          }
        }
      } catch (e) {
        // ignore fetch errors
      }

      // Fetch car details for brand/model
      try {
        if (feedback.carId) {
          const c = await carApi.getCarById(feedback.carId)
          if (mounted && c) {
            const brand = c.brand || c.Brand || c.make || c.manufacturer || null
            const model = c.model || c.Model || c.name || null
            const label = [brand, model].filter(Boolean).join(' ').trim() || null
            if (label) setCarLabel(label)
          }
        }
      } catch (e) {
        // ignore fetch errors
      }
    }

    loadExtras()
    return () => { mounted = false }
  }, [feedback])
  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{maxWidth: '720px', width: '96%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{marginTop:0}}>{subject}</h3>
        <div style={{color:'#555', marginBottom:12}}>{message}</div>
        {rating != null && (
          <div style={{fontSize:14, color:'#333', marginBottom:8}}>Rating: {rating} / 5</div>
        )}
        {comment && (
          <div style={{color:'#444', marginBottom:8}}><strong>Comment:</strong> {comment}</div>
        )}
        {carLabel && (
          <div style={{fontSize:13, color:'#555', marginTop:6}}>Car: {carLabel}</div>
        )}
        <div style={{fontSize:12, color:'#777'}}>From: {from} · {date}</div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:12}}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
