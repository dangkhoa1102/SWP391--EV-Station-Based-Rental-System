import React, { useState } from 'react';
import '../../styles/modals.css';

export default function IncidentDetailsModal({ open, incident, onClose, onUpdate, onResolve, onDelete, canDelete = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [costIncurred, setCostIncurred] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open || !incident) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
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

  const handleEdit = () => {
    setStatus(incident.status || 'Pending');
    setResolutionNotes(incident.resolutionNotes || '');
    setCostIncurred(incident.costIncurred || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (status) formData.append('status', status);
      if (resolutionNotes) formData.append('resolutionNotes', resolutionNotes);
      if (costIncurred) formData.append('costIncurred', costIncurred);

      await onUpdate(incident.id, formData);
      setIsEditing(false);
    } catch (e) {
      alert(e?.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!window.confirm('Mark this incident as resolved?')) return;
    
    setLoading(true);
    try {
      await onResolve(incident.id, resolutionNotes, costIncurred || 0);
      onClose();
    } catch (e) {
      alert(e?.message || 'Failed to resolve incident');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await onDelete(incident.id);
      onClose();
    } catch (e) {
      alert(e?.message || 'Failed to delete incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        background: '#fef9e7',
        border: '2px solid #d4af37',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        <span className="close-btn" onClick={onClose}>&times;</span>

        {/* Paper Header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '3px double #d4af37',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontFamily: 'Georgia, serif',
            color: '#1f2937',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            INCIDENT REPORT
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
            fontFamily: 'Georgia, serif'
          }}>
            Official Documentation
          </p>
          <div style={{
            display: 'inline-block',
            marginTop: '12px',
            padding: '6px 16px',
            background: incident.status === 'Resolved' ? '#d1fae5' : incident.status === 'InProgress' ? '#dbeafe' : '#fef3c7',
            color: incident.status === 'Resolved' ? '#065f46' : incident.status === 'InProgress' ? '#1e40af' : '#92400e',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            border: `2px solid ${incident.status === 'Resolved' ? '#10b981' : incident.status === 'InProgress' ? '#3b82f6' : '#f59e0b'}`
          }}>
            STATUS: {incident.status?.toUpperCase()}
          </div>
        </div>

        {/* Report Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
          fontFamily: 'Georgia, serif'
        }}>
          <div>
            <strong style={{color: '#4b5563', fontSize: '14px'}}>Report ID:</strong>
            <div style={{color: '#1f2937', marginTop: '4px', fontFamily: 'monospace'}}>
              {incident.id}
            </div>
          </div>
          
          <div>
            <strong style={{color: '#4b5563', fontSize: '14px'}}>Reported Date:</strong>
            <div style={{color: '#1f2937', marginTop: '4px'}}>
              {formatDate(incident.reportedAt)}
            </div>
          </div>

          <div>
            <strong style={{color: '#4b5563', fontSize: '14px'}}>Booking Reference:</strong>
            <div style={{color: '#1f2937', marginTop: '4px', fontFamily: 'monospace'}}>
              {incident.bookingId?.slice(0, 16)}...
            </div>
          </div>

          {incident.stationId && (
            <div>
              <strong style={{color: '#4b5563', fontSize: '14px'}}>Station ID:</strong>
              <div style={{color: '#1f2937', marginTop: '4px', fontFamily: 'monospace'}}>
                {incident.stationId.slice(0, 16)}...
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <strong style={{
            color: '#4b5563',
            fontSize: '16px',
            display: 'block',
            marginBottom: '12px',
            fontFamily: 'Georgia, serif'
          }}>
            Incident Description:
          </strong>
          <p style={{
            color: '#1f2937',
            lineHeight: '1.6',
            margin: 0,
            fontSize: '15px',
            whiteSpace: 'pre-wrap'
          }}>
            {incident.description}
          </p>
        </div>

        {/* Images Section */}
        {incident.images && incident.images.length > 0 && (
          <div style={{marginBottom: '24px'}}>
            <strong style={{
              color: '#4b5563',
              fontSize: '16px',
              display: 'block',
              marginBottom: '12px',
              fontFamily: 'Georgia, serif'
            }}>
              Evidence Photos ({incident.images.length}):
            </strong>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {incident.images.map((img, index) => (
                <a
                  key={index}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{display: 'block'}}
                >
                  <img
                    src={img}
                    alt={`Evidence ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #d4af37',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Section */}
        {isEditing ? (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <strong style={{fontSize: '16px', display: 'block', marginBottom: '12px'}}>
              Update Incident:
            </strong>
            
            <div style={{marginBottom: '12px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500'}}>
                Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              >
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div style={{marginBottom: '12px'}}>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500'}}>
                Resolution Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                placeholder="Enter resolution details..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500'}}>
                Cost Incurred (VND):
              </label>
              <input
                type="number"
                value={costIncurred}
                onChange={(e) => setCostIncurred(e.target.value)}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {incident.resolutionNotes && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#d1fae5',
                borderRadius: '8px',
                border: '1px solid #10b981'
              }}>
                <strong style={{
                  color: '#065f46',
                  fontSize: '16px',
                  display: 'block',
                  marginBottom: '12px',
                  fontFamily: 'Georgia, serif'
                }}>
                  Resolution Notes:
                </strong>
                <p style={{
                  color: '#047857',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {incident.resolutionNotes}
                </p>
              </div>
            )}

            {incident.costIncurred != null && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '1px solid #dc2626'
              }}>
                <strong style={{
                  color: '#991b1b',
                  fontSize: '16px',
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily: 'Georgia, serif'
                }}>
                  Cost Incurred:
                </strong>
                <div style={{
                  color: '#dc2626',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  fontFamily: 'Georgia, serif'
                }}>
                  {formatCurrency(incident.costIncurred)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '20px',
          borderTop: '2px solid #e5e7eb',
          flexWrap: 'wrap'
        }}>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <i className="fas fa-save"></i> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginRight: 'auto'
                  }}
                >
                  <i className="fas fa-trash"></i> Delete
                </button>
              )}
              
              {incident.status !== 'Resolved' && (
                <>
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="fas fa-check-circle"></i> {loading ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
