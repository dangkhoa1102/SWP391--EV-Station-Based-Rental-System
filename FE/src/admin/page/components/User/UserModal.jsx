import React, { useState } from 'react';
import UserBookingHistory from './UserBookingHistory';

export default function UserModal({ user, onClose, onAssignStaff, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [showBookingHistory, setShowBookingHistory] = useState(false);

  if (!user) return null;

  const fullName = user.fullName || user.FullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const email = user.email || user.Email || '—';
  const phone = user.phoneNumber || user.PhoneNumber || user.phone || '—';
  const role = user.role || user.Role || user.userRole || 'Customer';
  const userId = user.id || user.Id || user.userId || user.UserId;

  if (showBookingHistory) {
    return <UserBookingHistory userId={userId} userName={fullName} onClose={() => setShowBookingHistory(false)} />;
  }

  const handleAssignStaff = async () => {
    const reason = window.prompt('Enter reason for promoting to staff (optional):') || '';
    if (reason === null) return; // User cancelled
    
    setLoading(true);
    try {
      await onAssignStaff?.(user, reason);
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Failed to assign staff role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${fullName}?`)) return;
    const reason = window.prompt('Enter reason for deletion (optional):') || '';
    
    setLoading(true);
    try {
      await onDelete?.(user, reason);
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}
    >
      <div className="modal-content" style={{maxWidth: '500px', width: '90%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
  <div style={{textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {/* Avatar placeholder: no user images here, show an icon-only placeholder */}
          <div
            aria-hidden
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#eceff1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px',
              color: '#607d8b'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2 style={{margin: '10px 0'}}>{fullName}</h2>
          <div style={{color: '#666', marginBottom: '20px'}}>{role}</div>
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
            <strong>User ID:</strong>
            <span style={{fontSize: '12px', wordBreak: 'break-all'}}>{userId}</span>
          </div>
        </div>

        <div style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
          <button 
            onClick={() => setShowBookingHistory(true)}
            style={{
              background: '#1976d2',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            <i className="fas fa-history" style={{marginRight: '6px'}}></i>
            Booking History
          </button>
          <button 
            onClick={handleAssignStaff} 
            disabled={loading}
            style={{
              background: '#43a047',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Promote to Staff'}
          </button>
          <button 
            onClick={handleDelete} 
            disabled={loading}
            style={{
              background: '#d32f2f',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
}
