import React, { useEffect, useState } from 'react';
import AdminAPI from '../../../services/adminApi';

export default function StationSection({ stations = [], onReload }) {
  const [list, setList] = useState(stations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [selectedCars, setSelectedCars] = useState(null);
  const [editStation, setEditStation] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTotalSlots, setEditTotalSlots] = useState('');
  const [editAvailableSlots, setEditAvailableSlots] = useState('');

  useEffect(() => { setList(stations || []); }, [stations]);
  useEffect(() => {
    if (!stations || stations.length === 0) {
      // Auto load on first mount if parent didn't pass data
      refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const data = await AdminAPI.stationsList(1, 200);
      setList(data || []);
      setError('');
    } catch (e) {
      setError(e?.message || 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  }

  async function createStation() {
    try {
      setLoading(true);
      setError(''); setInfo('');
      if (!name.trim()) {
        setError('Station name is required');
        return;
      }
      if (!address.trim()) {
        setError('Address is required');
        return;
      }
      const slotsNum = totalSlots === '' ? undefined : Number(totalSlots);
      if (slotsNum == null || !Number.isFinite(slotsNum) || slotsNum < 1 || slotsNum > 1000) {
        setError('Total slots must be between 1 and 1000');
        return;
      }
      const payload = {
        name: name,
        address: address,
        totalSlots: slotsNum
      };
      await AdminAPI.stationCreate(payload);
      setName(''); setAddress(''); setTotalSlots('');
      if (onReload) await onReload(); else await refresh();
      setInfo('Station created successfully');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to create station');
    } finally {
      setLoading(false);
    }
  }

  function updateStation(station) {
    // Open edit modal prefilled with station data
    const id = station.id || station.Id;
    if (!id) return;
    setEditStation(station);
    setEditName(station.name || station.Name || '');
    setEditAddress(station.address || station.Address || '');
    setEditTotalSlots((station.totalSlots ?? station.TotalSlots ?? '') + '');
    setEditAvailableSlots((station.availableSlots ?? station.AvailableSlots ?? '') + '');
  }

  async function saveEditStation() {
    if (!editStation) return;
    const id = editStation.id || editStation.Id;
    if (!id) return;
    // Validate
    const slotsNum = editTotalSlots === '' ? undefined : Number(editTotalSlots);
    const availNum = editAvailableSlots === '' ? undefined : Number(editAvailableSlots);
    if (slotsNum == null || !Number.isFinite(slotsNum) || slotsNum < 0) {
      setError('Total slots must be a non-negative number');
      return;
    }
    if (availNum == null || !Number.isFinite(availNum) || availNum < 0) {
      setError('Available slots must be a non-negative number');
      return;
    }
    if (availNum > slotsNum) {
      setError('Available slots cannot be greater than total slots');
      return;
    }
    const payload = {
      name: editName,
      address: editAddress,
      totalSlots: slotsNum,
      availableSlots: availNum
    };
    try {
      setLoading(true);
      setError(''); setInfo('');
      await AdminAPI.stationUpdate(id, payload);
      // Update local list for immediacy
      setList(prev => (prev || []).map(it => {
        const iid = it.id || it.Id;
        if (iid === id) return { ...it, ...payload };
        return it;
      }));
      setInfo('Station updated');
      setEditStation(null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update station');
    } finally {
      setLoading(false);
    }
  }

  async function deleteStation(station) {
    const id = station.id || station.Id;
    if (!id) return;
    if (!confirm('Delete this station?')) return;
    try {
      setLoading(true);
      await AdminAPI.stationDelete(id);
      if (onReload) await onReload(); else await refresh();
    } catch (e) {
      setError(e?.message || 'Failed to delete station');
    } finally {
      setLoading(false);
    }
  }

  async function recalc(station) {
    const id = station.id || station.Id;
    if (!id) return;
    try {
      setLoading(true);
      await AdminAPI.stationRecalculateSlots(id);
      alert('Recalculated available slots');
    } catch (e) {
      setError(e?.message || 'Failed to recalculate');
    } finally {
      setLoading(false);
    }
  }

  async function viewAvailableCars(station) {
    const id = station.id || station.Id;
    if (!id) return;
    try {
      setLoading(true);
      const cars = await AdminAPI.stationGetAvailableCars(id);
      setSelectedCars(Array.isArray(cars) ? cars : (cars?.data || cars || []));
    } catch (e) {
      setError(e?.message || 'Failed to load available cars');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="station" className="station-section" style={{background: '#f5f5f5', minHeight: '100vh', padding: '20px'}}>

      <div style={{background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '20px', padding: '30px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)'}}>
        <h3 style={{margin: '0 0 20px 0', color: '#333', fontSize: '1.8rem', fontWeight: '600'}}>Create New Station</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 0.7fr', gap: 15}}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Station name *" style={{padding: '15px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: 16, transition: 'border-color 0.3s', background: '#fafafa'}} onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" style={{padding: '15px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: 16, transition: 'border-color 0.3s', background: '#fafafa'}} onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
            <input value={totalSlots} onChange={e => setTotalSlots(e.target.value)} placeholder="Total slots *" type="number" min={1} max={1000} style={{padding: '15px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: 16, transition: 'border-color 0.3s', background: '#fafafa'}} onFocus={(e) => e.target.style.borderColor = '#667eea'} onBlur={(e) => e.target.style.borderColor = '#e0e0e0'} />
          </div>
          <div style={{display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap'}}>
            <button onClick={createStation} disabled={loading} className="create-station-btn" style={{margin: 0, padding: '12px 24px', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)', transition: 'all 0.3s'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.3)'; }} onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }} onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}>
              <i className="fas fa-plus"></i> Create Station
            </button>
            <button onClick={onReload || refresh} disabled={loading} className="refresh-btn" style={{margin: 0, padding: '12px 24px', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)', transition: 'all 0.3s'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 123, 255, 0.3)'; }} onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }} onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}>
              <i className="fas fa-sync"></i> Refresh List
            </button>
            {loading && <div style={{color: '#667eea', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'}}><i className="fas fa-spinner fa-spin"></i> Processing...</div>}
          </div>
        </div>
        {error && <div style={{background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', color: '#721c24', padding: '15px', borderRadius: '12px', marginTop: '20px', border: '1px solid #f5c6cb', boxShadow: '0 4px 10px rgba(255, 0, 0, 0.1)'}}>{error}</div>}
        {info && <div style={{background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#0a7a33', padding: '15px', borderRadius: '12px', marginTop: '20px', border: '1px solid #c3e6c7', boxShadow: '0 4px 10px rgba(0, 255, 0, 0.1)'}}>{info}</div>}
      </div>

      <div className="station-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignItems: 'start'}}>
        {(!list || list.length === 0) && (
          <div style={{padding: '30px', color: '#666', textAlign: 'center', background: 'rgba(255,255,255,0.9)', border: '2px dashed #ddd', borderRadius: '15px', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', gridColumn: '1 / -1'}}>
            <i className="fas fa-map-marker-alt" style={{fontSize: '2.5rem', color: '#ddd', marginBottom: '8px'}}></i><br />
            No stations found. Create one above!
          </div>
        )}
        {(list || []).map((s) => {
          const id = s.id || s.Id;
          const name = s.name || s.Name || `Station ${id}`;
          const cap = s.totalSlots ?? s.TotalSlots ?? null;
          const avail = s.availableSlots ?? s.AvailableSlots ?? null;
          const addr = s.address || s.Address || '';
          return (
            <div key={id} className="station-card" style={{borderRadius: '12px', padding: '0', background: 'rgba(255,255,255,0.98)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.25s, box-shadow 0.25s', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '220px', boxSizing: 'border-box'}} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}>
              <div style={{height: '100px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: '0 0 100px'}}>
                <i className="fas fa-map-marker-alt" style={{fontSize: '2rem', color: '#fff'}}></i>
                <div style={{position: 'absolute', top: '8px', right: '8px'}}>
                  <div className="station-actions" style={{gap: '6px', display: 'flex'}}>
                    <button onClick={() => updateStation(s)} title="Rename Station" style={{padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.95)', border: 'none', transition: 'all 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#fff'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}>
                      <i className="fas fa-edit" style={{color: '#28a745', fontSize: '0.8rem'}}></i>
                    </button>
                    <button onClick={() => viewAvailableCars(s)} title="View Available Cars" style={{padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.95)', border: 'none', transition: 'all 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#fff'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}>
                      <i className="fas fa-car" style={{color: '#007bff', fontSize: '0.8rem'}}></i>
                    </button>
                    <button onClick={() => recalc(s)} title="Recalculate Slots" style={{padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.95)', border: 'none', transition: 'all 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#fff'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}>
                      <i className="fas fa-calculator" style={{color: '#ffc107', fontSize: '0.8rem'}}></i>
                    </button>
                    <button onClick={() => deleteStation(s)} title="Delete Station" style={{padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.95)', border: 'none', transition: 'all 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#ffe6e6'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}>
                      <i className="fas fa-trash" style={{color: '#dc3545', fontSize: '0.8rem'}}></i>
                    </button>
                  </div>
                </div>
              </div>
              <div style={{padding: '12px', flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <div>
                  <div className="station-name" style={{fontSize: '1rem', color: '#333', fontWeight: '600', marginBottom: '6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{name}</div>
                  <div className="station-address" style={{color: '#666', marginBottom: '8px', fontSize: '0.85rem', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{addr || <span className="station-no-address" style={{fontStyle: 'italic'}}>No address</span>}</div>
                </div>
                <div className="station-stats" style={{display: 'flex', gap: '6px', fontSize: '0.85rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                  <span style={{background: '#e8f5e8', padding: '4px 8px', borderRadius: '6px', color: '#0a7a33'}}>Slots: <b>{cap ?? 'N/A'}</b></span>
                  <span style={{background: '#e3f2fd', padding: '4px 8px', borderRadius: '6px', color: '#0d47a1'}}>Avail: <b>{avail ?? 'N/A'}</b></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Array.isArray(selectedCars) && (
        <div className="modal-overlay" onClick={() => setSelectedCars(null)} style={{display: 'flex', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)'}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '650px', width: '90%', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', background: '#fff', padding: '30px'}}>
            <div className="modal-header" style={{borderBottom: '2px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0, color: '#333', fontSize: '1.5rem'}}><i className="fas fa-car" style={{color: '#667eea', marginRight: '10px'}}></i>Available Cars at Station</h3>
              <button className="modal-close" onClick={() => setSelectedCars(null)} style={{background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', transition: 'background 0.3s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'} onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}>
                <i className="fas fa-times" style={{color: '#666'}}></i>
              </button>
            </div>
            <div className="modal-body" style={{maxHeight: '60vh', overflow: 'auto'}}>
              {selectedCars.length === 0 && <div style={{color: '#777', textAlign: 'center', padding: '40px', fontSize: '1.1rem'}}><i className="fas fa-car-slash" style={{fontSize: '2rem', color: '#ddd', marginBottom: '10px'}}></i><br />No cars available at this station.</div>}
              {selectedCars.map((c, i) => {
                const carName = c.name || c.Name || [c.brand || c.Brand, c.model || c.Model].filter(Boolean).join(' ') || 'Car';
                const plate = c.licensePlate || c.LicensePlate || '';
                const battery = c.currentBatteryLevel ?? c.CurrentBatteryLevel ?? null;
                return (
                  <div key={(c.id || c.Id || plate || i)} style={{padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.3s'}} onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div>
                      <div style={{fontWeight: 600, color: '#333', fontSize: '1rem'}}>{carName}</div>
                      <div style={{color: '#666', fontSize: '0.9rem'}}>{plate}</div>
                    </div>
                    <div style={{color: '#333', fontWeight: 500, fontSize: '1rem', background: battery > 50 ? '#e8f5e8' : battery > 20 ? '#fff3cd' : '#f8d7da', padding: '5px 10px', borderRadius: '8px'}}>{battery != null ? `${Math.round(battery)}%` : 'N/A'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {editStation && (
        <div className="modal-overlay" onClick={() => setEditStation(null)} style={{display: 'flex', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)'}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '520px', width: '92%', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.25)', background: '#fff', padding: '20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <h3 style={{margin:0}}>Edit Station</h3>
              {/* <button className="modal-close" onClick={() => setEditStation(null)} style={{background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer'}}>
                <i className="fas fa-times" style={{color:'#666'}}></i>
              </button> */}
            </div>
            <div style={{display:'grid', gap:10}}>
              <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Station name" style={{padding:'10px', border:'1px solid #ddd', borderRadius:6}} />
              <input value={editAddress} onChange={e=>setEditAddress(e.target.value)} placeholder="Address" style={{padding:'10px', border:'1px solid #ddd', borderRadius:6}} />
              <div style={{display:'flex', gap:8}}>
                <input value={editTotalSlots} onChange={e=>setEditTotalSlots(e.target.value)} placeholder="Total slots" type="number" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:6, flex:1}} />
                <input value={editAvailableSlots} onChange={e=>setEditAvailableSlots(e.target.value)} placeholder="Available" type="number" min={0} style={{padding:'10px', border:'1px solid #ddd', borderRadius:6, width:120}} />
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:6}}>
                <button onClick={() => setEditStation(null)} style={{padding:'8px 12px', borderRadius:6, background:'#eee', border:'none'}}>Cancel</button>
                <button onClick={saveEditStation} disabled={loading} style={{padding:'8px 12px', borderRadius:6, background:'#2563eb', color:'#fff', border:'none'}}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


