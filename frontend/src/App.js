import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import IncidentList from './components/IncidentList';
import IncidentDetail from './components/IncidentDetail';

function App() {
  return (
    <Router>
      <div className="container mt-4">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Staff Incident Mngmt</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<IncidentList />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;