// src/components/Vehicle/VehicleCard.jsx
import React from 'react';

export default function VehicleCard({ vehicle, onOpen, onRemove, onOpenUpdate, canDelete = true }) {
  return (
    <div className="vehicle-card" onClick={onOpen}>
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
        <button
          title="Edit"
          className="vehicle-edit-btn"
          onClick={(e) => { e.stopPropagation(); onOpenUpdate?.(vehicle); }}
          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
        >
          Edit
        </button>
        {canDelete && (
          <button
            title="Delete"
            className="vehicle-remove-btn"
            onClick={(e) => { e.stopPropagation(); onRemove(vehicle.id); }}
          >
            &times;
          </button>
        )}
      </div>
      <img src={vehicle.img} alt={vehicle.name} />
      <div className="vehicle-info">
        <div className="vehicle-title">{vehicle.name}</div>
        <div className="vehicle-station">Station: {vehicle.stationName || (vehicle.stationId ? `ID ${String(vehicle.stationId).slice(0, 8)}…` : 'Unknown')}</div>
        <div className="vehicle-battery">Battery: {vehicle.battery ?? 'N/A'}%</div>
  <div className="vehicle-capacity">Capacity: {vehicle.capacity != null ? `${vehicle.capacity} kWh` : 'N/A'}</div>
        <div className="vehicle-tech">Condition: {vehicle.tech ?? 'N/A'}</div>
        <div className="vehicle-issue">Issue: {vehicle.issue ?? 'None'}</div>
      </div>
    </div>
  );
}
