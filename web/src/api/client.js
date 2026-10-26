const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

let activeToken = localStorage.getItem('sdms_token') || '';

export function setAuthToken(token) {
  activeToken = token;
  if (token) {
    localStorage.setItem('sdms_token', token);
  } else {
    localStorage.removeItem('sdms_token');
  }
}

export function getAuthToken() {
  return activeToken;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }
  return body;
}

export const api = {
  // Auth
  login: async (credentials) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
  me: () => request('/auth/me'),
  testCredentials: () => request('/test-credentials'),

  // Dashboard & Metrics
  dashboardStats: () => request('/dashboard/stats'),
  tables: () => request('/tables'),
  seedStatus: () => request('/seed-status'),

  // Students
  students: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },
  studentProfile: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),

  // Incidents
  incidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents${query ? `?${query}` : ''}`);
  },
  incidentDetails: (id) => request(`/incidents/${id}`),
  createIncident: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncidentStatus: (id, status) => request(`/incidents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // Sanctions
  sanctions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sanctions${query ? `?${query}` : ''}`);
  },
  createSanction: (data) => request('/sanctions', { method: 'POST', body: JSON.stringify(data) }),
  updateSanction: (id, status) => request(`/sanctions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // Counselling
  counselling: () => request('/counselling'),
  createCounselling: (data) => request('/counselling', { method: 'POST', body: JSON.stringify(data) }),

  // Merits
  merits: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/merits${query ? `?${query}` : ''}`);
  },
  createMerit: (data) => request('/merits', { method: 'POST', body: JSON.stringify(data) }),

  // Metadata & Lookups
  classes: () => request('/classes'),
  terms: () => request('/terms'),
  offenceCategories: () => request('/offence-categories'),
  schoolRules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/school-rules${query ? `?${query}` : ''}`);
  },
  staff: () => request('/staff'),
  users: () => request('/users'),
  auditLogs: () => request('/audit-logs'),
};
