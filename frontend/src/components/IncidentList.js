import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../services/api';

function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await getIncidents();
        // The actual data is likely nested in the response, e.g., response.data.items
        setIncidents(response.data.items || response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch incidents. Please make sure the API is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h3>Incidents</h3>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Reported At</th>
            <th>Station</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.length > 0 ? (
            incidents.map(incident => (
              <tr key={incident.id}>
                <td>{incident.id}</td>
                <td>{incident.title}</td>
                <td><span className={`badge bg-${incident.status === 'Resolved' ? 'success' : 'warning'}`}>{incident.status}</span></td>
                <td>{new Date(incident.createdAt).toLocaleString()}</td>
                <td>{incident.stationName || 'N/A'}</td>
                <td>
                  <Link to={`/incident/${incident.id}`} className="btn btn-primary btn-sm">View</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">No incidents found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentList;
