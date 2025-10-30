// src/components/Vehicle/AddVehicleModal.jsx
import React, { useState } from 'react';
import './Vehicle.css';

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
  const [rentalPricePerDate, setRentalPricePerDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
    if (!brand.trim() || !model.trim() || !licensePlate.trim() || !year || !batteryCapacity || !currentBatteryLevel || !rentalPricePerHour || !rentalPricePerDate) {
      setError('Please fill all required fields: Brand, Model, Year, License Plate, Battery Capacity, Current Battery, Price/hour, Price/day.')
      return
    }
    // Constraints
    const yearNum = Number(year)
    const capNum = Number(batteryCapacity)
    const battNum = Number(currentBatteryLevel)
    const priceHour = Number(rentalPricePerHour)
    const priceDay = Number(rentalPricePerDate)
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Year must be between 1900 and 2100.')
      return
    }
    if (!Number.isFinite(capNum) || capNum < 0 || capNum > 100) {
      setError('Battery Capacity must be between 0 and 100 (kWh).')
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
    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      color: color || undefined,
      licensePlate: licensePlate.trim(),
      batteryCapacity: capNum,
      currentBatteryLevel: battNum,
      rentalPricePerHour: priceHour,
      rentalPricePerDate: priceDay,
      currentStationId: stationId,
      imageUrl: imageUrl || undefined,
      description: description || undefined
    }
    try {
      await onSubmit(payload)
      // Reset and close on success
      setBrand(''); setModel(''); setYear(''); setColor(''); setLicensePlate('');
      setBatteryCapacity(''); setCurrentBatteryLevel(''); setRentalPricePerHour(''); setRentalPricePerDate('');
      setImageUrl(''); setDescription('');
      onClose()
    } catch (e) {
      setError(e?.message || 'Failed to create vehicle')
    }
  }

  return (
    <div className="vehicle-modal-overlay" style={{display:'flex'}}>
      <div className="vehicle-modal-content">
        <span className="vehicle-modal-close" onClick={onClose}>&times;</span>
        <h3>Add Vehicle</h3>
        {error && <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:8}}>{error}</div>}
        <div className="form-grid">
          <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand *" />
          <input value={model} onChange={e=>setModel(e.target.value)} placeholder="Model *" />
          <input value={year} onChange={e=>setYear(e.target.value)} placeholder="Year *" type="number" min={1900} max={2100} />
          <input value={color} onChange={e=>setColor(e.target.value)} placeholder="Color" />
          <input value={licensePlate} onChange={e=>setLicensePlate(e.target.value)} placeholder="License Plate *" />
          <input value={batteryCapacity} onChange={e=>setBatteryCapacity(e.target.value)} placeholder="Battery Capacity (kWh) *" type="number" min={0} max={100} />
          <input value={currentBatteryLevel} onChange={e=>setCurrentBatteryLevel(e.target.value)} placeholder="Current Battery (%) *" type="number" min={0} max={100} />
          <input value={rentalPricePerHour} onChange={e=>setRentalPricePerHour(e.target.value)} placeholder="Price / hour *" type="number" step="0.01" min={0} />
          <input value={rentalPricePerDate} onChange={e=>setRentalPricePerDate(e.target.value)} placeholder="Price / day *" type="number" step="0.01" min={0} />
          <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="Image URL" />
          <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" />
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
          <button onClick={handleAdd}>Create</button>
        </div>
      </div>
    </div>
  );
}
