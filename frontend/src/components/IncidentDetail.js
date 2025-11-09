import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncidentById, updateIncident, resolveIncident } from '../services/api';

function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [status, setStatus] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        setLoading(true);
        const res = await getIncidentById(id);
        setIncident(res.data);
        // Initialize form state
        setStatus(res.data.status);
        setResponse(res.data.response || '');
        setError(null);
      } catch (err) {
        setError('Failed to fetch incident details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        await updateIncident(id, { status, response });
        alert('Incident updated successfully!');
        navigate('/');
    } catch (err) {
        alert('Failed to update incident.');
        console.error(err);
    }
  };

  const handleResolve = async () => {
    try {
        await resolveIncident(id, { response: 'Resolved by staff.' }); // Example data
        alert('Incident has been marked as resolved!');
        navigate('/');
    } catch (err) {
        alert('Failed to resolve incident.');
        console.error(err);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!incident) {
    return <div className="alert alert-warning">No incident data found.</div>;
  }

  return (
    <div>
      <h3>Incident Detail #{incident.id}</h3>
      <div className="card">
        <div className="card-header">{incident.title}</div>
        <div className="card-body">
            <p><strong>Reported by:</strong> User ID {incident.userId}</p>
            <p><strong>Station:</strong> {incident.stationName || 'N/A'}</p>
            <p><strong>Reported at:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
            <p><strong>Description:</strong></p>
            <p>{incident.description}</p>
            {incident.imageUrls && incident.imageUrls.length > 0 && (
                <div>
                    <strong>Images:</strong>
                    {incident.imageUrls.map(url => <img key={url} src={url} alt="Incident" className="img-fluid img-thumbnail m-2" style={{maxWidth: '200px'}}/>)}
                </div>
            )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">Staff Actions</div>
        <div className="card-body">
            <form onSubmit={handleUpdate}>
                <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select id="status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="Reported">Reported</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="response" className="form-label">Response / Notes</label>
                    <textarea id="response" className="form-control" rows="3" value={response} onChange={e => setResponse(e.target.value)}></textarea>
                </div>
                <button type="submit" className="btn btn-primary me-2">Update Incident</button>
                <button type="button" className="btn btn-success" onClick={handleResolve} disabled={status === 'Resolved'}>
                    Mark as Resolved
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}

export default IncidentDetail;
