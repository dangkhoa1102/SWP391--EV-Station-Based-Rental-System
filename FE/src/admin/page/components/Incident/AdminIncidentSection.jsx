import React, { useState, useEffect } from 'react';
import incidentApi from '../../../../services/incidentApi';
import adminApi from '../../../../services/adminApi';
import AdminIncidentModal from './AdminIncidentModal';
import IncidentCard from '../../../../staff/page/components/Incident/IncidentCard';

export default function AdminIncidentSection() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await incidentApi.getAllIncidents(null, null, null, null, 1, 500);
      const items = resp?.incidents || [];
      // Keep incidents as returned, but normalize id
      const mapped = (items || []).map(it => ({
        id: it.id || it.Id || it.incidentId || it.IncidentId || (it._id && String(it._id)),
        description: it.description || it.Description || it.details || '',
        stationId: it.stationId || it.StationId || null,
        bookingId: it.bookingId || it.BookingId || it.booking?.id || it.booking?.BookingId || null,
        reportedAt: it.reportedAt || it.ReportedAt || it.createdAt || it.CreatedAt || it.date || null,
        renterName: it.renterName || it.RenterName || it.raw?.renterName || it.raw?.RenterName || it.booking?.user?.fullName || null,
        renterPhone: it.renterPhone || it.RenterPhone || it.raw?.renterPhone || it.raw?.RenterPhone || it.booking?.user?.phoneNumber || null,
        staffId: it.staffId || it.StaffId || it.raw?.staffId || it.raw?.StaffId || null,
        // Normalize images so IncidentDetailsModal sees evidence photos
        images: it.images || it.Images || it.imageUrls || it.ImageUrls || (typeof it.imageUrls === 'string' && it.imageUrls ? it.imageUrls.split(';') : null) || [],
        Images: it.images || it.Images || it.imageUrls || it.ImageUrls || (typeof it.imageUrls === 'string' && it.imageUrls ? it.imageUrls.split(';') : null) || [],
        raw: it
      }));

      // Enrich with creator's station name when available
      const enriched = await Promise.all(mapped.map(async m => {
        let creatorStation = null;
        const staffId = m.staffId || m.raw?.staffId || m.raw?.StaffId || m.raw?.StaffId;
        if (staffId) {
          try {
            const st = await adminApi.getStationByStaff(staffId);
            creatorStation = st?.name || st?.stationName || st?.Name || null;
          } catch (e) {
            // ignore enrichment errors
            creatorStation = null;
          }
        }
        return { ...m, creatorStation };
      }));

      setIncidents(enriched);
    } catch (e) {
      console.error('Failed to load incidents', e);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openAssign = (incident) => {
    setSelected(incident);
    setModalOpen(true);
  }

  const handleAssigned = async () => {
    setModalOpen(false);
    setSelected(null);
    await load();
  }

  return (
    <div className="section">
      <h3 style={{marginTop:0}}>Incidents</h3>
      {loading && <div>Loading incidents…</div>}
      {!loading && incidents.length === 0 && <div style={{padding:12}}>No incidents found.</div>}
      {!loading && incidents.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12}}>
          {incidents.map(it => (
            <IncidentCard key={it.id} incident={it} onClick={(inc) => openAssign(inc)} />
          ))}
        </div>
      )}

      <AdminIncidentModal
        open={modalOpen}
        incident={selected}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
