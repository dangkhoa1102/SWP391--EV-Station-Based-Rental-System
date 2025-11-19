import React, { useEffect, useState } from 'react'
import { getCarUtilization } from '../../../../services/revenue'

export default function StationVehiclesSection() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadVehicles() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await getCarUtilization(token)
      // The API returns a ResponseDto-like wrapper: { data: { topPerformingCars: [...] } }
      const payload = (res && (res.data || res)) || {}

      // Find the primary array anywhere in the payload (no hard-coded key names)
      function findArrays(obj, arrays = []) {
        if (!obj || typeof obj !== 'object') return arrays
        if (Array.isArray(obj)) {
          arrays.push(obj)
          // still traverse array items to find nested arrays
          for (const it of obj) findArrays(it, arrays)
          return arrays
        }
        for (const k of Object.keys(obj)) {
          findArrays(obj[k], arrays)
        }
        return arrays
      }

      const arrays = findArrays(payload)
      // pick the longest array found as the primary list
      let items = []
      if (arrays.length) {
        arrays.sort((a, b) => b.length - a.length)
        items = arrays[0]
      } else if (Array.isArray(payload)) items = payload
      else items = []

      // Map items directly using only fields from the response body
      const mapped = items.map(v => ({
        carId: v.carId ?? '',
        brand: v.brand ?? '',
        model: v.model ?? '',
        licensePlate: v.licensePlate ?? '',
        currentStation: v.currentStation ?? '',
        totalBookings: Number(v.totalBookings ?? 0) || 0,
        totalHoursUsed: Number(v.totalHoursUsed ?? 0) || 0,
        utilizationRate: Number(v.utilizationRate ?? 0) || 0,
        revenue: Number(v.revenue ?? 0) || 0,
        averageBatteryLevel: Number(v.averageBatteryLevel ?? 0) || 0,
        status: v.status ?? ''
      }))

      setVehicles(mapped)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: '#fff',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    width: '100%'
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Station Vehicles</h3>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={loadVehicles} style={{ padding: '8px 12px', borderRadius: 6 }}>Refresh</button>
      </div>

      {loading && <div style={{ padding: 12 }}>Loading vehicles…</div>}
      {error && <div style={{ padding: 12, color: '#b00020' }}>Error: {error}</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        {vehicles.length === 0 && !loading && <div style={{ color: '#666' }}>No vehicles found.</div>}
        {vehicles.map((v) => (
          <div key={v.carId || v.licensePlate || JSON.stringify(v)} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{(v.brand && v.model) ? `${v.brand} ${v.model}` : (v.carId || 'Vehicle')}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{v.licensePlate}</div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>{v.currentStation}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#666', fontSize: 12 }}>Utilization</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{v.utilizationRate}%</div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Revenue</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{v.revenue}</div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{v.status}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, color: '#444', fontSize: 13 }}>
              <div>Total bookings: <strong>{v.totalBookings}</strong></div>
              <div>Total hours: <strong>{v.totalHoursUsed}</strong></div>
              <div>Avg battery: <strong>{v.averageBatteryLevel}%</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
