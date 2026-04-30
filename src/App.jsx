import { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header'
import Timer from './components/Timer'
import TaskList from './components/TaskList'
import RewardPanel from './components/RewardPanel'
import LoginScreen from './components/LoginScreen'
import ActivityLog from './components/ActivityLog'
import { loadState, saveState } from './utils/storage'
import { supabase } from './lib/supabase'
import { state as stateApi, sessions, tasks as tasksApi } from './lib/api'
import { playChime, sendNotification, requestNotificationPermission } from './utils/notify'
import { useTheme } from './hooks/useTheme'
import './App.css'

const STICKER_UNLOCKS = ['🎉', '🦁', '🌈', '🚀', '🦋', '🏆', '🌟', '🐉', '🎪', '🦄']

function MainApp({ user, onLogout }) {
  const [initialized, setInitialized] = useState(false)
  const [stars, setStars] = useState(0)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [interruptions, setInterruptions] = useState(0)
  const [stickers, setStickers] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [showCelebration, setShowCelebration] = useState(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const syncTimerRef = useRef(null)
  const currentSessionId = useRef(null)

  // Request notification permission once on mount
  useEffect(() => { requestNotificationPermission() }, [])

  // Load state: server first (cross-device), fallback to localStorage
  useEffect(() => {
    const local = loadState(user.username)
    if (local) {
      setStars(local.stars ?? 0)
      setCompletedPomodoros(local.completedPomodoros ?? 0)
      setInterruptions(local.interruptions ?? 0)
      setStickers(local.stickers ?? [])
      setTasks(local.tasks ?? [])
      setActivities(local.activities ?? [])
    }

    if (user.token) {
      const today = new Date().toISOString().slice(0, 10)
      Promise.allSettled([stateApi.load(), tasksApi.list(today)])
        .then(([stateResult, tasksResult]) => {
          if (stateResult.status === 'fulfilled') {
            const remote = stateResult.value
            setStars(remote.stars ?? 0)
            setCompletedPomodoros(remote.completed_pomodoros ?? 0)
            setInterruptions(remote.interruptions ?? 0)
            setStickers(remote.stickers ?? [])
          }
          if (tasksResult.status === 'fulfilled') {
            setTasks(tasksResult.value.map(t => ({
              id: t.id,
              text: t.text,
              emoji: t.emoji,
              estimated: t.estimated_pomodoros,
              completed: t.completed_pomodoros,
              done: t.done,
            })))
          }
        }).finally(() => setInitialized(true))
    } else {
      setInitialized(true)
    }
  }, [user.username, user.token])

  // Save to localStorage immediately
  useEffect(() => {
    if (!initialized) return
    saveState(user.username, { stars, completedPomodoros, interruptions, stickers, tasks, activities })
  }, [initialized, user.username, stars, completedPomodoros, interruptions, stickers, tasks, activities])

  // Sync to server with 3s debounce
  useEffect(() => {
    if (!initialized || !user.token) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      stateApi.save({ stars, completed_pomodoros: completedPomodoros, interruptions, stickers }).catch(() => {})
    }, 3000)
    return () => clearTimeout(syncTimerRef.current)
  }, [initialized, user.token, stars, completedPomodoros, interruptions, stickers])

  const addActivity = useCallback(async (type, message) => {
    const id = Date.now()
    const activityData = { id, type, message, timestamp: id, status: supabase ? 'pending' : 'local' }
    setActivities(prev => [activityData, ...prev])

    if (supabase) {
      try {
        await supabase.from('user_activities').insert([{
          username: user.username,
          type,
          message,
          created_at: new Date(id).toISOString()
        }])
        setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'ok' } : a))
      } catch (err) {
        console.error('Database save failed:', err)
        setActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a))
      }
    }
  }, [user.username])

  const handlePomodoroComplete = useCallback(() => {
    addActivity('FOCUS_COMPLETE', '完成了一次专注 🌱')
    if (user.token && currentSessionId.current) {
      sessions.complete(currentSessionId.current).catch(() => {})
      currentSessionId.current = null
    }
    playChime('complete')
    sendNotification('🌱 专注时间结束！', '棒棒哒！给小芽浇过水了，去休息一下吧 💧')
    setStars(s => s + 1)
    setTasks(prev => {
      const idx = prev.findIndex(t => !t.done)
      if (idx === -1) return prev
      return prev.map((t, i) => i === idx ? { ...t, completed: Math.min(t.completed + 1, t.estimated) } : t)
    })
    setCompletedPomodoros(prev => {
      const n = prev + 1
      if (n % 4 === 0) {
        setStickers(s => {
          const emoji = STICKER_UNLOCKS[s.length % STICKER_UNLOCKS.length]
          setShowCelebration(emoji)
          setTimeout(() => setShowCelebration(null), 3000)
          return [...s, emoji]
        })
      }
      return n
    })
  }, [])

  const handleBreakEnd = useCallback(() => {
    addActivity('BREAK_COMPLETE', '休息结束')
    playChime('break_end')
    sendNotification('⏰ 休息结束！', '准备好了吗？开始下一次专注 🌱')
  }, [])

  const handleFocusAbort = useCallback(() => {
    addActivity('FOCUS_ABORT', '中途放弃了这次专注 😔')
    if (user.token && currentSessionId.current) {
      sessions.abandon(currentSessionId.current).catch(() => {})
      currentSessionId.current = null
    }
  }, [addActivity, user.token])

  const handleInterrupt = useCallback(() => setInterruptions(i => i + 1), [])

  const handleAddTask = useCallback(async (taskData) => {
    if (user.token) {
      try {
        const t = await tasksApi.create(taskData)
        setTasks(prev => [...prev, {
          id: t.id, text: t.text, emoji: t.emoji,
          estimated: t.estimated_pomodoros, completed: t.completed_pomodoros, done: t.done,
        }])
      } catch {}
    } else {
      setTasks(prev => [...prev, {
        id: Date.now(), text: taskData.text, emoji: taskData.emoji,
        estimated: taskData.estimated_pomodoros, completed: 0, done: false,
      }])
    }
  }, [user.token])

  const handleModeStart = useCallback((mode) => {
    if (mode === 'focus') {
      addActivity('FOCUS_START', '开始专注')
      if (user.token) {
        sessions.start('focus').then(s => { currentSessionId.current = s.id }).catch(() => {})
      }
    } else if (mode === 'short_break') {
      addActivity('BREAK_START', '开始短休息')
    } else if (mode === 'long_break') {
      addActivity('BREAK_START', '开始长休息')
    }
  }, [addActivity, user.token])

  return (
    <div className="app-shell">
      <Header
        username={user.username}
        stars={stars}
        completedPomodoros={completedPomodoros}
        onLogout={onLogout}
      />
      <main className="app-main">
        <Timer
          onPomodoroComplete={handlePomodoroComplete}
          onBreakEnd={handleBreakEnd}
          onRunningChange={setIsTimerRunning}
          onModeStart={handleModeStart}
          onFocusAbort={handleFocusAbort}
        />
        <TaskList
          tasks={tasks}
          setTasks={setTasks}
          onAddTask={handleAddTask}
          onInterrupt={handleInterrupt}
          isTimerRunning={isTimerRunning}
          userToken={user.token}
        />
        <RewardPanel stars={stars} stickers={stickers} completedPomodoros={completedPomodoros} />
        <ActivityLog activities={activities} />
        <p className="app-footer-tip">专注25分钟 🌱 休息5分钟 · 4次专注后大休息 🌙</p>
      </main>

      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="celebration-icon">{showCelebration}</div>
            <p className="celebration-title">解锁新贴纸！</p>
            <p className="celebration-sub">完成4次专注，小芽又长高了！⭐</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  useTheme()

  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pomodoro_user'))
      if (saved) saved.token = localStorage.getItem('pomodoro_token') || null
      return saved
    } catch { return null }
  })

  const handleLogin = (userData) => {
    localStorage.setItem('pomodoro_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('pomodoro_user')
    localStorage.removeItem('pomodoro_token')
    setUser(null)
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />
  return <MainApp user={user} onLogout={handleLogout} />
}
