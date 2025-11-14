import React, { useState, useEffect } from 'react'
import StaffAPI from '../../../../services/staffApi'

export default function IncidentsModal({ bookingId, onClose, refreshKey, initialIncidents = [] }) {
  const [incidents, setIncidents] = useState([])
  // accept initial incidents from parent (e.g., right after checkout)
  const [initialUsed, setInitialUsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (!bookingId) return

    let mounted = true

    const fetchWithRetries = async () => {
      setLoading(true)
      setError('')
      try {
        // If parent provided initial incidents and we haven't applied them yet, use them first
        if (!initialUsed && Array.isArray(initialIncidents) && initialIncidents.length > 0) {
          setIncidents(initialIncidents)
          setInitialUsed(true)
          // still continue to poll/verify backend in case more incidents exist
        }
        // Try immediately, then a couple delayed retries in case backend creates incidents asynchronously
        const delays = [0, 1000, 3000]
        for (let i = 0; i < delays.length && mounted; i++) {
          if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]))
          try {
            const data = await StaffAPI.getIncidentsByBooking(bookingId, page, pageSize)
            const list = Array.isArray(data) ? data : []
            console.log(`✅ Incidents loaded (attempt ${i + 1}):`, list)
            if (list.length > 0) {
              if (!mounted) return
              setIncidents(list)
              return
            }
            // set empty on last attempt
            if (i === delays.length - 1) {
              if (!mounted) return
              setIncidents([])
            }
          } catch (innerErr) {
            console.warn('⚠️ Incident fetch attempt failed:', innerErr?.message || innerErr)
            // continue retries
          }
        }
      } catch (err) {
        console.error('❌ Failed to load incidents:', err)
        if (mounted) setError(err?.message || 'Failed to load incidents')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchWithRetries()

    return () => { mounted = false }
  // include refreshKey so parent can trigger a reload after checkout
  }, [bookingId, page, refreshKey])

  const getSeverityColor = (severity) => {
    const s = String(severity || '').toLowerCase()
    if (s.includes('resolved') || s.includes('low')) return '#2e7d32'
    if (s.includes('medium')) return '#f57c00'
    if (s.includes('high') || s.includes('open') || s.includes('new')) return '#d32f2f'
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
          {incidents.map((incident, idx) => {
            const id = incident.id || incident._id || ''
            const desc = incident.description || incident.title || ''
            const short = desc && desc.length > 80 ? desc.slice(0,80) + '…' : desc
            const statusLabel = incident.status || incident.severity || 'N/A'
            const reported = incident.reportedAt || incident.reportedDate || incident.timestamp || incident.createdAt || null
            const resolved = incident.resolvedAt || incident.resolvedDate || null
            const cost = incident.costIncurred ?? incident.estimatedCost ?? null
            const staff = incident.staffName || incident.staff || incident.reportedBy || null
            const resolver = incident.resolverName || incident.resolvedBy || null
            const images = Array.isArray(incident.images) ? incident.images : []

            return (
              <div key={id || idx} style={{border:'1px solid #eee', padding:12, borderRadius:6, display:'flex', gap:12}}>
                <div style={{flex:'0 0 84px'}}>
                  {images.length > 0 ? (
                    <img src={images[0]} alt="incident" style={{width:84, height:64, objectFit:'cover', borderRadius:6}} />
                  ) : (
                    <div style={{width:84, height:64, background:'#fafafa', border:'1px dashed #eee', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb'}}>No image</div>
                  )}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
                    <div>
                      <h4 style={{margin:'0 0 6px', fontSize:14, fontWeight:700}}>{short || `Incident ${id?.slice?.(0,8) || (idx+1)}`}</h4>
                      <div style={{fontSize:12, color:'#666'}}>ID: {id || 'N/A'}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{background:getSeverityColor(statusLabel), color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:700}}>
                        {statusLabel}
                      </div>
                    </div>
                  </div>

                  <p style={{margin:'0 0 8px', fontSize:13, color:'#555', lineHeight:1.4}}>{desc || 'No description'}</p>

                  <div style={{display:'flex', gap:12, flexWrap:'wrap', fontSize:12, color:'#666'}}>
                    <div>Est. Cost: <strong style={{color:'#d32f2f'}}>{cost !== null ? `${Number(cost).toLocaleString()} VND` : 'N/A'}</strong></div>
                    <div>Reported: <strong>{reported ? new Date(reported).toLocaleString() : 'N/A'}</strong></div>
                    <div>Resolved: <strong>{resolved ? new Date(resolved).toLocaleString() : 'N/A'}</strong></div>
                    <div>Staff: <strong>{staff || 'N/A'}</strong></div>
                    {resolver && <div>Resolver: <strong>{resolver}</strong></div>}
                  </div>
                </div>
              </div>
            )
          })}
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
