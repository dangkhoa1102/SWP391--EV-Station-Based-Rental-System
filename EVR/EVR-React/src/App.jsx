import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import StaffPage from './Staff/StaffPage';
import AdminPage from './Admin/AdminPage';

export default function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', background: '#eee', display: 'flex', gap: '10px' }}>
          <Link to="/staff">Staff</Link>
          <Link to="/admin">Admin</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/staff" replace />} />
          <Route path="/staff/*" element={<StaffPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}
