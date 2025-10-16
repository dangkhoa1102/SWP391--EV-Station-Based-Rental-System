// src/components/Profile/ProfileModal.jsx
import React from 'react';

export default function ProfileModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="profile-modal-overlay" style={{display:'flex'}}>
      <div className="profile-modal-content">
        <span className="profile-modal-close" onClick={onClose}>&times;</span>
        <h2>Staff Profile</h2>
        <img src="https://via.placeholder.com/180x180?text=Staff" alt="Staff" style={{borderRadius:'50%'}} />
        <p><strong>Name:</strong> Nguyen Van Staff</p>
        <p><strong>Email:</strong> staff@fec.com</p>
        <p><strong>Role:</strong> Station Staff</p>
        <p><strong>Phone:</strong> 0123-456-789</p>
        <p><strong>Address:</strong> 123 Main St, City</p>
        <p><strong>Joined:</strong> 2024-01-15</p>
      </div>
    </div>
  );
}
