import React, { useState, useEffect } from 'react';
import adminApi from '../../../../services/adminApi';
import incidentApi from '../../../../services/incidentApi';
import { apiClient } from '../../../../services/api';
import IncidentDetailsModal from '../../../../staff/page/components/Incident/IncidentDetailsModal';

export default function AdminIncidentModal({ open = false, incident = null, onClose = () => {}, onAssigned = () => {} }) {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    async function loadStations() {
      try {
        const s = await adminApi.getAllStations(1, 200);
        if (!mounted) return;
        setStations(s || []);
      } catch (e) {
        console.error('Failed to load stations', e);
        setStations([]);
      }
    }
    loadStations();
    return () => { mounted = false }
  }, [open]);

  useEffect(() => {
    if (incident) setSelectedStation(incident.stationId || '');
  }, [incident]);

  const isResolved = (incident?.status || incident?.Status || '').toString().toUpperCase() === 'RESOLVED';

  if (!open || !incident) return null;

  const handleAssign = async () => {
    if (!selectedStation) {
      alert('Please choose a station')
      return
    }
    setLoading(true)
    try {
      // first try FormData (some backends accept multipart)
      try {
        console.log('[AdminIncidentModal] Assigning', { incidentId: incident?.id, station: selectedStation })
        const fd = new FormData()
        fd.append('stationId', selectedStation)
        fd.append('StationId', selectedStation)
        // When admin assigns, mark incident as Pending by default
        fd.append('status', 'Pending')
        fd.append('Status', 'Pending')
        const resFd = await incidentApi.updateIncident(incident.id, fd)
        console.log('[AdminIncidentModal] FormData assign response:', resFd)
        alert('Assigned successfully')
        onAssigned()
        return
      } catch (errForm) {
        console.warn('[AdminIncidentModal] FormData update failed, will try JSON fallback', errForm)
      }

      // fallback: try JSON PUT to common endpoints with both stationId key variants
      const idEnc = encodeURIComponent(incident.id)
      const attempts = [
        `/Incidents/Update-By-${idEnc}`,
        `/Incidents/Update-By-Id/${idEnc}`,
        `/Incidents/Update/${idEnc}`,
        `/Incidents/${idEnc}`
      ]
      let lastErr = null
      for (const url of attempts) {
        try {
          const body = { stationId: selectedStation, StationId: selectedStation, status: 'Pending', Status: 'Pending' }
          console.log('[AdminIncidentModal] Trying JSON PUT', { url, body })
          const res = await apiClient.put(url, body)
          console.log('[AdminIncidentModal] JSON PUT response for', url, res?.status, res?.data)
          // consider success if 2xx
          alert('Assigned successfully')
          onAssigned()
          return
        } catch (e) {
          lastErr = e
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) {
            // for other errors, stop trying and surface
            console.error('[AdminIncidentModal] Assign JSON PUT failed on', url, e)
            break
          }
          console.warn('[AdminIncidentModal] JSON PUT 404/405 or not found for', url)
        }
      }
      throw lastErr || new Error('Assign failed')
    } catch (e) {
      console.error('Failed to assign station', e)
      alert(e?.message || 'Failed to assign')
    } finally {
      setLoading(false)
    }
  }

  const footerExtras = (
    <div style={{width: '100%'}}>
      <div style={{marginBottom:8}}><strong>Renter:</strong> {incident.renterName || '—'}</div>
      <div style={{marginBottom:8}}><strong>Phone:</strong> {incident.renterPhone || '—'}</div>

      <div style={{margin:'12px 0'}}>
        <label style={{display:'block', marginBottom:6}}>Select station to assign</label>
        {isResolved && (
          <div style={{color:'#b91c1c', marginBottom:8}}>Assignment disabled for resolved incidents.</div>
        )}
        <select
          value={selectedStation}
          onChange={e=>setSelectedStation(e.target.value)}
          style={{width:'100%', padding:8}}
          disabled={isResolved || loading}
        >
          <option value="">-- Choose station --</option>
          {stations.map(s => (
            <option key={s.id || s.Id} value={s.id || s.Id}>{s.name || s.Name || s.stationName || s.station}</option>
          ))}
        </select>
      </div>

      {/* Buttons styled to match modal action buttons — these will replace the default action buttons when injected */}
      <div style={{display:'flex', gap: '12px', justifyContent: 'flex-end', width: '100%'}}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <i></i> Cancel
        </button>

        <button
          onClick={handleAssign}
          disabled={loading || isResolved}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (loading || isResolved) ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-check-circle"></i> {isResolved ? 'Assign (disabled)' : (loading ? 'Assigning…' : 'Assign')}
        </button>
      </div>
    </div>
  )

  return (
    <IncidentDetailsModal
      open={open}
      incident={incident}
      onClose={onClose}
      onUpdate={async (id, data) => {
        // pass-through update for other edits
        return incidentApi.updateIncident(id, data)
      }}
      onResolve={async (id, notes, cost) => {
        return incidentApi.resolveIncident(id, notes, cost)
      }}
      footerExtras={footerExtras}
    />
  )
}
