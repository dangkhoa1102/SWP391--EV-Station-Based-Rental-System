// src/components/Vehicle/UpdateVehicleModal.jsx
import React, { useEffect, useState } from 'react';

export default function UpdateVehicleModal({ open, onClose, vehicle, onSubmit }) {
  const [battery, setBattery] = useState('');
  const [tech, setTech] = useState('');
  const [issue, setIssue] = useState('');

  useEffect(() => {
    if (vehicle) {
      setBattery(vehicle.battery ?? '');
      setTech(vehicle.tech ?? '');
      setIssue(vehicle.issue ?? '');
    }
  }, [vehicle]);

  if (!open || !vehicle) return null;

  function handleSubmit() {
    onSubmit(vehicle.id, { battery, tech, issue });
    onClose();
  }

  return (
    <div className="vehicle-modal-overlay" style={{display:'flex'}}>
      <div className="vehicle-modal-content">
        <span className="vehicle-modal-close" onClick={onClose}>&times;</span>
        <h3>Update Vehicle Status / Report Issue</h3>
        <label>Battery Status</label>
        <input value={battery} onChange={e=>setBattery(e.target.value)} placeholder="e.g. 80" />
        <label>Condition</label>
        <select value={tech} onChange={e=>setTech(e.target.value)}>
          <option>Open</option>
          <option>Running</option>
          <option>Rented</option>
          <option>Maintained</option>
        </select>
        <label>Issue</label>
        <textarea value={issue} onChange={e=>setIssue(e.target.value)} />
        <div style={{display:'flex', justifyContent:'flex-end'}}>
          <button onClick={handleSubmit}>Submit Update</button>
        </div>
      </div>
    </div>
  );
}
