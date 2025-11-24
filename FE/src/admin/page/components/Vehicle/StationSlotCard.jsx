import React from 'react';

export default function StationSlotCard({ stationSlots }) {
  if (!stationSlots) return null;
  // Expect stationSlots: { totalSlots, carsCount }
  const totalSlots = stationSlots?.totalSlots ?? 0;
  const carsCount = stationSlots?.carsCount ?? 0;

  return (
    <div style={{
      padding: '8px 16px',
      background: '#f0f9ff',
      border: '1px solid #0ea5e9',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#0369a1'
    }}>
      <i className="fas fa-parking"></i> {totalSlots} Slot / {carsCount} Slot Taken
    </div>
  );
}

