// src/components/Profile/ProfileSection.jsx
import React from 'react';
import ProfileModal from './ProfileModal';

export default function ProfileSection() {
  return (
    <div id="profile" className="section" style={{ padding: 24 }}>
      {/* Render profile inline by default (no open button, no overlay) */}
      <ProfileModal open={true} inline onClose={() => {}} />
    </div>
  );
}
