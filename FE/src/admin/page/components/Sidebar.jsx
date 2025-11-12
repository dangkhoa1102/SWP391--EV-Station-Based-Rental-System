import React, { useEffect } from 'react';
import './Sidebar.css';

export default function Sidebar({ onSelect, isOpen, toggleSidebar }) {
  // ✅ Add/remove CSS class to <body> for push effect
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [isOpen]);

  return (
    <>
      {/* Optional invisible area to close sidebar when clicked outside */}
      {isOpen && <div className="sidebar-collider" onClick={toggleSidebar}></div>}

      {/* Sidebar container */}
      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <h2>FEC Admin</h2>
        <div style={{ marginTop: '60px' }}></div>

        <button onClick={() => onSelect('booking')}>
          <i className="fas fa-calendar-alt"></i> Booking
        </button>
        <button onClick={() => onSelect('vehicle')}>
          <i className="fas fa-car"></i> Vehicle
        </button>
        <button onClick={() => onSelect('user')}>
          <i className="fas fa-users"></i> User
        </button>
        <button onClick={() => onSelect('staff')}>
          <i className="fas fa-user-tie"></i> Staff
        </button>
        <button onClick={() => onSelect('incident')}>
          <i className="fas fa-exclamation-triangle"></i> Incident
        </button>
        <button onClick={() => onSelect('profile')}>
          <i className="fas fa-user-circle"></i> Profile
        </button>
      </div>
    </>
  );
}
