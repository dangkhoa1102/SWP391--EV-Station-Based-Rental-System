import React, { useState } from 'react';
import { PLACEHOLDER } from '../../../../utils/placeholder';

export default function UserModal({ user, onClose, onAssignStaff, onDelete }) {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const fullName = user.fullName || user.FullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const email = user.email || user.Email || '—';
  const phone = user.phoneNumber || user.PhoneNumber || user.phone || '—';
  const role = user.role || user.Role || user.userRole || 'Customer';
  const avatar = user.avatarUrl || user.AvatarUrl || PLACEHOLDER.avatarLarge(fullName.charAt(0));
  const userId = user.id || user.Id || user.userId || user.UserId;

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
    <div className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{maxWidth: '500px', width: '90%'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
        <div style={{textAlign: 'center', padding: '20px'}}>
          <img src={avatar} alt={fullName} style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px'}} />
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

        <div style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'center'}}>
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
