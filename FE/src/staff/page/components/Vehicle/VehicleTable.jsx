import React, { useEffect, useState } from 'react'
import './Vehicle.css'
import carApi from '../../../../services/carApi'

export default function VehicleTable({ vehicles = [], search = '', setSearch = () => {}, onRowClick = () => {}, onEdit = () => {}, onRemove = () => {}, canDelete = true }) {
  const [imagesById, setImagesById] = useState({})

  useEffect(() => {
    let mounted = true
    async function loadImages() {
      try {
        const ids = Array.from(new Set((vehicles || []).map(v => v.id).filter(Boolean)))
        if (ids.length === 0) return
        const pairs = await Promise.all(ids.map(async id => {
          try {
            const c = await carApi.getCarById(id)
            const url = c?.imageUrl || c?.ImageUrl || c?.thumbnailUrl || c?.image || null
            const plate = c?.licensePlate || c?.LicensePlate || null
            return [String(id), { image: url, licensePlate: plate }]
          } catch (e) {
            return [String(id), { image: null, licensePlate: null }]
          }
        }))
        if (!mounted) return
        const map = {}
        for (const [k, v] of pairs) map[k] = v
        setImagesById(map)
      } catch (e) {}
    }
    loadImages()
    return () => { mounted = false }
  }, [vehicles])

  const filtered = (vehicles || []).filter(v => {
    if (!search) return true
    const q = (search || '').toLowerCase()
    return (v.name || '').toLowerCase().includes(q) || (v.brand || '').toLowerCase().includes(q) || (v.model || '').toLowerCase().includes(q) || (v.licensePlate || '').toLowerCase().includes(q)
  })

  const formatBattery = (b) => (b == null || b === '') ? '-' : (Number.isFinite(b) ? `${b}%` : String(b))
  const formatCapacity = (c) => (c == null || c === '') ? '-' : String(c)

  return (
    <div className="vehicle-table-model">
      <div style={{ overflowX: 'auto' }}>
        <table className="vehicle-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#fafafa' }}>
              <th style={{ padding: '12px 10px' }}>Vehicle</th>
              <th style={{ padding: '12px 10px', width: 160 }}>Plate</th>
              <th style={{ padding: '12px 10px', width: 120 }}>Battery</th>
              <th style={{ padding: '12px 10px', width: 120 }}>Capacity</th>
              <th style={{ padding: '12px 10px' }}>Status</th>
              <th style={{ padding: '12px 10px', width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 24, color: '#666' }}>No vehicles found</td>
              </tr>
            )}
            {filtered.map(v => (
              <tr key={v.id || v.licensePlate || Math.random()} className="vehicle-row" style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 10px', display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => onRowClick(v)}>
                  <img
                    src={(imagesById[String(v.id)] && imagesById[String(v.id)].image) || v.img || 'https://via.placeholder.com/100x60?text=Car'}
                    alt="car"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/100x60?text=Car' }}
                    style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', background: '#fff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.name || v.title || 'Vehicle'}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{v.brand ? `${v.brand}${v.model ? ' • ' + v.model : ''}` : (v.model || '')}</div>
                  </div>
                </td>
                <td style={{ padding: '12px 10px' }}>{(imagesById[String(v.id)] && imagesById[String(v.id)].licensePlate) || v.licensePlate || '-'}</td>
                <td style={{ padding: '12px 10px' }}>{formatBattery(v.battery)}</td>
                <td style={{ padding: '12px 10px' }}>{formatCapacity(v.capacity)}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: v.tech === 'Unavailable' || v.tech === 'Removed' ? '#fff0f0' : '#f0f6ff', color: v.tech === 'Unavailable' || v.tech === 'Removed' ? '#b00020' : '#1351b4', fontWeight: 600, fontSize: 12 }}>{v.tech || (v.issue ? 'Issue' : 'Available')}</span>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <button onClick={(e) => { e.stopPropagation(); onRowClick(v) }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', marginRight: 8 }}>Details</button>
                  {canDelete && <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this vehicle?')) onRemove(v.id || v) }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #f0c0c0', background: '#fff', cursor: 'pointer', color: '#b00020' }}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
