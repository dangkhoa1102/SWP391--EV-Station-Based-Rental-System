import React, { useState, useEffect } from 'react'
import adminApi from '../../../../services/adminApi'
import FeedbackDetailsModal from './FeedbackDetailsModal'

export default function FeedbackSection({ initialSearch = '', initialPage = 1, pageSize = 10 }) {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [selected, setSelected] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const load = async (p = page, ps = pageSize, s = search) => {
    setLoading(true)
    try {
      const res = await adminApi.getFeedbacks({ page: p, pageSize: ps, search: s })
      const items = res?.items || res?.data || []
      setFeedbacks(items)
      setPage(p)
    } catch (e) {
      console.error('Failed to load feedbacks', e)
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, pageSize, search) }, [])

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
        <input placeholder="Search feedbacks..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:'8px', border:'1px solid #ddd', borderRadius:6, minWidth:240}} />
        <button onClick={() => load(1, pageSize, search)} style={{padding:'8px 12px'}}>Search</button>
      </div>

      {loading ? (
        <div style={{padding:12}}>Loading feedbacks…</div>
      ) : (
        <div style={{display:'grid', gap:8}}>
          {(!feedbacks || feedbacks.length === 0) && <div style={{padding:'10px 12px', color:'#555'}}>No feedbacks found.</div>}
          {(feedbacks || []).map(f => (
            <div key={f.id || f.Id} style={{padding:12, border:'1px solid #eee', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <div style={{fontWeight:600}}>{f.subject || f.title || 'Feedback'}</div>
                <div style={{color:'#555', marginTop:6, maxWidth:800}}>{(f.message || f.description || f.content || '').slice(0, 400)}</div>
                <div style={{fontSize:12, color:'#777', marginTop:8}}>From: {f.userName || f.user?.fullName || f.userEmail || f.email || 'Anonymous'} · {new Date(f.createdAt || f.createdDate || f.created || Date.now()).toLocaleString()}</div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                <button onClick={() => { setSelected(f); setDetailsOpen(true) }}>View</button>
              </div>
            </div>
          ))}

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8}}>
            <button disabled={page <= 1} onClick={() => load(Math.max(1, page-1), pageSize, search)}>Prev</button>
            <div style={{fontSize:13, color:'#666'}}>Page {page}</div>
            <button onClick={() => load(page+1, pageSize, search)}>Next</button>
          </div>
        </div>
      )}

      <FeedbackDetailsModal open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelected(null) }} feedback={selected} />
    </div>
  )
}
