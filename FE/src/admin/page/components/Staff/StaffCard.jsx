import React, { useState } from 'react';

export default function StaffCard({ staff, stations, onClick }) {
  const fullName = staff.fullName || staff.FullName || [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Staff';
  const email = staff.email || staff.Email || '—';
  const providedAvatar = staff.avatarUrl || staff.AvatarUrl || '';
  const avatar = providedAvatar || `https://via.placeholder.com/100x100?text=${encodeURIComponent(fullName.charAt(0))}`;
  const [imgError, setImgError] = useState(false);
  const phone = staff.phoneNumber || staff.PhoneNumber || staff.phone || '—';
  
  // Find station name
  const stationId = staff.stationId || staff.StationId;
  const station = stations.find(s => (s.id || s.Id) === stationId);
  const stationName = station ? (station.name || station.Name) : 
                      staff.stationName || staff.StationName || 
                      (stationId ? `Station ${stationId.substring(0, 8)}...` : 'Not Assigned');
  
  const isUnassigned = !stationId && !staff.stationName && !staff.StationName;

  return (
    <div className="staff-card" onClick={onClick}>
      {/* Show image when avatar provided and not errored; otherwise show SVG placeholder like UserCard */}
      {providedAvatar && !imgError ? (
        <img src={avatar} alt={fullName} className="staff-avatar" onError={() => setImgError(true)} />
      ) : (
        <div className="staff-avatar" aria-hidden style={{ background: '#eceff1', color: '#607d8b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      )}
      <div className="staff-info">
        <div className="staff-name">{fullName}</div>
        <div className="staff-email">{email}</div>
        <div className="staff-station" style={{ color: isUnassigned ? '#ff9800' : 'inherit' }}>
          {isUnassigned ? '⚠️' : '📍'} {stationName}
        </div>
        {phone !== '—' && <div className="staff-phone">📞 {phone}</div>}
      </div>
    </div>
  );
}
