import React, { useState } from 'react';
import AdminAPI from '../../../../services/adminApi';

export default function AddUserModal({ open, onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Register new user via API
      await AdminAPI.post('/Auth/Register', {
        fullName,
        email,
        phoneNumber: phone,
        password
      });

      // Clear form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      
      // Notify parent
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create user';
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
        <h2>Create New User</h2>
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
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}
