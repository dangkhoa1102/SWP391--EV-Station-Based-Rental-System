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
