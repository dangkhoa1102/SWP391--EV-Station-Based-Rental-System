// src/components/Vehicle/AddVehicleModal.jsx
import React, { useState } from 'react';
import '../../styles/modals.css';

export default function AddVehicleModal({ open, onClose, onSubmit, stationId }) {
  // API payload fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState('');
  const [rentalPricePerHour, setRentalPricePerHour] = useState('');
  const [rentalPricePerDay, setRentalPricePerDay] = useState('');
  const [seats, setSeats] = useState('4');
  const [carImage, setCarImage] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleAdd() {
    setError('')
    if (!stationId) {
      setError('Please select a station before creating a vehicle.')
      return
    }
    // Required fields per API contract
    if (!brand.trim() || !model.trim() || !licensePlate.trim() || !year || !batteryCapacity || !currentBatteryLevel || !rentalPricePerHour || !rentalPricePerDay || !seats) {
      setError('Please fill all required fields: Brand, Model, Year, License Plate, Battery Capacity, Current Battery, Seats, Price/hour, Price/day.')
      return
    }
    // Constraints
    const yearNum = Number(year)
    const capNum = Number(batteryCapacity)
    const battNum = Number(currentBatteryLevel)
    const priceHour = Number(rentalPricePerHour)
    const priceDay = Number(rentalPricePerDay)
    const seatsNum = Number(seats)
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Year must be between 1900 and 2100.')
      return
    }
    if (!Number.isFinite(capNum) || capNum < 1 || capNum > 1000) {
      setError('Battery Capacity must be between 1 and 1000 (kWh).')
      return
    }
    if (!Number.isFinite(battNum) || battNum < 0 || battNum > 100) {
      setError('Current Battery must be between 0 and 100 (%).')
      return
    }
    if (!Number.isFinite(priceHour) || priceHour <= 0 || !Number.isFinite(priceDay) || priceDay <= 0) {
      setError('Rental prices must be positive numbers.')
      return
    }
    if (!Number.isFinite(seatsNum) || seatsNum < 2 || seatsNum > 50) {
      setError('Seats must be between 2 and 50.')
      return
    }
    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      color: color || undefined,
      licensePlate: licensePlate.trim(),
      batteryCapacity: capNum,
      currentBatteryLevel: battNum,
      rentalPricePerHour: priceHour,
      rentalPricePerDay: priceDay,
      currentStationId: stationId,
      seats: seatsNum,
      carImage,
      description: description || undefined
    }
    try {
      await onSubmit(payload)
      // Reset and close on success
      setBrand(''); setModel(''); setYear(''); setColor(''); setLicensePlate('');
      setBatteryCapacity(''); setCurrentBatteryLevel(''); setRentalPricePerHour(''); setRentalPricePerDay('');
      setSeats('4'); setCarImage(null); setDescription('');
      onClose()
    } catch (e) {
      setError(e?.message || 'Failed to create vehicle')
    }
  }

  return (
    <div className="modal-overlay" style={{display:'flex'}}>
      <div className="modal-content" style={{maxWidth: '600px', width: '90%', maxHeight: '85vh', overflow: 'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{marginTop: 0, marginBottom: '16px'}}>Add Vehicle</h3>
        {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand *" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={model} onChange={e=>setModel(e.target.value)} placeholder="Model *" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={year} onChange={e=>setYear(e.target.value)} placeholder="Year *" type="number" min={1900} max={2100} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={color} onChange={e=>setColor(e.target.value)} placeholder="Color" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={licensePlate} onChange={e=>setLicensePlate(e.target.value)} placeholder="License Plate *" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={batteryCapacity} onChange={e=>setBatteryCapacity(e.target.value)} placeholder="Battery Capacity (kWh) *" type="number" min={0} max={100} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={currentBatteryLevel} onChange={e=>setCurrentBatteryLevel(e.target.value)} placeholder="Current Battery (%) *" type="number" min={0} max={100} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={rentalPricePerHour} onChange={e=>setRentalPricePerHour(e.target.value)} placeholder="Price / hour *" type="number" step="0.01" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={rentalPricePerDay} onChange={e=>setRentalPricePerDay(e.target.value)} placeholder="Price / day *" type="number" step="0.01" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={seats} onChange={e=>setSeats(e.target.value)} placeholder="Seats *" type="number" min={2} max={50} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <label style={{display:'flex', flexDirection:'column', gap:6, gridColumn: '1 / -1', fontSize:'14px', color:'#333'}}>
            Vehicle Image (optional)
            <input type="file" accept="image/*" onChange={e => setCarImage(e.target.files && e.target.files[0] ? e.target.files[0] : null)} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px'}} />
          </label>
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px', gridColumn: '1 / -1'}} />
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap: '10px'}}>
          <button onClick={onClose} style={{
            padding: '10px 24px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={handleAdd} style={{
            padding: '10px 24px',
            background: '#43a047',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>Create Vehicle</button>
        </div>
      </div>
    </div>
  );
}
