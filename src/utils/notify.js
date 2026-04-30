export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'pomodoro',
    renotify: true,
    silent: true,
    ...options,
  })
  setTimeout(() => n.close(), 6000)
}

// Singleton AudioContext — created once and unlocked on first user gesture
let _ctx = null

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return _ctx
}

// Call this on any user interaction (button click) to unlock audio
export function unlockAudio() {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {}
}

export function playChime(type = 'complete') {
  try {
    const ctx = getCtx()
    // Ensure context is running before scheduling notes
    const play = () => {
      if (type === 'complete') {
        // Ascending C-E-G arpeggio
        const notes = [523, 659, 784]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sine'; osc.frequency.value = freq
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.6)
          osc.start(ctx.currentTime + i * 0.18)
          osc.stop(ctx.currentTime + i * 0.18 + 0.6)
        })
      } else if (type === 'break_end') {
        // Single soft bell
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = 440
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 1.0)
      }
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(play)
    } else {
      play()
    }
  } catch {}
}
