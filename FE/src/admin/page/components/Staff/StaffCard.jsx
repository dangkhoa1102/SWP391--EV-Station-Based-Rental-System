import React from 'react';

export default function StaffCard({ staff, stations, onClick }) {
  const fullName = staff.fullName || staff.FullName || [staff.firstName, staff.lastName].filter(Boolean).join(' ') || 'Staff';
  const email = staff.email || staff.Email || '—';
  const avatar = staff.avatarUrl || staff.AvatarUrl || `https://via.placeholder.com/100x100?text=${encodeURIComponent(fullName.charAt(0))}`;
  const phone = staff.phoneNumber || staff.PhoneNumber || staff.phone || '—';
  
  // Find station name
  const stationId = staff.stationId || staff.StationId;
  const station = stations.find(s => (s.id || s.Id) === stationId);
  const stationName = station ? (station.name || station.Name) : (stationId || 'Unassigned');

  return (
    <div className="staff-card" onClick={onClick}>
      <img src={avatar} alt={fullName} className="staff-avatar" />
      <div className="staff-info">
        <div className="staff-name">{fullName}</div>
        <div className="staff-email">{email}</div>
        <div className="staff-station">📍 {stationName}</div>
        {phone !== '—' && <div className="staff-phone">📞 {phone}</div>}
      </div>
    </div>
  );
}
