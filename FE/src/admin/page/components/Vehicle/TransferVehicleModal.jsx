import React, { useState } from 'react';

export default function TransferVehicleModal({ open, onClose, vehicle, stations, currentStationId, onSubmit }) {
  const [selectedStationId, setSelectedStationId] = useState('');
  const [reason, setReason] = useState('Fleet rebalancing');
  const [loading, setLoading] = useState(false);

  if (!open || !vehicle) return null;

  // Filter out current station
  const availableStations = stations.filter(s => {
    const stationId = s.id || s.Id;
    return stationId && stationId !== currentStationId;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) {
      alert('Please select a station');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(vehicle, selectedStationId, reason);
      setSelectedStationId('');
      setReason('Fleet rebalancing');
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>
            <i className="fas fa-exchange-alt" style={{marginRight: '8px', color: '#0ea5e9'}}></i>
            Transfer Vehicle
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              width: '32px',
              height: '32px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{fontWeight: '600', marginBottom: '4px'}}>{vehicle.name}</div>
          <div style={{fontSize: '14px', color: '#6b7280'}}>
            Current Station: {vehicle.stationName || 'Unknown'}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Transfer to Station <span style={{color: 'red'}}>*</span>
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">-- Select Station --</option>
              {availableStations.map(station => {
                const id = station.id || station.Id;
                const name = station.name || station.Name || `Station ${id}`;
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block',
              fontWeight: '500',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for transfer..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedStationId}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                background: selectedStationId && !loading ? '#0ea5e9' : '#9ca3af',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: selectedStationId && !loading ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Transferring...' : 'Transfer Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
