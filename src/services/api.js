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
    register: (firstName, lastName, email, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
      }),

    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
      
    googleLogin: (accessToken) =>
      request('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
      }),

    me: () => request('/auth/me'),
    updateProfile: (profileData) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
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

  // ── Friends ────────────────────────────────────────────────
  friends: {
    getAll: () => request('/friends'),

    getRequests: () => request('/friends/requests'),

    sendRequest: (addresseeId) =>
      request('/friends/request', {
        method: 'POST',
        body: JSON.stringify({ addresseeId }),
      }),

    accept: (friendshipId) =>
      request(`/friends/${friendshipId}/accept`, { method: 'PUT' }),

    decline: (friendshipId) =>
      request(`/friends/${friendshipId}/decline`, { method: 'PUT' }),

    remove: (friendshipId) =>
      request(`/friends/${friendshipId}`, { method: 'DELETE' }),

    search: (query) => request(`/friends/search?q=${encodeURIComponent(query)}`),

    getStatus: (userId) => request(`/friends/status/${userId}`),
  },

  // ── Profile (guarded) ─────────────────────────────────────
  profile: {
    get: (userId) => request(`/profile/${userId}`),

    getTrip: (userId, tripId) => request(`/profile/${userId}/trip/${tripId}`),
  },

  // ── Votes ──────────────────────────────────────────────────
  votes: {
    cast: (tripId, value) =>
      request('/votes', {
        method: 'POST',
        body: JSON.stringify({ tripId, value }),
      }),

    remove: (tripId) =>
      request(`/votes/${tripId}`, { method: 'DELETE' }),

    get: (tripId) => request(`/votes/${tripId}`),
  },

  // ── Notifications ──────────────────────────────────────────
  notifications: {
    getAll: () => request('/notifications'),

    markRead: (id) =>
      request(`/notifications/${id}/read`, { method: 'PUT' }),

    markAllRead: () =>
      request('/notifications/read-all', { method: 'PUT' }),

    getUnreadCount: () => request('/notifications/unread-count'),
  },
};

export default api;
