import React, { useState, useEffect } from 'react';
import UserCard from './UserCard';
import UserModal from './UserModal';
import AddUserModal from './AddUserModal';
import DeletedUserCard from './DeletedUserCard';
import './User.css';

export default function UserSection({ 
  users, 
  deletedUsers = [],
  loadingDeleted = false,
  onAssignStaff, 
  onDeleteUser, 
  onRestoreUser,
  onUserCreated,
  onLoadDeleted 
}) {
  const [selected, setSelected] = useState(null);
  const [selectedDeleted, setSelectedDeleted] = useState(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'

  // Load deleted users when switching to deleted view
  useEffect(() => {
    if (viewMode === 'deleted' && deletedUsers.length === 0 && !loadingDeleted && onLoadDeleted) {
      onLoadDeleted();
    }
  }, [viewMode, deletedUsers.length, loadingDeleted, onLoadDeleted]);

  // Filter active users
  const customers = users.filter(u => {
    const role = (u.role || u.Role || u.userRole || '').toLowerCase();
    const matchesSearch = search === '' || 
      (u.fullName || u.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userName || u.UserName || '').toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch && 
           role !== 'station staff' && 
           role !== 'stationstaff' && 
           role !== 'admin';
  });

  // Filter deleted users
  const filteredDeletedUsers = deletedUsers.filter(u => {
    return search === '' || 
      (u.fullName || u.FullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || u.Email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.userName || u.UserName || '').toLowerCase().includes(search.toLowerCase());
  });

  const displayUsers = viewMode === 'active' ? customers : filteredDeletedUsers;

  return (
    <div id="users" className="section">
      <div className="filter-bar">
        <button 
          className="vehicle-add-btn" 
          onClick={() => setAddOpen(true)}
          style={{marginRight: '12px'}}
        >
          <i className="fas fa-plus"></i> Create User
        </button>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle" style={{marginRight: '12px'}}>
          <button 
            className={`toggle-btn ${viewMode === 'active' ? 'active' : ''}`}
            onClick={() => setViewMode('active')}
          >
            <i className="fas fa-users"></i> Active Users
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'deleted' ? 'active' : ''}`}
            onClick={() => setViewMode('deleted')}
          >
            <i className="fas fa-user-slash"></i> Deleted Users
          </button>
        </div>

        <input 
          type="text" 
          placeholder="Search by name, email, or username..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <div style={{color:'#666', fontSize:'14px'}}>
          Showing {displayUsers.length} {viewMode === 'active' ? 'active' : 'deleted'} users
        </div>
      </div>

      {loadingDeleted && viewMode === 'deleted' && (
        <div style={{padding:'20px', textAlign:'center', color:'#666'}}>
          Loading deleted users...
        </div>
      )}

      {!loadingDeleted && (
        <div className="user-grid">
          {viewMode === 'active' && customers.map(u => (
            <UserCard 
              key={u.id || u.Id} 
              user={u} 
              onClick={() => setSelected(u)} 
            />
          ))}
          {viewMode === 'deleted' && filteredDeletedUsers.map(u => (
            <DeletedUserCard 
              key={u.userId || u.id || u.Id} 
              user={u} 
              onClick={() => setSelectedDeleted(u)} 
            />
          ))}
        </div>
      )}

      {displayUsers.length === 0 && !loadingDeleted && (
        <div style={{padding:'20px', textAlign:'center', color:'#999'}}>
          No {viewMode === 'deleted' ? 'deleted' : ''} users found
        </div>
      )}

      {/* Active User Modal */}
      <UserModal
        user={selected}
        onClose={() => setSelected(null)}
        onAssignStaff={onAssignStaff}
        onDelete={onDeleteUser}
      />

      {/* Deleted User Modal */}
      {selectedDeleted && (
        <div className="modal-overlay" onClick={() => setSelectedDeleted(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deleted User Details</h3>
              <button className="modal-close" onClick={() => setSelectedDeleted(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <strong>Name:</strong>
                  <span>{selectedDeleted.fullName || selectedDeleted.FullName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <strong>Email:</strong>
                  <span>{selectedDeleted.email || selectedDeleted.Email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <strong>Role:</strong>
                  <span>{selectedDeleted.userRole || selectedDeleted.role || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <strong>Deleted At:</strong>
                  <span>{selectedDeleted.deactivatedAt || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <strong>Days Deactivated:</strong>
                  <span>{selectedDeleted.daysDeactivated || 0} days</span>
                </div>
              </div>
              <div className="modal-actions" style={{marginTop: '20px'}}>
                <button 
                  className="btn-restore"
                  onClick={() => {
                    if (onRestoreUser) {
                      onRestoreUser(selectedDeleted);
                      setSelectedDeleted(null);
                    }
                  }}
                >
                  <i className="fas fa-undo"></i> Restore User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={onUserCreated}
      />
    </div>
  );
}
