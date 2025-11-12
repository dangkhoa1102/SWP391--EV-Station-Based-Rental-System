import React, { useState } from 'react';
import AdminAPI from '../../../../services/adminApi';

export default function AddStaffModal({ open, onClose, stations, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 1: Register new user as normal user first
      const response = await adminApi.post('/Auth/Register', {
        fullName,
        email,
        phoneNumber: phone,
        password
      });

      const userId = response?.data?.id || response?.data?.userId;
      
      if (!userId) {
        throw new Error('Failed to get user ID from registration response');
      }

      // Step 2: Assign Station Staff role to the user
      try {
        await adminApi.assignStaffRole(userId, `Assigned to station staff role during creation`);
      } catch (roleErr) {
        console.warn('Failed to assign staff role:', roleErr);
        throw new Error('User created but failed to assign staff role');
      }

      // Step 3: If station is selected, assign staff to station
      if (stationId) {
        try {
          await adminApi.assignStaffToStation(stationId, userId);
        } catch (assignErr) {
          console.warn('Staff role assigned but station assignment failed:', assignErr);
          // Don't throw - user and role are created, just station assignment failed
        }
      }

      // Clear form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setStationId('');
      
      // Notify parent
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create staff member';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>Create New Staff Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              value={fullName} 
              onChange={e=> setFullName(e.target.value)} 
              placeholder="Full Name" 
              required 
              disabled={isLoading} 
            />
            <i className="fas fa-user"></i>
          </div>
          <div className="input-group">
            <input 
              type="email" 
              value={email} 
              onChange={e=> setEmail(e.target.value)} 
              placeholder="Email" 
              required 
              disabled={isLoading} 
            />
            <i className="fas fa-envelope"></i>
          </div>
          <div className="input-group">
            <input 
              value={phone} 
              onChange={e=> setPhone(e.target.value)} 
              placeholder="Phone" 
              required 
              disabled={isLoading} 
            />
            <i className="fas fa-phone"></i>
          </div>
          <div className="input-group">
            <input 
              type="password" 
              value={password} 
              onChange={e=> setPassword(e.target.value)} 
              placeholder="Password" 
              required 
              disabled={isLoading} 
            />
            <i className="fas fa-lock"></i>
          </div>
          <div className="input-group" style={{marginBottom: '15px'}}>
            <select 
              value={stationId} 
              onChange={e=> setStationId(e.target.value)} 
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                paddingLeft: '40px'
              }}
            >
              <option value="">Select Station</option>
              {stations.map(s => (
                <option key={s.id || s.Id} value={s.id || s.Id}>
                  {s.name || s.Name || `Station ${s.id || s.Id}`}
                </option>
              ))}
            </select>
            <i className="fas fa-map-marker-alt" style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999'}}></i>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Staff Member...' : 'Create Staff'}
          </button>
        </form>
      </div>
    </div>
  );
}
