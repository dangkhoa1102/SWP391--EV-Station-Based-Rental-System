import React, { useState } from 'react';
import VehicleCard from './VehicleCard';
import AddVehicleModal from './AddVehicleModal';
import UpdateVehicleModal from './UpdateVehicleModal';

export default function VehicleSection({ vehicles, onAdd, onRemove, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  function openForUpdate(v) {
    setSelected(v);
    setUpdateOpen(true);
  }

  return (
    <div id="vehicle" className="section">
      <button className="vehicle-add-btn" onClick={() => setAddOpen(true)}><i className="fas fa-plus"></i> Add Vehicle</button>

      <div className="vehicle-grid" id="vehicleGrid">
        {vehicles.map(v => (
          <div key={v.id}>
            <VehicleCard vehicle={v} onOpen={() => setSelected(v)} onRemove={onRemove} onOpenUpdate={() => openForUpdate(v)} />
          </div>
        ))}
      </div>

      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} />
      <UpdateVehicleModal open={updateOpen} onClose={() => setUpdateOpen(false)} vehicle={selected} onSubmit={onUpdate} />
    </div>
  );
}
