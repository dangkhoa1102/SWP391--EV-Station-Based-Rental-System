import React, { useEffect, useState } from 'react'
import { fetchRevenueByStationReport, getRevenueForStation } from '../../../../services/revenue'
import adminApi from '../../../../services/adminApi'
import { getStationRevenue } from '../../../../services/paymentApi'

export default function StationRevenueSection() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stationRevenues, setStationRevenues] = useState([])
  const [stations, setStations] = useState([])
  const [search, setSearch] = useState('')
  const [nameOrder, setNameOrder] = useState('asc') // 'asc' or 'desc'
  const [revenueOrder, setRevenueOrder] = useState('none') // 'none' | 'asc' | 'desc'

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const stationList = await adminApi.getAllStations(1, 200).catch(() => [])

      // Fetch per-station revenue using Payment API: /Payment/station/{stationId}/revenue
      const chunkSize = 10
      const results = []
      for (let i = 0; i < stationList.length; i += chunkSize) {
        const chunk = stationList.slice(i, i + chunkSize)
        const promises = chunk.map(async (s) => {
          const sid = s.id || s.Id || s.stationId || s.StationId
          try {
            const res = await getStationRevenue(sid, { token })
            const body = res?.data || res || {}
            // normalize common fields (best-effort)
            const total = body.totalRevenue ?? body.TotalRevenue ?? body.total ?? body.Total ?? body.revenue ?? 0
            const month = body.revenue ?? body.thisMonth ?? body.ThisMonth ?? body.month ?? body.Month ?? body.revenueThisMonth ?? 0
            return {
              StationId: sid || null,
              StationName: s.name || s.Name || s.stationName || s.station || `Station ${sid}`,
              TotalRevenue: total,
              ThisMonth: month,
              raw: body
            }
          } catch (err) {
            return {
              StationId: sid || null,
              StationName: s.name || s.Name || s.stationName || s.station || `Station ${sid}`,
              TotalRevenue: 0,
              ThisMonth: 0,
              raw: null
            }
          }
        })
        const resChunk = await Promise.all(promises)
        results.push(...resChunk)
      }

      // Sort alphabetically by StationName
      results.sort((a, b) => {
        const A = String(a.StationName || '').toLowerCase()
        const B = String(b.StationName || '').toLowerCase()
        if (A < B) return -1
        if (A > B) return 1
        return 0
      })

      setStationRevenues(results)
      setStations(stationList || [])
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => load()

  const filtered = stationRevenues.filter(s => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const name = String(s.StationName || s.stationName || s.Station || '').toLowerCase()
    const id = String(s.StationId || s.stationId || '').toLowerCase()
    return name.includes(q) || id.includes(q)
  })

  // Apply sorting
  const sorted = (() => {
    const arr = [...filtered]
    // name order first
    arr.sort((a, b) => {
      const A = String(a.StationName || '').toLowerCase()
      const B = String(b.StationName || '').toLowerCase()
      if (A < B) return nameOrder === 'asc' ? -1 : 1
      if (A > B) return nameOrder === 'asc' ? 1 : -1
      return 0
    })
    if (revenueOrder && revenueOrder !== 'none') {
      arr.sort((a, b) => {
        const va = Number(a.TotalRevenue ?? a.totalRevenue ?? a.Total ?? 0)
        const vb = Number(b.TotalRevenue ?? b.totalRevenue ?? b.Total ?? 0)
        return revenueOrder === 'asc' ? va - vb : vb - va
      })
    }
    return arr
  })()

  const cardStyle = {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    width: '100%'
  }

  if (loading) return <div style={{padding:12}}>Loading station revenue…</div>
  if (error) return <div style={{padding:12, color:'#b00020'}}>Error: {error}</div>

  return (
    <div style={{marginTop:16}}>
      <h3 style={{margin:0, marginBottom:8}}>Stations Revenue</h3>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <input
          placeholder="Search station name or id"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{padding:8, borderRadius:6, border:'1px solid #ddd', flex:1}}
        />
        
        <select value={nameOrder} onChange={e=>setNameOrder(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ddd'}}>
          <option value="asc">Name: A → Z</option>
          <option value="desc">Name: Z → A</option>
        </select>
        <select value={revenueOrder} onChange={e=>setRevenueOrder(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ddd'}}>
          <option value="none">Revenue: (none)</option>
          <option value="desc">Revenue: High → Low</option>
          <option value="asc">Revenue: Low → High</option>
        </select>
        <button onClick={handleRefresh} style={{padding:'8px 12px', borderRadius:6}}>Refresh</button>
      </div>

      <div style={{display:'grid', gap:12}}>
        {sorted.length === 0 && <div style={{color:'#666'}}>No station revenue data available.</div>}
        {sorted.map((s, idx) => (
          <div key={s.StationId || s.stationId || idx} style={cardStyle}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:16, fontWeight:700}}>{s.StationName || s.stationName || s.Station || 'Station'}</div>
                <div style={{color:'#666', fontSize:12}}>{s.StationId || s.stationId ? String(s.StationId || s.stationId) : ''}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:'#666', fontSize:12}}>This Month</div>
                <div style={{fontSize:20, fontWeight:700}}>{formatCurrency(s.ThisMonth ?? s.thisMonth ?? s.Month ?? s.month ?? 0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCurrency(v) {
  if (v == null) return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
}
