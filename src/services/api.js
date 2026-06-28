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
    const error = new Error(data.error || 'Něco se pokazilo.');
    error.status = response.status;
    // 429 = rate limit; preferuj retryAfter z těla, jinak hlavičku Retry-After
    const headerRetry = Number(response.headers.get('Retry-After')) || null;
    error.retryAfter = data.retryAfter ?? headerRetry;
    throw error;
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

    verify: (email, code) =>
      request('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    resendOtp: (email) =>
      request('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (email, code, newPassword) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, new_password: newPassword }),
      }),

    changePassword: (oldPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
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

    getCollaborators: (id) => request(`/trips/${id}/collaborators`),

    share: (id, userId, role) =>
      request(`/trips/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      }),

    updateShare: (id, userId, role) =>
      request(`/trips/${id}/share/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),

    removeShare: (id, userId) =>
      request(`/trips/${id}/share/${userId}`, { method: 'DELETE' }),

    generateShareLink: (id) =>
      request(`/trips/${id}/share-link`, { method: 'POST' }),

    revokeShareLink: (id) =>
      request(`/trips/${id}/share-link`, { method: 'DELETE' }),
  },

  // ── Public (no auth) ───────────────────────────────────────
  public: {
    getTrip: async (token) => {
      const res = await fetch(`${API_BASE}/public/trips/${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nepodařilo se načíst výlet.');
      return data;
    },
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

    getInviteLink: () => request('/friends/invite/me'),

    regenerateInviteLink: () =>
      request('/friends/invite/regenerate', { method: 'POST' }),

    getInvitePreview: (token) => request(`/friends/invite/${token}`),

    acceptInvite: (token) =>
      request(`/friends/invite/${token}/accept`, { method: 'POST' }),
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

  // ── Stats (Analytics) ──────────────────────────────────────
  stats: {
    get: () => request('/stats'),
  },

  // ── Admin ──────────────────────────────────────────────────
  admin: {
    dashboard: () => request('/admin/dashboard'),

    getUsers: (params = {}) => request(`/admin/users?${new URLSearchParams(params)}`),

    getUser: (id) => request(`/admin/users/${id}`),

    updateUserRole: (id, role) =>
      request(`/admin/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),

    deleteUser: (id) =>
      request(`/admin/users/${id}`, { method: 'DELETE' }),

    getTrips: (params = {}) => request(`/admin/trips?${new URLSearchParams(params)}`),

    getTrip: (id) => request(`/admin/trips/${id}`),

    deleteTrip: (id) =>
      request(`/admin/trips/${id}`, { method: 'DELETE' }),
  },
};

export default api;
