import React, { useState } from 'react';
import VehicleCard from './VehicleCard';
import AddVehicleModal from './AddVehicleModal';
import UpdateVehicleModal from './UpdateVehicleModal';
import VehicleDetailsModal from './VehicleDetailsModal';
import StationSlotCard from './StationSlotCard';
import TransferVehicleModal from './TransferVehicleModal';
import './Vehicle.css';

export default function VehicleSection({ vehicles, onAdd, onRemove, onUpdate, stationId, canDelete = true, stationSlots = null, onTransferCar, stations }) {
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferVehicle, setTransferVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter vehicles by search query
  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (v.name || '').toLowerCase();
    const model = (v.model || '').toLowerCase();
    const brand = (v.brand || '').toLowerCase();
    const licensePlate = (v.licensePlate || '').toLowerCase();
    return name.includes(query) || model.includes(query) || brand.includes(query) || licensePlate.includes(query);
  });

  function openForUpdate(v) {
    setSelected(v);
    setUpdateOpen(true);
  }
  function openDetails(v) {
    setSelected(v);
    setDetailsOpen(true);
  }
  
  function openTransfer(v) {
    setTransferVehicle(v);
    setTransferOpen(true);
  }

  const handleTransferSubmit = async (vehicle, targetStationId, reason) => {
    if (onTransferCar) {
      await onTransferCar(vehicle, targetStationId, reason);
    }
  };

  return (
    <div id="vehicle" className="section">
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap'}}>
        <button className="vehicle-add-btn" onClick={() => setAddOpen(true)}>
          <i className="fas fa-plus"></i> Add Vehicle
        </button>
        
        <input 
          type="text" 
          placeholder="Search by name, model, brand, or plate..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '250px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />

        {stationId && stationSlots && (
          <StationSlotCard stationSlots={stationSlots} />
        )}
      </div>

      <div className="vehicle-grid" id="vehicleGrid">
        {(!filteredVehicles || filteredVehicles.length === 0) && (
          <div style={{padding:'12px 8px', color:'#555'}}>
            {searchQuery ? 'No vehicles match your search.' : 'No vehicles available to display.'}
          </div>
        )}
        {filteredVehicles.map((v, i) => (
          <div key={v.id || v.licensePlate || `${v.name}-${v.stationId || ''}-${i}`}>
            <VehicleCard 
              vehicle={v} 
              onOpen={() => openDetails(v)}
            />
          </div>
        ))}
      </div>

  <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} stationId={stationId} />
      <UpdateVehicleModal 
        open={updateOpen} 
        onClose={() => setUpdateOpen(false)} 
        vehicle={selected} 
        onSubmit={onUpdate} 
      />
      <VehicleDetailsModal 
        open={detailsOpen} 
        vehicle={selected} 
        onClose={() => setDetailsOpen(false)}
        onEdit={selected ? () => openForUpdate(selected) : null}
        onTransfer={onTransferCar && selected ? () => openTransfer(selected) : null}
        onUpdate={onUpdate}
      />
      <TransferVehicleModal
        open={transferOpen}
        onClose={() => {
          setTransferOpen(false);
          setTransferVehicle(null);
        }}
        vehicle={transferVehicle}
        stations={stations || []}
        currentStationId={stationId}
        onSubmit={handleTransferSubmit}
      />
    </div>
  );
}
