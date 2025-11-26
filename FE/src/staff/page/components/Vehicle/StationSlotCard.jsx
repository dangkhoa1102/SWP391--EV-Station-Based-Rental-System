import React from 'react';

export default function StationSlotCard({ stationSlots }) {
  if (!stationSlots) return null;

  // API returns: totalCars = available slots, availableCars = total slots taken
  const availableSlots = stationSlots?.totalCars || 0;
  const slotsTaken = stationSlots?.availableCars || 0;

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
      {/* <i className="fas fa-parking"></i> {availableSlots} Slot / {slotsTaken} Slot Taken */}
      <i className="fas fa-parking"></i> {slotsTaken} Slot Taken / {availableSlots} Slot
    </div>
  );
}

