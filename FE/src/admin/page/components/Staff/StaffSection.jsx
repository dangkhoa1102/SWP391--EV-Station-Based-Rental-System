import React, { useState, useMemo } from 'react';
import StaffCard from './StaffCard';
import StaffModal from './StaffModal';
import AddStaffModal from './AddStaffModal';
import './Staff.css';

export default function StaffSection({ 
  users, 
  staffByStation = [], 
  stations, 
  onRemoveStaff, 
  onAssignStation,
  onUnassignStation,
  onStaffCreated 
}) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  // Merge users and staffByStation arrays, removing duplicates by userId/id
  const allStaff = useMemo(() => {
    const staffMap = new Map();
    
    // Add staff from staffByStation (priority - these are from station API)
    staffByStation.forEach(staff => {
      const id = staff.userId || staff.id || staff.Id;
      if (id) {
        staffMap.set(id, staff);
      }
    });
    
    // Add staff from users array (filtered by role)
    users.forEach(user => {
      const role = (user.role || user.Role || user.userRole || '').toLowerCase();
      if (role === 'station staff' || role === 'stationstaff') {
        const id = user.id || user.Id || user.userId;
        if (id && !staffMap.has(id)) {
          staffMap.set(id, user);
        }
      }
    });
    
    return Array.from(staffMap.values());
  }, [users, staffByStation]);

  // Filter staff by search and station
  const staffMembers = allStaff.filter(u => {
    const matchesSearch = search === '' || 
      (u.fullName || u.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userName || u.UserName || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStation = stationFilter === '' || 
      (u.stationId || u.StationId || '') === stationFilter;
    
    return matchesSearch && matchesStation;
  });

  return (
    <div id="staff" className="section">
      <div className="filter-bar">
        <button 
          className="vehicle-add-btn" 
          onClick={() => setAddOpen(true)}
          style={{marginRight: '12px'}}
        >
          <i className="fas fa-plus"></i> Create Staff
        </button>
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
        onAssignStation={onAssignStation}
        onUnassignStation={onUnassignStation}
      />
      
      <AddStaffModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        stations={stations}
        onSuccess={onStaffCreated}
      />
    </div>
  );
}
