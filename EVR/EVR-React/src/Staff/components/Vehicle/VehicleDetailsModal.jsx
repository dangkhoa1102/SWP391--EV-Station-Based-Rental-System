import React from 'react';
import '../../styles/modals.css';

export default function VehicleDetailsModal({ open, vehicle, onClose }) {
  if (!open || !vehicle) return null;

  // Use the provided vehicle image; it will commonly be a PNG (placeholder URLs are PNG by default)
  const imgSrc = vehicle.img;

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
              <strong>Battery:</strong> {vehicle.battery ?? 'N/A'}%
            </div>
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10, marginBottom: 10 }}>
              <strong>Condition:</strong> {vehicle.tech ?? 'N/A'}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.85)', padding: 12, borderRadius: 10 }}>
              <strong>Issue:</strong> {vehicle.issue ?? 'None'}
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
      </div>
    </div>
  );
}
