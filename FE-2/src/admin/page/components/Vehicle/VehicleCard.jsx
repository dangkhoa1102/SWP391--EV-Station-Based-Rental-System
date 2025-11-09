// src/components/Vehicle/VehicleCard.jsx
import React from 'react';

export default function VehicleCard({ vehicle, onOpen }) {
  return (
    <div className="vehicle-card" onClick={onOpen} style={{cursor: 'pointer'}}>
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
