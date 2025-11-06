import React from 'react';

export default function DeletedUserCard({ user, onClick }) {
  const name = user.fullName || user.FullName || 'Unknown User';
  const email = user.email || user.Email || 'N/A';
  const role = user.userRole || user.role || user.Role || 'N/A';
  const deactivatedAt = user.deactivatedAt || 'Unknown';
  const daysDeactivated = user.daysDeactivated || 0;

  return (
    <div className="user-card deleted-user-card" onClick={onClick}>
      <div className="user-card-header">
        <div className="user-avatar deleted">
          <i className="fas fa-user-slash"></i>
        </div>
        <div className="user-info">
          <h4 className="user-name">{name}</h4>
          <p className="user-email">{email}</p>
        </div>
      </div>
      <div className="user-card-body">
        <div className="user-detail">
          <span className="label">Role:</span>
          <span className="value">{role}</span>
        </div>
        <div className="user-detail">
          <span className="label">Deleted:</span>
          <span className="value">{deactivatedAt}</span>
        </div>
        <div className="user-detail">
          <span className="label">Days Inactive:</span>
          <span className="value deleted-badge">{daysDeactivated} days</span>
        </div>
      </div>
      <div className="user-card-footer">
        <span className="user-status deleted-status">
          <i className="fas fa-ban"></i> Deleted
        </span>
      </div>
    </div>
  );
}
