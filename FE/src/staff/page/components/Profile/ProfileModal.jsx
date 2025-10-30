// src/components/Profile/ProfileModal.jsx
import React, { useEffect, useState } from 'react';
import './Profile.css';
import StaffAPI from '../../../services/staffApi';

export default function ProfileModal({ open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({})
  const [auth, setAuth] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        // Fetch staff profile and auth info (same endpoints as user, via staff API)
        let p = {}
        let a = {}
        try {
          p = await StaffAPI.getMyProfile()
        } catch (e1) {
          if (e1?.response?.status === 401) {
            console.warn('Get-My-Profile unauthorized (401)')
          }
        }
        try {
          a = await StaffAPI.getMe()
        } catch (e2) {
          if (e2?.response?.status === 401) {
            console.warn('/Auth/Me unauthorized (401)')
          }
        }
        if (!mounted) return
        setProfile(p || {})
        setAuth(a || {})
        if ((!p || Object.keys(p).length === 0) && (!a || Object.keys(a).length === 0)) {
          const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('token')
          setError(hasToken ? 'You may not have permission to view this profile.' : 'You are not logged in. Please log in with a staff account.')
        }
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open])

  if (!open) return null;

  const fullName = profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : (profile.fullName || auth.fullName || auth.name || '—')
  const email = profile.email || auth.email || '—'
  const phone = profile.phoneNumber || auth.phoneNumber || '—'
  const address = profile.address || auth.address || '—'
  const joined = profile.createdAt || auth.createdAt || '—'
  const employeeId = profile.employeeId || profile.id || auth.userId || auth.id || '—'
  const station = profile.stationName || profile.station || '—'
  const role = profile.role || auth.role || (Array.isArray(auth.roles) ? auth.roles.join(', ') : (auth.roles || '—'))
  const avatar = profile.avatarUrl || auth.avatarUrl || 'https://via.placeholder.com/180x180?text=Staff'

  return (
    <div className="profile-modal-overlay" style={{display:'flex'}}>
      <div className="profile-modal-content">
        <span className="profile-modal-close" onClick={onClose}>&times;</span>
        <h2>Staff Profile</h2>
        {error && (
          <div style={{background:'#ffecec', color:'#b00020', padding:'8px 12px', borderRadius:6, marginBottom:12}}>{error}</div>
        )}
        <img src={avatar} alt="Staff" style={{borderRadius:'50%'}} />
        {loading ? (
          <div style={{padding:16}}>Loading profile…</div>
        ) : (
          <div className="profile-info-grid">
            <div className="profile-info-card">
              <strong>Name</strong>
              <div>{fullName}</div>
            </div>
            <div className="profile-info-card">
              <strong>Email</strong>
              <div>{email}</div>
            </div>
            <div className="profile-info-card">
              <strong>Role</strong>
              <div>{role || '—'}</div>
            </div>
            <div className="profile-info-card">
              <strong>Phone</strong>
              <div>{phone}</div>
            </div>
            <div className="profile-info-card">
              <strong>Address</strong>
              <div>{address}</div>
            </div>
            <div className="profile-info-card">
              <strong>Joined</strong>
              <div>{String(joined).toString().slice(0,10) || '—'}</div>
            </div>
            <div className="profile-info-card">
              <strong>Employee ID</strong>
              <div>{employeeId}</div>
            </div>
            <div className="profile-info-card">
              <strong>Station</strong>
              <div>{station}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
