import React, { useState } from 'react';
import UserCard from './UserCard';
import UserModal from './UserModal';
import './User.css';

export default function UserSection({ users, onAssignStaff, onDeleteUser }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  // Filter to show only users without Station Staff role
  const customers = users.filter(u => {
    const role = (u.role || u.Role || u.userRole || '').toLowerCase();
    const matchesSearch = search === '' || 
      (u.fullName || u.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userName || u.UserName || '').toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch && role !== 'station staff' && role !== 'stationstaff';
  });

  return (
    <div id="users" className="section">
      <div className="filter-bar">
        <input 
          type="text" 
          placeholder="Search by name, email, or username..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <div style={{color:'#666', fontSize:'14px'}}>
          Showing {customers.length} users
        </div>
      </div>

      <div className="user-grid">
        {customers.map(u => (
          <UserCard 
            key={u.id || u.Id} 
            user={u} 
            onClick={() => setSelected(u)} 
          />
        ))}
      </div>

      {customers.length === 0 && (
        <div style={{padding:'20px', textAlign:'center', color:'#999'}}>
          No users found
        </div>
      )}

      <UserModal
        user={selected}
        onClose={() => setSelected(null)}
        onAssignStaff={onAssignStaff}
        onDelete={onDeleteUser}
      />
    </div>
  );
}
