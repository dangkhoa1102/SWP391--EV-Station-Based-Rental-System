import React, { useState } from 'react';

export default function StaffModal({ staff, stations, onClose, onRemoveStaff }) {
  const [loading, setLoading] = useState(false);

  if (!staff) return null;

  const fullName = staff.fullName || staff.FullName || [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Staff';
  const email = staff.email || staff.Email || '—';
  const phone = staff.phoneNumber || staff.PhoneNumber || staff.phone || '—';
  const avatar = staff.avatarUrl || staff.AvatarUrl || `https://via.placeholder.com/150x150?text=${encodeURIComponent(fullName.charAt(0))}`;
  const userId = staff.id || staff.Id || staff.userId || staff.UserId;
  
  // Find station name
  const stationId = staff.stationId || staff.StationId;
  const station = stations.find(s => (s.id || s.Id) === stationId);
  const stationName = station ? (station.name || station.Name) : (stationId || 'Unassigned');

  const handleRemoveStaff = async () => {
    if (!window.confirm(`Are you sure you want to remove staff role from ${fullName}?`)) return;
    const reason = window.prompt('Enter reason for removing staff role (optional):') || '';
    
    setLoading(true);
    try {
      await onRemoveStaff?.(staff, reason);
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Failed to remove staff role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{maxWidth: '500px', width: '90%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
        <div style={{textAlign: 'center', padding: '20px'}}>
          <img src={avatar} alt={fullName} style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px'}} />
          <h2 style={{margin: '10px 0'}}>{fullName}</h2>
          <div style={{color: '#43a047', fontWeight: 600, marginBottom: '20px'}}>Station Staff</div>
        </div>

        <div style={{padding: '0 20px 20px'}}>
          <div className="info-row">
            <strong>Email:</strong>
            <span>{email}</span>
          </div>
          <div className="info-row">
            <strong>Phone:</strong>
            <span>{phone}</span>
          </div>
          <div className="info-row">
            <strong>Station:</strong>
            <span>{stationName}</span>
          </div>
          <div className="info-row">
            <strong>User ID:</strong>
            <span style={{fontSize: '12px', wordBreak: 'break-all'}}>{userId}</span>
          </div>
        </div>

        <div style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center'}}>
          <button 
            onClick={handleRemoveStaff} 
            disabled={loading}
            style={{
              background: '#ff9800',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Remove Staff Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
