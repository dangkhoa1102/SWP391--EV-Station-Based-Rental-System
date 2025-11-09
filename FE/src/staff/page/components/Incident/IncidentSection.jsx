import React, { useState, useEffect } from 'react';
import IncidentCard from './IncidentCard';
import CreateIncidentModal from './CreateIncidentModal';
import IncidentDetailsModal from './IncidentDetailsModal';
import './Incident.css';

export default function IncidentSection({ 
  incidents = [], 
  bookings = [],
  onCreateIncident, 
  onUpdateIncident,
  onResolveIncident,
  onDeleteIncident,
  onRefresh,
  canDelete = true,
  stationFilter = null
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    // Status filter
    if (statusFilter && incident.status !== statusFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const description = (incident.description || '').toLowerCase();
      const id = (incident.id || '').toLowerCase();
      const bookingId = (incident.bookingId || '').toLowerCase();
      
      if (!description.includes(query) && !id.includes(query) && !bookingId.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  const openDetails = (incident) => {
    setSelectedIncident(incident);
    setDetailsOpen(true);
  };

  const handleCreate = async (formData) => {
    await onCreateIncident(formData);
    if (onRefresh) await onRefresh();
  };

  const handleUpdate = async (incidentId, formData) => {
    await onUpdateIncident(incidentId, formData);
    if (onRefresh) await onRefresh();
    // Refresh selected incident
    setDetailsOpen(false);
  };

  const handleResolve = async (incidentId, resolutionNotes, costIncurred) => {
    await onResolveIncident(incidentId, resolutionNotes, costIncurred);
    if (onRefresh) await onRefresh();
  };

  const handleDelete = async (incidentId) => {
    await onDeleteIncident(incidentId);
    if (onRefresh) await onRefresh();
  };

  return (
    <div id="incident" className="section">
      {/* Header with Create Button and Filters */}
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap'}}>
        <button className="incident-add-btn" onClick={() => setCreateOpen(true)}>
          <i className="fas fa-plus"></i> Report Incident
        </button>

        <div className="incident-filters" style={{flex: 1, display: 'flex', gap: '12px'}}>
          <select
            className="incident-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <input
            className="incident-search-input"
            type="text"
            placeholder="Search by description, ID, or booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Incident Count */}
      <div style={{
        padding: '8px 8px 16px',
        color: '#6b7280',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {filteredIncidents.length === 0 ? (
          'No incidents found'
        ) : (
          `Showing ${filteredIncidents.length} incident${filteredIncidents.length > 1 ? 's' : ''}`
        )}
      </div>

      {/* Incident Grid */}
      {filteredIncidents.length > 0 ? (
        <div className="incident-grid">
          {filteredIncidents.map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onClick={openDetails}
            />
          ))}
        </div>
      ) : (
        <div className="incident-empty-state">
          <i className="fas fa-clipboard-check"></i>
          <h3>No Incidents</h3>
          <p>
            {searchQuery || statusFilter
              ? 'No incidents match your filters'
              : 'No incidents have been reported yet'}
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateIncidentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        bookings={bookings}
      />

      <IncidentDetailsModal
        open={detailsOpen}
        incident={selectedIncident}
        onClose={() => setDetailsOpen(false)}
        onUpdate={handleUpdate}
        onResolve={handleResolve}
        onDelete={handleDelete}
        canDelete={canDelete}
      />
    </div>
  );
}
