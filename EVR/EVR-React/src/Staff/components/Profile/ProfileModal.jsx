// src/components/Profile/ProfileModal.jsx
import React from 'react';
import './Profile.css';

export default function ProfileModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="profile-modal-overlay" style={{display:'flex'}}>
      <div className="profile-modal-content">
        <span className="profile-modal-close" onClick={onClose}>&times;</span>
        <h2>Staff Profile</h2>
        <img src="https://via.placeholder.com/180x180?text=Staff" alt="Staff" style={{borderRadius:'50%'}} />
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <strong>Name</strong>
            <div>Nguyen Van Staff</div>
          </div>
          <div className="profile-info-card">
            <strong>Email</strong>
            <div>staff@fec.com</div>
          </div>
          <div className="profile-info-card">
            <strong>Role</strong>
            <div>Station Staff</div>
          </div>
          <div className="profile-info-card">
            <strong>Phone</strong>
            <div>0123-456-789</div>
          </div>
          <div className="profile-info-card">
            <strong>Address</strong>
            <div>123 Main St, City</div>
          </div>
          <div className="profile-info-card">
            <strong>Joined</strong>
            <div>2024-01-15</div>
          </div>
          <div className="profile-info-card">
            <strong>Employee ID</strong>
            <div>FEC-STA-0097</div>
          </div>
          <div className="profile-info-card">
            <strong>Station</strong>
            <div>EV Station 03 - District Center</div>
          </div>
          <div className="profile-info-card">
            <strong>Shifts</strong>
            <div>Mon–Fri, 08:00–16:00</div>
          </div>
          <div className="profile-info-card">
            <strong>Last Login</strong>
            <div>2025-10-21 17:24</div>
          </div>
          <div className="profile-info-card">
            <strong>Certifications</strong>
            <div>EV Safety L2, Customer Service</div>
          </div>
          <div className="profile-info-card">
            <strong>Emergency Contact</strong>
            <div>Tran Thi B (Spouse) – 0987-654-321</div>
          </div>
        </div>
      </div>
    </div>
  );
}
