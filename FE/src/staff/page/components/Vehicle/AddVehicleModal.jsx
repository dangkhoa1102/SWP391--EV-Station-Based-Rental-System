// src/components/Vehicle/AddVehicleModal.jsx
import React, { useState } from 'react';
import './Vehicle.css';

export default function AddVehicleModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [detail, setDetail] = useState('');
  const [img, setImg] = useState('');

  if (!open) return null;

  function handleAdd() {
    if (!name.trim()) return;
    const id = Date.now();
    onSubmit({ id, name, desc, detail, img: img || `https://via.placeholder.com/440x280?text=${encodeURIComponent(name)}` });
    setName(''); setDesc(''); setDetail(''); setImg('');
    onClose();
  }

  return (
    <div className="vehicle-modal-overlay" style={{display:'flex'}}>
      <div className="vehicle-modal-content">
        <span className="vehicle-modal-close" onClick={onClose}>&times;</span>
        <h3>Add Vehicle</h3>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Vehicle Name" />
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" />
        <input value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Detail" />
        <input value={img} onChange={e=>setImg(e.target.value)} placeholder="Image URL" />
        <button onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
}
