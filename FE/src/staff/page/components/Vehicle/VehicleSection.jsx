import React, { useState } from 'react';
import VehicleCard from './VehicleCard';
import AddVehicleModal from './AddVehicleModal';
import UpdateVehicleModal from './UpdateVehicleModal';
import VehicleDetailsModal from './VehicleDetailsModal';
import './Vehicle.css';

export default function VehicleSection({ vehicles, onAdd, onRemove, onUpdate, stationId }) {
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  function openForUpdate(v) {
    setSelected(v);
    setUpdateOpen(true);
  }
  function openDetails(v) {
    setSelected(v);
    setDetailsOpen(true);
  }

  return (
    <div id="vehicle" className="section">
      <button className="vehicle-add-btn" onClick={() => setAddOpen(true)}><i className="fas fa-plus"></i> Add Vehicle</button>

      <div className="vehicle-grid" id="vehicleGrid">
        {(!vehicles || vehicles.length === 0) && (
          <div style={{padding:'12px 8px', color:'#555'}}>No vehicles available to display.</div>
        )}
        {vehicles.map(v => (
          <div key={v.id}>
            <VehicleCard vehicle={v} onOpen={() => openDetails(v)} onRemove={onRemove} onOpenUpdate={() => openForUpdate(v)} />
          </div>
        ))}
      </div>

  <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} stationId={stationId} />
      <UpdateVehicleModal open={updateOpen} onClose={() => setUpdateOpen(false)} vehicle={selected} onSubmit={onUpdate} />
      <VehicleDetailsModal open={detailsOpen} vehicle={selected} onClose={() => setDetailsOpen(false)} />
    </div>
  );
}
