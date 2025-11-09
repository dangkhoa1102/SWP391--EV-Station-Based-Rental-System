import React from 'react';
import { PLACEHOLDER } from '../../../../utils/placeholder';

export default function UserCard({ user, onClick }) {
  const fullName = user.fullName || user.FullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const email = user.email || user.Email || '—';
  const role = user.role || user.Role || user.userRole || 'Customer';
  const avatar = user.avatarUrl || user.AvatarUrl || PLACEHOLDER.avatar(fullName.charAt(0));
  const phone = user.phoneNumber || user.PhoneNumber || user.phone || '—';

  return (
    <div className="user-card" onClick={onClick}>
      <img src={avatar} alt={fullName} className="user-avatar" />
      <div className="user-info">
        <div className="user-name">{fullName}</div>
        <div className="user-email">{email}</div>
        <div className="user-role">{role}</div>
        {phone !== '—' && <div className="user-phone">{phone}</div>}
      </div>
    </div>
  );
}
