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
  const [rentalPricePerDate, setRentalPricePerDate] = useState('');
  const [seats, setSeats] = useState('');
  const [carImage, setCarImage] = useState(null);
  const [error, setError] = useState('');

  // File upload constraints
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (!open) return null;

  async function handleAdd() {
    setError('')
    if (!stationId) {
      setError('Please select a station before creating a vehicle.')
      return
    }
    // Required fields per API contract
    if (!brand.trim() || !model.trim() || !color.trim() || !licensePlate.trim() || !year || !batteryCapacity || !currentBatteryLevel || !rentalPricePerHour || !rentalPricePerDate || !seats) {
      setError('Please fill all required fields: Brand, Model, Color, Year, License Plate, Battery Capacity, Current Battery, Seats, Price/hour, Price/day.')
      return
    }
    // Constraints
    const yearNum = Number(year)
    const capNum = Number(batteryCapacity)
    const battNum = Number(currentBatteryLevel)
    const priceHour = Number(rentalPricePerHour)
    const priceDay = Number(rentalPricePerDate)
    const seatsNum = Number(seats)
    
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Year must be between 1900 and 2100.')
      return
    }
    if (!Number.isFinite(capNum) || capNum < 0 || capNum > 10000) {
      setError('Battery Capacity must be a positive number (kWh).')
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
    if (!Number.isFinite(seatsNum) || seatsNum <= 0) {
      setError('Seats must be a positive number.')
      return
    }

    // Validate file if provided
    if (carImage) {
      if (!ALLOWED_TYPES.includes(carImage.type)) {
        setError(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
        return
      }
      if (carImage.size > MAX_FILE_SIZE) {
        setError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Current: ${(carImage.size / 1024 / 1024).toFixed(2)}MB`)
        return
      }
    }
    const formData = new FormData()
    formData.append('Brand', brand.trim())
    formData.append('Model', model.trim())
    formData.append('Year', yearNum)
    formData.append('Color', color.trim())
    formData.append('LicensePlate', licensePlate.trim())
    formData.append('BatteryCapacity', capNum)
    formData.append('CurrentBatteryLevel', battNum)
    formData.append('RentalPricePerHour', priceHour)
    formData.append('RentalPricePerDay', priceDay)
    formData.append('Seats', seatsNum)
    formData.append('CurrentStationId', stationId)
    if (carImage) {
      // Append file with filename (3 parameters like user API does it)
      formData.append('CarImage', carImage, carImage.name)
      console.log('📸 Added CarImage:', carImage.name, 'size:', carImage.size, 'type:', carImage.type)
    }

    try {
      await onSubmit(formData)
      // Reset and close on success
      setBrand(''); setModel(''); setYear(''); setColor(''); setLicensePlate('');
      setBatteryCapacity(''); setCurrentBatteryLevel(''); setRentalPricePerHour(''); setRentalPricePerDate('');
      setSeats(''); setCarImage(null);
      onClose()
    } catch (e) {
      console.error('Create vehicle error:', e)
      // Prefer server-provided message when available (response body),
      // fallback to generic error.message otherwise.
      const resp = e?.response?.data
      let msg = e?.message || 'Failed to create vehicle'
      if (resp) {
        // Common patterns: { message: '...', data: ... } or { errors: {...} }
        if (typeof resp === 'string') msg = resp
        else if (resp.message) msg = resp.message
        else if (resp.errors) {
          try {
            // If errors is an object of arrays, pick the first message
            const firstKey = Object.keys(resp.errors)[0]
            const firstVal = resp.errors[firstKey]
            msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal)
          } catch (ex) {
            msg = JSON.stringify(resp.errors)
          }
        } else {
          // Fallback: stringify the response body
          msg = JSON.stringify(resp)
        }
      }

      setError(msg || 'Failed to create vehicle')
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
          <input value={color} onChange={e=>setColor(e.target.value)} placeholder="Color *" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={licensePlate} onChange={e=>setLicensePlate(e.target.value)} placeholder="License Plate *" style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={batteryCapacity} onChange={e=>setBatteryCapacity(e.target.value)} placeholder="Battery Capacity (kWh) *" type="number" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={currentBatteryLevel} onChange={e=>setCurrentBatteryLevel(e.target.value)} placeholder="Current Battery (%) *" type="number" min={0} max={100} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={rentalPricePerHour} onChange={e=>setRentalPricePerHour(e.target.value)} placeholder="Price / hour *" type="number" step="0.01" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={rentalPricePerDate} onChange={e=>setRentalPricePerDate(e.target.value)} placeholder="Price / day *" type="number" step="0.01" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input value={seats} onChange={e=>setSeats(e.target.value)} placeholder="Seats *" type="number" min={1} style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px'}} />
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => {
              const file = e.target.files?.[0] || null
              if (file) {
                if (!ALLOWED_TYPES.includes(file.type)) {
                  setError(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`)
                  setCarImage(null)
                  return
                }
                if (file.size > MAX_FILE_SIZE) {
                  setError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
                  setCarImage(null)
                  return
                }
                setError('')
                setCarImage(file)
              } else {
                setCarImage(null)
              }
            }} 
            placeholder="Car Image" 
            style={{padding:'10px', border:'1px solid #ddd', borderRadius:'6px', fontSize:'14px', gridColumn: '1 / -1'}} 
          />
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
