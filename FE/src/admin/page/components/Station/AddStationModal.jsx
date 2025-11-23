import React, { useState } from 'react'
import '../../styles/modals.css'

export default function AddStationModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [totalSlots, setTotalSlots] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !address.trim()) {
      setError('Name and address are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = { name: name.trim(), address: address.trim(), totalSlots: Number(totalSlots) }
      await onSubmit(payload)
      setName('')
      setAddress('')
      setTotalSlots(0)
      onClose && onClose()
    } catch (e) {
      setError(e?.message || 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{maxWidth: '520px', width: '92%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{marginTop:0}}>Create Station</h3>
        {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>}
        <div style={{display:'grid', gap:12}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Station name" />
          <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" />
          <input type="number" value={totalSlots} onChange={e=>setTotalSlots(e.target.value)} placeholder="Total slots" min={0} />
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:12}}>
          <button onClick={onClose} style={{padding:'10px 20px'}}>Cancel</button>
          <button onClick={handleCreate} disabled={submitting} style={{padding:'10px 20px'}}>{submitting ? 'Creating…' : 'Create Station'}</button>
        </div>
      </div>
    </div>
  )
}
