import axios from 'axios';

// TODO: Move to a .env file
const API_BASE_URL = 'http://localhost:5151/api'; // Assuming the Monolithic service runs on this port

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // In a real app, you'd get the token from auth context
    // 'Authorization': `Bearer ${token}` 
  }
});

export const getIncidents = (params) => {
  return apiClient.get('/Incidents/Get-All', { params });
};

export const getIncidentById = (id) => {
  return apiClient.get(`/Incidents/Get-By-${id}`);
};

export const updateIncident = (id, data) => {
  // Note: The backend expects FormData, so we need to adjust the call
  // This is a placeholder for a simple JSON update which might differ from the backend's expectation.
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] != null) {
        formData.append(key, data[key]);
    }
  });

  return apiClient.put(`/Incidents/Update-By-${id}`, formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    }
  });
};

export const resolveIncident = (id, data) => {
  return apiClient.patch(`/Incidents/Resolve-By-${id}`, data);
};
