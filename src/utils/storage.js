const TODAY = new Date().toDateString()

function stateKey(username) {
  return `pomodoro_state_${username}`
}

export function loadState(username) {
  try {
    const saved = localStorage.getItem(stateKey(username))
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (parsed.date !== TODAY) {
      return { ...parsed, date: TODAY, stars: 0, completedPomodoros: 0, interruptions: 0, stickers: parsed.stickers ?? [], activities: [] }
    }
    return parsed
  } catch {
    return null
  }
}

export function saveState(username, state) {
  try {
    localStorage.setItem(stateKey(username), JSON.stringify({ ...state, date: TODAY }))
  } catch {}
}

export function loadCurrentUser() {
  return localStorage.getItem('pomodoro_current_user') || null
}

export function saveCurrentUser(username) {
  if (username) {
    localStorage.setItem('pomodoro_current_user', username)
  } else {
    localStorage.removeItem('pomodoro_current_user')
  }
}
