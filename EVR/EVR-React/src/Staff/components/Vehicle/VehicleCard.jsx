// src/components/Vehicle/VehicleCard.jsx
import React from 'react';

export default function VehicleCard({ vehicle, onOpen, onRemove, onOpenUpdate }) {
  return (
    <div className="vehicle-card" onClick={onOpen}>
      <button className="vehicle-remove-btn" onClick={(e) => { e.stopPropagation(); onRemove(vehicle.id); }}>&times;</button>
      <img src={vehicle.img} alt={vehicle.name} />
      <div className="vehicle-info">
        <div className="vehicle-title">{vehicle.name}</div>
        <div className="vehicle-battery">Battery: {vehicle.battery ?? 'N/A'}%</div>
        <div className="vehicle-tech">Condition: {vehicle.tech ?? 'N/A'}</div>
        <div className="vehicle-issue">Issue: {vehicle.issue ?? 'None'}</div>
      </div>
    </div>
  );
}
