import React from 'react';
import './Incident.css';

export default function IncidentCard({ incident, onClick }) {
  const getStatusBadge = (status) => {
    const styles = {
      Pending: { background: '#fef3c7', color: '#92400e', icon: 'fa-clock' },
      InProgress: { background: '#dbeafe', color: '#1e40af', icon: 'fa-spinner' },
      Resolved: { background: '#d1fae5', color: '#065f46', icon: 'fa-check-circle' }
    };
    const style = styles[status] || styles.Pending;
    
    return (
      <span style={{
        ...style,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <i className={`fas ${style.icon}`}></i>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="incident-card" onClick={() => onClick(incident)}>
      <div className="incident-card-header">
        <div className="incident-card-title">
          <i className="fas fa-exclamation-triangle" style={{color: '#f59e0b', marginRight: '8px'}}></i>
          <span>Incident #{incident.id?.slice(0, 8)}</span>
        </div>
        {getStatusBadge(incident.status)}
      </div>

      <div className="incident-card-body">
        <div className="incident-description">
          {incident.description}
        </div>

        <div className="incident-metadata">
          <div className="incident-meta-item">
            <i className="fas fa-calendar"></i>
            <span>{formatDate(incident.reportedAt)}</span>
          </div>
          
          {incident.bookingId && (
            <div className="incident-meta-item">
              <i className="fas fa-ticket-alt"></i>
              <span>Booking: {incident.bookingId.slice(0, 8)}...</span>
            </div>
          )}

          {incident.costIncurred != null && (
            <div className="incident-meta-item" style={{color: '#dc2626', fontWeight: '600'}}>
              <i className="fas fa-dollar-sign"></i>
              <span>{formatCurrency(incident.costIncurred)}</span>
            </div>
          )}

          {incident.images && incident.images.length > 0 && (
            <div className="incident-meta-item">
              <i className="fas fa-image"></i>
              <span>{incident.images.length} image{incident.images.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="incident-card-footer">
        <span className="incident-view-details">
          View Details <i className="fas fa-arrow-right"></i>
        </span>
      </div>
    </div>
  );
}
