import React, { useState } from 'react';
import StaffCard from './StaffCard';
import StaffModal from './StaffModal';
import './Staff.css';

export default function StaffSection({ users, stations, onRemoveStaff }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('');

  // Filter to show only users with Station Staff role
  const staffMembers = users.filter(u => {
    const role = (u.role || u.Role || u.userRole || '').toLowerCase();
    const matchesSearch = search === '' || 
      (u.fullName || u.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userName || u.UserName || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStation = stationFilter === '' || 
      (u.stationId || u.StationId || '') === stationFilter;
    
    return matchesSearch && matchesStation && (role === 'station staff' || role === 'stationstaff');
  });

  return (
    <div id="staff" className="section">
      <div className="filter-bar">
        <input 
          type="text" 
          placeholder="Search staff by name, email, or username..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <select 
          value={stationFilter} 
          onChange={e => setStationFilter(e.target.value)}
          style={{padding: '10px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px'}}
        >
          <option value="">All Stations</option>
          {stations.map(s => (
            <option key={s.id || s.Id} value={s.id || s.Id}>
              {s.name || s.Name || `Station ${s.id || s.Id}`}
            </option>
          ))}
        </select>
        <div style={{color:'#666', fontSize:'14px', whiteSpace: 'nowrap'}}>
          {staffMembers.length} staff
        </div>
      </div>

      <div className="staff-grid">
        {staffMembers.map(s => (
          <StaffCard 
            key={s.id || s.Id} 
            staff={s} 
            stations={stations}
            onClick={() => setSelected(s)} 
          />
        ))}
      </div>

      {staffMembers.length === 0 && (
        <div style={{padding:'20px', textAlign:'center', color:'#999'}}>
          No staff members found
        </div>
      )}

      <StaffModal
        staff={selected}
        stations={stations}
        onClose={() => setSelected(null)}
        onRemoveStaff={onRemoveStaff}
      />
    </div>
  );
}
