const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7080';

const defaultHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const buildQuery = (params = {}) => {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]);
  return new URLSearchParams(Object.fromEntries(entries)).toString();
};

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: defaultHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });

  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

  if (!res.ok) {
    const err = new Error(payload?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

/*
  Report endpoints (Admin):
  - GET  /api/Admin/Reports/Revenue-By-Station
        query: fromDate, toDate (ISO strings)
  - GET  /api/Admin/Reports/Car-Utilization
        query: fromDate, toDate
  - GET  /api/Admin/Reports/Peak-Hours
        query: fromDate, toDate
  - GET  /api/Admin/Reports/Revenue-Trends
        query: fromDate, toDate, groupBy ('day'|'week'|'month')
*/

export const adminReports = {
  getRevenueByStation: async ({ fromDate, toDate, token } = {}) => {
    const q = buildQuery({ fromDate, toDate });
    return request(`/api/Admin/Reports/Revenue-By-Station${q ? `?${q}` : ''}`, { token });
  },

  getCarUtilization: async ({ fromDate, toDate, token } = {}) => {
    const q = buildQuery({ fromDate, toDate });
    return request(`/api/Admin/Reports/Car-Utilization${q ? `?${q}` : ''}`, { token });
  },

  getPeakHours: async ({ fromDate, toDate, token } = {}) => {
    const q = buildQuery({ fromDate, toDate });
    return request(`/api/Admin/Reports/Peak-Hours${q ? `?${q}` : ''}`, { token });
  },

  getRevenueTrends: async ({ fromDate, toDate, groupBy = 'day', token } = {}) => {
    const q = buildQuery({ fromDate, toDate, groupBy });
    return request(`/api/Admin/Reports/Revenue-Trends${q ? `?${q}` : ''}`, { token });
  }
};

/* Usage example (in a React component):
import { adminReports } from '../api/adminReports';

const token = localStorage.getItem('access_token');
const resp = await adminReports.getRevenueByStation({
  fromDate: new Date('2025-10-01'),
  toDate: new Date('2025-10-31'),
  token
});
console.log(resp);
*/