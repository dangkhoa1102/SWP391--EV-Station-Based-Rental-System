import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import IncidentList from './components/IncidentList';
import IncidentDetail from './components/IncidentDetail';
import ContractList from './components/ContractList';
import ContractDetail from './components/ContractDetail';
import CreateContract from './components/CreateContract';
import ConfirmContract from './components/ConfirmContract';
import DownloadLatestContract from './components/DownloadLatestContract';

function App() {
  return (
    <Router>
      <div className="container mt-4">
        <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
          <div className="container-fluid">
            <Link className="navbar-brand" to="/">Staff Incident Management</Link>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link" to="/contracts">Contracts</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/api/contracts/user/download-latest-by-userId">Download Latest</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<IncidentList />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contract/new" element={<CreateContract />} />
          <Route path="/contract/:id" element={<ContractDetail />} />
          <Route path="/xac-nhan-hop-dong" element={<ConfirmContract />} />
          <Route path="/api/contracts/user/download-latest-by-userId" element={<DownloadLatestContract />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;