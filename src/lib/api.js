const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getToken() {
  return localStorage.getItem('pomodoro_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

// Auth
export const auth = {
  register: (username, password, role = 'child', inviteCode = '') =>
    request('/auth/register', { method: 'POST', body: { username, password, role, inviteCode } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
}

// Sessions
export const sessions = {
  start: (mode) => request('/sessions/start', { method: 'POST', body: { mode } }),
  complete: (id, interrupted = false) =>
    request(`/sessions/${id}/complete`, { method: 'PATCH', body: { interrupted } }),
  abandon: (id) => request(`/sessions/${id}/abandon`, { method: 'PATCH' }),
  list: (date) => request(`/sessions?date=${date}`),
}

// Tasks
export const tasks = {
  list: (date) => request(`/tasks?date=${date}`),
  create: (data) => request('/tasks', { method: 'POST', body: data }),
  update: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
}

// Interruptions
export const interruptions = {
  create: (data) => request('/interruptions', { method: 'POST', body: data }),
  list: (date) => request(`/interruptions?date=${date}`),
}

// Stickers
export const stickers = {
  create: (emoji, pomodoros_at_earn) =>
    request('/stickers', { method: 'POST', body: { emoji, pomodoros_at_earn } }),
  list: () => request('/stickers'),
}

// Stats
export const stats = {
  daily: (days = 7) => request(`/stats/daily?days=${days}`),
  summary: () => request('/stats/summary'),
  sessions: (date) => request(`/stats/sessions?date=${date}`),
  heatmap: (weeks = 12) => request(`/stats/heatmap?weeks=${weeks}`),
}
