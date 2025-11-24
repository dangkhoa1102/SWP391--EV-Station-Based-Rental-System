import React, { useState } from 'react';
import VehicleCard from './VehicleCard';
import AddVehicleModal from './AddVehicleModal';
import UpdateVehicleModal from './UpdateVehicleModal';
import VehicleDetailsModal from './VehicleDetailsModal';
import StationSlotCard from './StationSlotCard';
import VehicleTable from './VehicleTable';
import './Vehicle.css';

export default function VehicleSection({ vehicles, onAdd, onRemove, onUpdate, stationId, canDelete = true, stationSlots = null }) {
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
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

  return (
    <div id="vehicle" className="section">
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap'}}>
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

      <div>
        <VehicleTable
          vehicles={filteredVehicles}
          search={searchQuery}
          setSearch={setSearchQuery}
          onRowClick={(v) => openDetails(v)}
          onEdit={(idOrObj) => {
            const v = typeof idOrObj === 'object' ? idOrObj : filteredVehicles.find(x => String(x.id) === String(idOrObj))
            if (v) {
              // Open the small update modal (same as Edit on card)
              setSelected(v)
              setUpdateOpen(true)
            }
          }}
          onRemove={(idOrObj) => {
            const id = typeof idOrObj === 'object' ? (idOrObj.id || idOrObj.carId) : idOrObj
            if (id) onRemove(id)
          }}
          canDelete={canDelete}
        />
      </div>

  <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAdd} stationId={stationId} />
      <UpdateVehicleModal open={updateOpen} onClose={() => setUpdateOpen(false)} vehicle={selected} onSubmit={onUpdate} />
      <VehicleDetailsModal 
        open={detailsOpen} 
        vehicle={selected} 
        onClose={() => setDetailsOpen(false)}
        onEdit={selected ? () => openForUpdate(selected) : null}
        onUpdate={onUpdate}
      />
    </div>
  );
}
