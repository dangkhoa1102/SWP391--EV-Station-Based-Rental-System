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
                      {(f.message || f.description || f.content || 'No message').slice(0, 300)}
                    </div>
                    <div style={{
                      fontSize:12,
                      color:'#999',
                      display:'flex',
                      gap:12,
                      alignItems:'center'
                    }}>
                      <span>👤 {f.userName || f.user?.fullName || f.userEmail || f.email || 'Anonymous'}</span>
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
                disabled={page <= 1} 
                onClick={() => load(Math.max(1, page-1), pageSize, search)}
                style={{
                  padding:'8px 16px',
                  backgroundColor:page <= 1 ? '#eee' : '#3498db',
                  color:page <= 1 ? '#999' : 'white',
                  border:'none',
                  borderRadius:4,
                  cursor:page <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight:600,
                  fontSize:13,
                  transition:'background-color 0.2s'
                }}
              >
                ← Previous
              </button>
              <div style={{fontSize:13, color:'#666', minWidth:60, textAlign:'center'}}>
                Page <strong>{page}</strong>
              </div>
              <button 
                onClick={() => load(page+1, pageSize, search)}
                style={{
                  padding:'8px 16px',
                  backgroundColor:'#3498db',
                  color:'white',
                  border:'none',
                  borderRadius:4,
                  cursor:'pointer',
                  fontWeight:600,
                  fontSize:13,
                  transition:'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor='#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor='#3498db'}
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
