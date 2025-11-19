import React, { useEffect, useState } from 'react'
import { fetchRevenueByStationReport, getRevenueForStation } from '../../../../services/revenue'
import adminApi from '../../../../services/adminApi'

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
      const [groups, stationList] = await Promise.all([
        fetchRevenueByStationReport(token).catch(() => []),
        adminApi.getAllStations(1, 200).catch(() => [])
      ])

      // Normalize groups if possible
      let g = groups || []

      // If aggregated groups empty, fallback to per-station queries
      if ((!g || g.length === 0) && Array.isArray(stationList) && stationList.length > 0) {
        try {
          const chunkSize = 10
          const perStationResults = []
          for (let i = 0; i < stationList.length; i += chunkSize) {
            const chunk = stationList.slice(i, i + chunkSize)
            const promises = chunk.map(s => {
              const sid = s.id || s.Id || s.stationId || s.StationId
              return getRevenueForStation(token, sid).then(arr => ({ station: s, groups: arr })).catch(() => ({ station: s, groups: [] }))
            })
            const resChunk = await Promise.all(promises)
            perStationResults.push(...resChunk)
          }
          const flattened = perStationResults.map(r => {
            const s = r.station || {}
            const first = Array.isArray(r.groups) && r.groups.length > 0 ? r.groups[0] : null
            const total = first ? (first.TotalRevenue ?? first.totalRevenue ?? first.Total ?? 0) : 0
            const month = first ? (first.ThisMonth ?? first.thisMonth ?? first.Month ?? 0) : 0
            return {
              StationId: s.id || s.Id || s.stationId || s.StationId || null,
              StationName: s.name || s.Name || s.stationName || s.station || null,
              TotalRevenue: total,
              ThisMonth: month
            }
          })
          g = flattened
        } catch (e) {
          console.warn('Per-station fallback failed', e)
        }
      }

      // Merge station list and groups so every station appears (missing revenue = 0)
      const groupsMap = new Map()
      ;(g || []).forEach(item => {
        const id = String(item.StationId || item.stationId || item.Station || '').toLowerCase()
        groupsMap.set(id, item)
      })

      const merged = (stationList || []).map(s => {
        const idRaw = s.id || s.Id || s.stationId || s.StationId || ''
        const id = String(idRaw).toLowerCase()
        const grp = groupsMap.get(id)
        const total = grp ? (grp.TotalRevenue ?? grp.totalRevenue ?? grp.Total ?? 0) : 0
        const month = grp ? (grp.ThisMonth ?? grp.thisMonth ?? grp.Month ?? 0) : 0
        return {
          StationId: idRaw || null,
          StationName: s.name || s.Name || s.stationName || s.station || `Station ${idRaw}`,
          TotalRevenue: total,
          ThisMonth: month
        }
      })

      // Include any extra groups that were not in stationList
      const stationIdsSet = new Set((stationList || []).map(s => String(s.id || s.Id || s.stationId || s.StationId || '').toLowerCase()))
      const extras = (g || []).filter(item => {
        const id = String(item.StationId || item.stationId || item.Station || '').toLowerCase()
        return id && !stationIdsSet.has(id)
      }).map(item => ({
        StationId: item.StationId || item.stationId || item.Station || null,
        StationName: item.StationName || item.stationName || item.Station || `Station ${item.StationId || item.stationId || ''}`,
        TotalRevenue: item.TotalRevenue ?? item.totalRevenue ?? item.Total ?? 0,
        ThisMonth: item.ThisMonth ?? item.thisMonth ?? item.Month ?? 0
      }))

      const allStations = [...merged, ...extras]

      // Sort alphabetically by StationName (case-insensitive)
      allStations.sort((a, b) => {
        const A = String(a.StationName || '').toLowerCase()
        const B = String(b.StationName || '').toLowerCase()
        if (A < B) return -1
        if (A > B) return 1
        return 0
      })

      setStationRevenues(allStations)
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
                <div style={{color:'#666', fontSize:12}}>Total</div>
                <div style={{fontSize:20, fontWeight:700}}>{formatCurrency(s.TotalRevenue ?? s.totalRevenue ?? s.Total ?? 0)}</div>
                <div style={{color:'#666', fontSize:12, marginTop:8}}>This Month</div>
                <div style={{fontSize:16, fontWeight:700}}>{formatCurrency(s.ThisMonth ?? s.thisMonth ?? s.Month ?? 0)}</div>
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
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
