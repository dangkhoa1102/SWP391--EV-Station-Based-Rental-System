import React, { useState } from 'react';
import '../../styles/modals.css';

export default function VehicleDetailsModal({ open, vehicle, onClose, onEdit, onTransfer, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBattery, setEditedBattery] = useState('');
  const [editedTech, setEditedTech] = useState('');
  const [editedIssue, setEditedIssue] = useState('');
  const [editedIsAvailable, setEditedIsAvailable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!open || !vehicle) return null;

  // Use the provided vehicle image; it will commonly be a PNG (placeholder URLs are PNG by default)
  const imgSrc = vehicle.img;

  const handleEditClick = () => {
    setEditedBattery(vehicle.battery ?? '');
    setEditedTech(vehicle.tech ?? '');
    setEditedIssue(vehicle.issue ?? '');
    setEditedIsAvailable(vehicle.isAvailable !== false && vehicle.isAvailable !== 0);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    
    setIsSaving(true);
    try {
      await onUpdate(vehicle.id, {
        battery: editedBattery,
        tech: editedTech,
        issue: editedIssue,
        isAvailable: editedIsAvailable
      });
      setIsEditing(false);
    } catch (error) {
      alert(error?.message || 'Failed to update vehicle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedBattery('');
    setEditedTech('');
    setEditedIssue('');
    setEditedIsAvailable(true);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div
        className="modal-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'min(840px, 95vw)',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <span className="close-btn" onClick={onClose}>&times;</span>

        {/* Faded background image */}
        <img
          src={imgSrc}
          alt={vehicle.name}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.15,
            filter: 'grayscale(10%)',
            pointerEvents: 'none',
            borderRadius: 12
          }}
        />

        {/* Foreground content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 24, flexWrap: 'wrap', padding: 8 }}>
          <div style={{ flex: '1 1 260px', minWidth: 240 }}>
            <h3 style={{ marginTop: 4 }}>{vehicle.name}</h3>
            <div style={{ color: '#555', margin: '6px 0 12px' }}>{vehicle.desc || 'No description provided.'}</div>

            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Detail:</strong>
              <div>{vehicle.detail || 'N/A'}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Station:</strong> {vehicle.stationName || (vehicle.stationId ? `ID ${String(vehicle.stationId).slice(0, 8)}…` : 'Unknown')}
            </div>

            {/* Battery - Editable */}
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Battery:</strong> 
              {isEditing ? (
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={editedBattery} 
                  onChange={e => setEditedBattery(e.target.value)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '80px'
                  }}
                />
              ) : (
                <span> {vehicle.battery ?? 'N/A'}%</span>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Capacity:</strong> {vehicle.capacity != null ? `${vehicle.capacity} kWh` : 'N/A'}
            </div>

            {/* Condition - Editable */}
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Condition:</strong> 
              {isEditing ? (
                <input 
                  type="text"
                  value={editedTech} 
                  onChange={e => setEditedTech(e.target.value)}
                  placeholder="e.g., Good, Available"
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '150px'
                  }}
                />
              ) : (
                <span> {vehicle.tech ?? 'N/A'}</span>
              )}
            </div>

            {/* Active Status - Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Active Status:</strong>
              {isEditing ? (
                <label style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={editedIsAvailable}
                    onChange={e => setEditedIsAvailable(e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    {editedIsAvailable ? '✅ Available' : '❌ Unavailable'}
                  </span>
                </label>
              ) : (
                <span style={{ marginLeft: '8px', fontWeight: '600', color: vehicle.isAvailable !== false && vehicle.isAvailable !== 0 ? '#10b981' : '#ef4444' }}>
                  {vehicle.isAvailable !== false && vehicle.isAvailable !== 0 ? '✅ Available' : '❌ Unavailable'}
                </span>
              )}
            </div>

            {/* Issue - Editable */}
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10 }}>
              <strong>Issue:</strong> 
              {isEditing ? (
                <textarea
                  value={editedIssue} 
                  onChange={e => setEditedIssue(e.target.value)}
                  placeholder="Describe any issues..."
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '100%',
                    minHeight: '60px',
                    resize: 'vertical',
                    display: 'block'
                  }}
                />
              ) : (
                <span> {vehicle.issue ?? 'None'}</span>
              )}
            </div>
          </div>

          <div style={{ flex: '1 1 300px', minWidth: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={imgSrc}
              alt={`${vehicle.name} preview`}
              style={{ width: '100%', maxWidth: 380, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          display: 'flex', 
          gap: '12px', 
          padding: '16px 8px 8px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '10px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                <i className="fas fa-save"></i> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  padding: '10px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </>
          ) : (
            <>
              {onUpdate && (
                <button
                  onClick={handleEditClick}
                  style={{
                    padding: '10px 24px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-edit"></i> Edit Vehicle
                </button>
              )}
              {onTransfer && (
                <button
                  onClick={() => {
                    onClose();
                    onTransfer();
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  >
                  <i className="fas fa-exchange-alt"></i> Transfer Station
                </button>
              )}
              {onDelete && (
                <button
                  onClick={async () => {
                    if (!confirm('Delete this vehicle?')) return
                    try {
                      await onDelete(vehicle.id || vehicle.Id || vehicle.carId)
                      onClose && onClose()
                    } catch (err) {
                      alert(err?.message || 'Delete failed')
                    }
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-trash"></i> Delete Vehicle
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
