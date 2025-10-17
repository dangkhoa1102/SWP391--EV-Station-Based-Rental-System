// src/components/Profile/ProfileSection.jsx
import React, { useState } from 'react';
import ProfileModal from './ProfileModal';

export default function ProfileSection() {
  const [open, setOpen] = useState(false);
  return (
    <div id="profile" className="section">
      <div style={{padding:32, textAlign:'center'}}>
        <button className="profile-add-btn" onClick={() => setOpen(true)}>View Staff Profile</button>
      </div>
      <ProfileModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
