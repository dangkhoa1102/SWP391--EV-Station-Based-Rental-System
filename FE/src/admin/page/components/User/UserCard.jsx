import React from 'react';

export default function UserCard({ user, onClick }) {
  const fullName = user.fullName || user.FullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const email = user.email || user.Email || '—';
  const role = user.role || user.Role || user.userRole || 'Customer';
  const phone = user.phoneNumber || user.PhoneNumber || user.phone || '—';

  return (
    <div className="user-card" onClick={onClick}>
      {/* Icon placeholder instead of user image (prevents broken image icon) */}
      <div className="user-avatar" aria-hidden style={{background: '#eceff1', color: '#607d8b', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <div className="user-info">
        <div className="user-name">{fullName}</div>
        <div className="user-email">{email}</div>
        <div className="user-role">{role}</div>
        {phone !== '—' && <div className="user-phone">{phone}</div>}
      </div>
    </div>
  );
}
