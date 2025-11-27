import React, { useState, useEffect, useRef } from 'react'
import adminApi from '../../../../services/adminApi'
import FeedbackDetailsModal from './FeedbackDetailsModal'

export default function FeedbackSection({ initialSearch = '', initialPage = 1, pageSize = 2 }) {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const reqRef = useRef(0)
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const load = async (p = page, ps = pageSize, s = search) => {
    // Increment request id and capture locally so we can ignore stale responses
    const reqId = ++reqRef.current
    setLoading(true)
    try {
      // Only send `page` to the API. Some backends interpret `pageSize` as the page
      // number, and our service layer translates `page` -> `pageSize` for compatibility.
      const res = await adminApi.getFeedbacks({ page: p, search: s })

      // Normalize response shapes: some backends return PaginationDto directly,
      // others wrap it under `data`. We try to support both.
      let payload = res
      if (res && res.data && (Array.isArray(res.data.items) || typeof res.data.hasNext !== 'undefined' || typeof res.data.totalCount !== 'undefined')) {
        payload = res.data
      }

      const items = payload?.items || payload?.data || []
      // Determine pagination flags with sensible fallbacks
      const computedHasPrevious = typeof payload?.hasPrevious === 'boolean' ? payload.hasPrevious : (p > 1)
      let computedHasNext
      if (typeof payload?.hasNext === 'boolean') {
        computedHasNext = payload.hasNext
      } else if (typeof payload?.totalCount === 'number') {
        // If totalCount is provided, compute from page and pageSize
        computedHasNext = (p * ps) < Number(payload.totalCount)
      } else {
        // Fallback: if items length equals pageSize, assume there might be a next page
        computedHasNext = Array.isArray(items) ? items.length >= ps : false
      }

      // Ignore this response if a newer request was started
      if (reqId !== reqRef.current) return

      setFeedbacks(items)
      // Prefer server-provided page when available to keep client in sync
      const serverPage = typeof payload?.currentPage === 'number' ? payload.currentPage : p
      setPage(serverPage)
      setHasPrevious(Boolean(payload?.hasPrevious ?? computedHasPrevious))
      setHasNext(Boolean(payload?.hasNext ?? computedHasNext))
    } catch (e) {
      console.error('Failed to load feedbacks', e)
      setFeedbacks([])
      setHasPrevious(false)
      setHasNext(false)
    } finally {
      // Only clear loading for the latest request
      if (reqId === reqRef.current) setLoading(false)
    }
  }

  useEffect(() => { load(1, pageSize, search) }, [])

  return (
    <div style={{width:'100%'}}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}>
        <h2 style={{fontWeight:700, fontSize:24, margin:0}}>Feedbacks</h2>
        <div style={{flex:1}} />
        <input 
          placeholder="🔍 Search feedbacks..." 
          value={search} 
          onChange={e => {
            setSearch(e.target.value)
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') load(1, pageSize, e.target.value)
          }}
          style={{
            padding:'10px 14px',
            border:'1px solid #ddd',
            borderRadius:6,
            minWidth:280,
            fontSize:14
          }} 
        />
        <button 
          onClick={() => load(1, pageSize, search)} 
          style={{
            padding:'10px 16px',
            backgroundColor:'#3498db',
            color:'white',
            border:'none',
            borderRadius:6,
            fontWeight:600,
            cursor:'pointer',
            fontSize:14,
            transition:'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor='#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor='#3498db'}
        >
          Search
        </button>
      </div>

      {loading ? (
        <div style={{padding:'40px', textAlign:'center', color:'#999'}}>
          ⏳ Loading feedbacks…
        </div>
      ) : (
        <div>
          {(!feedbacks || feedbacks.length === 0) && (
            <div style={{
              padding:'40px 20px',
              textAlign:'center',
              backgroundColor:'#f8f9fa',
              borderRadius:8,
              color:'#666'
            }}>
              <p style={{fontSize:16, margin:0}}>No feedbacks found.</p>
            </div>
          )}
          
          {(feedbacks || []).length > 0 && (
            <div style={{display:'grid', gap:12}}>
              {(feedbacks || []).map((f, idx) => (
                <div 
                  key={f.id || f.Id || `feedback-${idx}`} 
                  style={{
                    padding:16,
                    border:'1px solid #e0e0e0',
                    borderRadius:8,
                    backgroundColor:'#fff',
                    boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                    transition:'all 0.2s',
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'flex-start',
                    cursor:'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{
                      fontWeight:700,
                      fontSize:15,
                      marginBottom:6,
                      color:'#333'
                    }}>
                      {f.subject || f.title || 'Feedback'}
                    </div>
                    <div style={{
                      color:'#666',
                      fontSize:14,
                      marginBottom:10,
                      lineHeight:1.5,
                      display:'-webkit-box',
                      WebkitLineClamp:2,
                      WebkitBoxOrient:'vertical',
                      overflow:'hidden'
                    }}>
                      {(f.message || f.description || f.content || '').slice(0, 300)}
                    </div>
                    <div style={{
                      fontSize:12,
                      color:'#999',
                      display:'flex',
                      gap:12,
                      alignItems:'center'
                    }}>
                      <span>👤 {f.userName || f.user?.fullName || f.userEmail || f.email || ''}</span>
                      <span>📅 {new Date(f.createdAt || f.createdDate || f.created || Date.now()).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setSelected(f)
                      setDetailsOpen(true) 
                    }}
                    style={{
                      marginLeft:16,
                      padding:'8px 14px',
                      backgroundColor:'#2ecc71',
                      color:'white',
                      border:'none',
                      borderRadius:4,
                      fontWeight:600,
                      cursor:'pointer',
                      fontSize:13,
                      whiteSpace:'nowrap',
                      transition:'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor='#27ae60'}
                    onMouseOut={(e) => e.target.style.backgroundColor='#2ecc71'}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {(feedbacks || []).length > 0 && (
            <div style={{
              display:'flex',
              justifyContent:'center',
              alignItems:'center',
              gap:12,
              marginTop:32,
              paddingTop:20,
              paddingBottom:20,
              borderTop:'1px solid #e0e0e0',
              position:'sticky',
              bottom:0,
              backgroundColor:'white',
              zIndex:10
            }}>
              <button 
                disabled={!hasPrevious}
                onClick={() => { if (hasPrevious) load(Math.max(1, page-1), pageSize, search) }}
                style={{
                  padding:'8px 16px',
                  backgroundColor: hasPrevious ? '#3498db' : '#eee',
                  color: hasPrevious ? 'white' : '#999',
                  border:'none',
                  borderRadius:4,
                  cursor: hasPrevious ? 'pointer' : 'not-allowed',
                  fontWeight:600,
                  fontSize:13,
                  transition:'background-color 0.2s',
                  opacity: hasPrevious ? 1 : 0.85
                }}
              >
                ← Previous
              </button>
              <div style={{fontSize:13, color:'#666', minWidth:60, textAlign:'center'}}>
                Page <strong>{page}</strong>
              </div>
              <button 
                disabled={!hasNext}
                onClick={() => { if (hasNext) load(page+1, pageSize, search) }}
                style={{
                  padding:'8px 16px',
                  backgroundColor: hasNext ? '#3498db' : '#eee',
                  color: hasNext ? 'white' : '#999',
                  border:'none',
                  borderRadius:4,
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                  fontWeight:600,
                  fontSize:13,
                  transition:'background-color 0.2s',
                  opacity: hasNext ? 1 : 0.85
                }}
                onMouseOver={(e) => { if (hasNext) e.target.style.backgroundColor = '#2980b9'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = hasNext ? '#3498db' : '#eee'; }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      <FeedbackDetailsModal open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelected(null) }} feedback={selected} />
    </div>
  )
}
