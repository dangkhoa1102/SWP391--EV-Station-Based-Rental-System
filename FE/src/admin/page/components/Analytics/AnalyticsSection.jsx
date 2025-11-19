import React, { useEffect, useState } from 'react'
import { getAdminDashboard } from '../../../../services/revenue'
import StationRevenueSection from './StationRevenueSection'
import StationVehiclesSection from './StationVehiclesSection'

export default function AnalyticsSection() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        const res = await getAdminDashboard(token)
        // the revenue.js returns res.data already, but many backends wrap in ResponseDto
        const body = res?.data || res
        if (!mounted) return
        setData(body)
        // analytics only: station revenue UI moved to StationRevenueSection
      } catch (e) {
        if (!mounted) return
        setError(e?.message || String(e))
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div style={{padding:12}}>Loading analytics…</div>
  if (error) return <div style={{padding:12, color:'#b00020'}}>Error: {error}</div>
  if (!data) return <div style={{padding:12}}>No analytics data</div>

  // response shape: { isSuccess, message, data: { overview, userStatistics, fleetStatistics, bookingStatistics, revenueStatistics } }
  const payload = data.data || data
  const overview = payload?.overview || {}
  const users = payload?.userStatistics || {}
  const fleet = payload?.fleetStatistics || {}
  const booking = payload?.bookingStatistics || {}
  const revenue = payload?.revenueStatistics || {}

  const cardStyle = {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  }

  return (
    <div style={{display:'grid', gap:16}}>
      <h2 style={{margin:0, marginBottom:6}}>Analytics</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
        <div style={cardStyle}>
          <div style={{color:'#666', fontSize:12}}>Total Users</div>
          <div style={{fontSize:20, fontWeight:700}}>{overview.totalUsers ?? '—'}</div>
        </div>
        <div style={cardStyle}>
          <div style={{color:'#666', fontSize:12}}>Total Cars</div>
          <div style={{fontSize:20, fontWeight:700}}>{overview.totalCars ?? '—'}</div>
        </div>
        <div style={cardStyle}>
          <div style={{color:'#666', fontSize:12}}>Total Bookings</div>
          <div style={{fontSize:20, fontWeight:700}}>{overview.totalBookings ?? '—'}</div>
        </div>
        <div style={cardStyle}>
          <div style={{color:'#666', fontSize:12}}>Active Bookings</div>
          <div style={{fontSize:20, fontWeight:700}}>{overview.activeBookings ?? '—'}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
        <div style={{display:'grid', gap:12}}>
          <div style={cardStyle}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontWeight:700}}>User Statistics</div>
            </div>
            <div style={{marginTop:8}}>
              <div style={{display:'flex', gap:12}}>
                <div style={{flex:1}}>
                  <div style={{color:'#666', fontSize:12}}>Total Active</div>
                  <div style={{fontSize:18, fontWeight:700}}>{users.totalActive ?? '—'}</div>
                </div>
                <div style={{flex:2}}>
                  <div style={{color:'#666', fontSize:12}}>By Role</div>
                  <div style={{marginTop:6, display:'flex', gap:8}}>
                    {users.byRole ? Object.entries(users.byRole).map(([k,v])=> (
                      <div key={k} style={{background:'#f5f7fb', padding:'6px 8px', borderRadius:6}}>
                        <div style={{fontSize:12, color:'#333'}}>{k}</div>
                        <div style={{fontWeight:700}}>{v}</div>
                      </div>
                    )) : <div>—</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{fontWeight:700}}>Fleet Statistics</div>
            <div style={{display:'flex', gap:12, marginTop:8}}>
              <div style={{flex:1}}>
                <div style={{color:'#666', fontSize:12}}>Total Cars</div>
                <div style={{fontWeight:700}}>{fleet.totalCars ?? '—'}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:'#666', fontSize:12}}>Available</div>
                <div style={{fontWeight:700}}>{fleet.availableCars ?? '—'}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:'#666', fontSize:12}}>In Use</div>
                <div style={{fontWeight:700}}>{fleet.inUseCars ?? '—'}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{color:'#666', fontSize:12}}>Low Battery</div>
                <div style={{fontWeight:700}}>{fleet.lowBatteryCars ?? '—'}</div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{fontWeight:700}}>Booking Statistics</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginTop:8}}>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#666', fontSize:12}}>Total</div>
                <div style={{fontWeight:700}}>{booking.total ?? '—'}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#666', fontSize:12}}>Pending</div>
                <div style={{fontWeight:700}}>{booking.pending ?? '—'}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#666', fontSize:12}}>Checked-in</div>
                <div style={{fontWeight:700}}>{booking.checkedIn ?? '—'}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#666', fontSize:12}}>Completed</div>
                <div style={{fontWeight:700}}>{booking.completed ?? '—'}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{color:'#666', fontSize:12}}>Cancelled</div>
                <div style={{fontWeight:700}}>{booking.cancelled ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs for station analytics (Stations, Vehicles) */}
      <div style={{marginTop:12}}>
        <Tabs />
      </div>
    </div>
  )
}

function Tabs() {
  const [tab, setTab] = useState('stations') // default to stations
  return (
    <div>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button onClick={() => setTab('stations')} style={{padding:'8px 12px', borderRadius:6, background: tab==='stations' ? '#eef' : '#fff'}}>
          Stations
        </button>
        <button onClick={() => setTab('vehicles')} style={{padding:'8px 12px', borderRadius:6, background: tab==='vehicles' ? '#eef' : '#fff'}}>
          Vehicles
        </button>
      </div>
      <div>
        {tab === 'stations' && <StationRevenueSection />}
        {tab === 'vehicles' && <StationVehiclesSection />}
      </div>
    </div>
  )
}

// Lazy import vehicles component to avoid circular deps

function formatCurrency(v) {
  if (v == null) return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
