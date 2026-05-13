const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('journeo_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // If 401 and not on auth endpoint, token is invalid – logout
  if (response.status === 401 && !endpoint.startsWith('/auth')) {
    localStorage.removeItem('journeo_token');
    window.location.href = '/auth';
    throw new Error('Session expired');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Něco se pokazilo.');
  }

  return data;
}

// ── Auth ────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (email, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () => request('/auth/me'),
  },

  // ── Trips ───────────────────────────────────────────────────
  trips: {
    getAll: () => request('/trips'),

    create: (tripData) =>
      request('/trips', {
        method: 'POST',
        body: JSON.stringify(tripData),
      }),

    update: (id, tripData) =>
      request(`/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tripData),
      }),

    delete: (id) =>
      request(`/trips/${id}`, {
        method: 'DELETE',
      }),
  },

  // ── Settings ────────────────────────────────────────────────
  settings: {
    get: () => request('/settings'),

    update: (settings) =>
      request('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
};

export default api;
