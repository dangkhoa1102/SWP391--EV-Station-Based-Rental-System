import React, { useState } from 'react';
import VehicleCard from './VehicleCard';
import AddVehicleModal from './AddVehicleModal';
import UpdateVehicleModal from './UpdateVehicleModal';
import VehicleDetailsModal from './VehicleDetailsModal';
import StationSlotCard from './StationSlotCard';
import TransferVehicleModal from './TransferVehicleModal';
import './Vehicle.css';

export default function VehicleSection({ vehicles, deletedVehicles = [], onAdd, onRemove, onUpdate, onRestore, stationId, canDelete = true, stationSlots = null, onTransferCar, stations }) {
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferVehicle, setTransferVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('active');

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

      {/* Tabs: Active / Deleted */}
      <div style={{display:'flex', gap:12, alignItems:'center', marginBottom:12}}>
        <button onClick={() => setTab('active')} style={{padding:'6px 12px', borderRadius:8, border: tab==='active' ? '2px solid #0ea5e9' : '1px solid #ddd', background: tab==='active' ? '#e6f7ff' : 'white', cursor: 'pointer', fontWeight: tab==='active' ? '600' : 'normal'}}>Active</button>
        <button onClick={() => setTab('deleted')} style={{padding:'6px 12px', borderRadius:8, border: tab==='deleted' ? '2px solid #f97316' : '1px solid #ddd', background: tab==='deleted' ? '#fff4e6' : 'white', cursor: 'pointer', fontWeight: tab==='deleted' ? '600' : 'normal'}}>Deleted ({deletedVehicles.length})</button>
      </div>

      <div className="vehicle-grid" id="vehicleGrid">
        {tab === 'active' && (!filteredVehicles || filteredVehicles.length === 0) && (
          <div style={{padding:'12px 8px', color:'#555'}}>
            {searchQuery ? 'No vehicles match your search.' : 'No vehicles available to display.'}
          </div>
        )}
        {tab === 'active' && filteredVehicles.map((v, i) => (
          <div key={v.id || v.licensePlate || `${v.name}-${v.stationId || ''}-${i}`}>
            <VehicleCard 
              vehicle={v} 
              onOpen={() => openDetails(v)}
            />
          </div>
        ))}
        {tab === 'deleted' && (deletedVehicles && deletedVehicles.length > 0 ? (
          deletedVehicles.map((v, i) => (
            <div key={(v.id||v.licensePlate||`${v.name}-${i}`)} style={{padding:'12px', border:'1px solid #eee', borderRadius:8, background:'#fff', display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
                <div>
                  <div style={{fontWeight:700}}>{v.name || v.model || 'Vehicle'}</div>
                  <div style={{color:'#666', fontSize:13}}>{v.licensePlate || ''}</div>
                </div>
                <div style={{fontSize:12, color:'#999'}}>{v.stationName || ''}</div>
              </div>
              {onRestore && (
                <button onClick={async () => { if (!confirm('Restore this vehicle?')) return; await onRestore(v); }} style={{background:'#10b981', color:'white', border:'none', padding:'6px 10px', borderRadius:6, cursor:'pointer', fontSize:'13px', fontWeight:'500'}}>
                  ✓ Restore
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{padding:'12px 8px', color:'#555'}}>No deleted vehicles recorded.</div>
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
        onDelete={onRemove}
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
