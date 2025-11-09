// src/components/Profile/ProfileModal.jsx
import React, { useEffect, useState } from 'react';
import './Profile.css';
import './StaffProfile.css';
import StaffAPI from '../../../services/staffApi';

export default function ProfileModal({ open, onClose, inline = false }) {
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
        // Enrichment: fill missing fields from JWT and user record by id
        try {
          // Current user id
          let userId = p?.id || p?.userId || a?.userId || a?.id
          if (!userId) {
            const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
            if (t) {
              const claims = StaffAPI.decodeJwt(t)
              userId = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || claims.nameidentifier || claims.sub || claims.userId || claims.UserId || claims.id || claims.Id
            }
          }

          // Derive role from claims if missing
          if (!a?.role && !p?.role) {
            try {
              const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
              if (t) {
                const claims = StaffAPI.decodeJwt(t)
                const roleClaim = claims?.role || claims?.Role || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                if (roleClaim) a = { ...a, role: roleClaim }
              }
            } catch {}
          }

          // If username/address/station are missing, try user lookup
          const needUser = !p?.userName && !a?.userName || !p?.address || !p?.stationName
          if (userId && needUser) {
            try {
              const u = await StaffAPI.getUserById(userId)
              if (!mounted) return
              const merged = { ...p }
              if (!merged.userName) merged.userName = u?.userName || u?.UserName || u?.username || ''
              if (!merged.address) merged.address = u?.address || u?.Address || ''
              if (!merged.stationName) merged.stationName = u?.stationName || u?.station?.name || u?.StationName || ''
              setProfile(merged)
            } catch {}
          }
        } catch {}
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

  // Prefer API-provided username, then fall back to JWT claim if present (never email)
  let userName = profile.userName || profile.username || auth.userName || auth.username || ''
  if (!userName) {
    try {
      const t = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
      if (t) {
        const claims = StaffAPI.decodeJwt(t)
        userName = claims?.preferred_username || claims?.unique_name || claims?.userName || claims?.username || claims?.name || ''
      }
    } catch {}
  }
  const fullName = profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : (profile.fullName || auth.fullName || auth.name || '—')
  const email = profile.email || auth.email || '—'
  const phone = profile.phoneNumber || auth.phoneNumber || '—'
  const address = profile.address || auth.address || '—'
  const joined = profile.createdAt || auth.createdAt || '—'
  const employeeId = profile.employeeId || profile.id || auth.userId || auth.id || '—'
  const station = profile.stationName || profile.station || '—'
  const role = profile.role || auth.role || (Array.isArray(auth.roles) ? auth.roles.join(', ') : (auth.roles || '—'))
  const avatar = profile.avatarUrl || auth.avatarUrl || 'https://via.placeholder.com/180x180?text=Staff'

  if (inline) {
    // Professional Facebook-like profile
    return (
      <div className="staff-profile-page">
        {/* Cover */}
        <div className="staff-cover">
          <div className="staff-cover-gradient" />
        </div>
        {/* Header: avatar + name/role */}
        <div className="staff-header">
          <div className="staff-header-inner">
            <div className="staff-avatar">
              <img src={avatar} alt="Avatar" />
            </div>
            <div className="staff-title">
              <h1>{fullName}</h1>
              <div className="staff-meta">
                <span className="staff-role">{role || '—'}</span>
                {station && <span className="staff-sep">•</span>}
                <span className="staff-station">{station}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="staff-content">
          <div className="staff-col">
            <div className="card">
              <div className="card-header">About</div>
              <div className="card-body info-list">
                <div className="info-row"><span className="label">Full Name</span><span className="value">{fullName}</span></div>
                <div className="info-row"><span className="label">Role</span><span className="value">{role || '—'}</span></div>
                <div className="info-row"><span className="label">Station</span><span className="value">{station || '—'}</span></div>
                <div className="info-row"><span className="label">Employee ID</span><span className="value">{employeeId}</span></div>
                <div className="info-row"><span className="label">Joined</span><span className="value">{String(joined).toString().slice(0,10) || '—'}</span></div>
              </div>
            </div>
          </div>

          <div className="staff-col">
            <div className="card">
              <div className="card-header">Contact</div>
              <div className="card-body info-list">
                <div className="info-row"><span className="label">Email</span><span className="value">{email}</span></div>
                <div className="info-row"><span className="label">Phone</span><span className="value">{phone}</span></div>
                <div className="info-row"><span className="label">Address</span><span className="value">{address}</span></div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="staff-error">{error}</div>
        )}
      </div>
    )
  }

  // Fallback: modal version if not inline
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
