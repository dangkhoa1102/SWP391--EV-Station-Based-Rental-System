import React, { useState, useEffect } from 'react'
import '../../styles/modals.css'
import adminApi from '../../../../services/adminApi'

export default function StationDetailsModal({ open, onClose, station, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [totalSlots, setTotalSlots] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (station) {
      setName(station.name || station.Name || '')
      setAddress(station.address || station.Address || '')
      setTotalSlots(station.totalSlots ?? station.TotalSlots ?? 0)
    }
  }, [station])

  if (!open) return null
  if (!station) return null

  const id = station.id || station.Id

  const save = async () => {
    setError('')
    setBusy(true)
    try {
      const payload = { name: name.trim(), address: address.trim(), totalSlots: Number(totalSlots) }
      const updated = await adminApi.updateStation(id, payload)
      onUpdated && onUpdated(updated || { ...station, ...payload })
      setEditing(false)
    } catch (e) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this station?')) return
    setBusy(true)
    try {
      await adminApi.deleteStation(id)
      onDeleted && onDeleted(id)
      onClose && onClose()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{maxWidth: '640px', width: '96%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{marginTop:0}}>{editing ? 'Edit Station' : 'Station Details'}</h3>
        {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>}

        {!editing ? (
          <div style={{display:'grid', gap:8}}>
            <div style={{fontWeight:600}}>{station.name || station.Name || `Station ${id}`}</div>
            <div style={{color:'#555'}}>{station.address || station.Address || ''}</div>
            <div style={{color:'#555'}}>Slots: {station.totalSlots ?? station.TotalSlots ?? '—'}</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:12}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
            <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Address" />
            <input type="number" value={totalSlots} onChange={e=>setTotalSlots(e.target.value)} placeholder="Total slots" min={0} />
          </div>
        )}

        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:12}}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
              <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button onClick={remove} style={{background:'#dc2626', color:'#fff'}}>Delete</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
