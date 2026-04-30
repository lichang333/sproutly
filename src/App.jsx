import { useState, useEffect, useCallback, useRef } from 'react'
import Header from './components/Header'
import Timer from './components/Timer'
import TaskList from './components/TaskList'
import RewardPanel from './components/RewardPanel'
import BreakScreen from './components/BreakScreen'
import LoginScreen from './components/LoginScreen'
import { loadState, saveState } from './utils/storage'
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
  const [showBreak, setShowBreak] = useState(false)
  const [isLongBreak, setIsLongBreak] = useState(false)
  const [breakTimeLeft, setBreakTimeLeft] = useState(0)
  const [showCelebration, setShowCelebration] = useState(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const breakIntervalRef = useRef(null)

  // Request notification permission once on mount
  useEffect(() => { requestNotificationPermission() }, [])

  useEffect(() => {
    const saved = loadState(user.username)
    if (saved) {
      setStars(saved.stars ?? 0)
      setCompletedPomodoros(saved.completedPomodoros ?? 0)
      setInterruptions(saved.interruptions ?? 0)
      setStickers(saved.stickers ?? [])
      setTasks(saved.tasks ?? [])
    }
    setInitialized(true)
  }, [user.username])

  useEffect(() => {
    if (!initialized) return
    saveState(user.username, { stars, completedPomodoros, interruptions, stickers, tasks })
  }, [initialized, user.username, stars, completedPomodoros, interruptions, stickers, tasks])

  const handlePomodoroComplete = useCallback(() => {
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
      setIsLongBreak(n % 4 === 0)
      setBreakTimeLeft(n % 4 === 0 ? 15 * 60 : 5 * 60)
      setShowBreak(true)
      setIsTimerRunning(false)
      return n
    })
  }, [])

  const handleBreakEnd = useCallback(() => {
    playChime('break_end')
    sendNotification('⏰ 休息结束！', '准备好了吗？开始下一次专注 🌱')
    setShowBreak(false)
  }, [])
  const handleInterrupt = useCallback(() => setInterruptions(i => i + 1), [])

  useEffect(() => {
    if (!showBreak) { clearInterval(breakIntervalRef.current); return }
    breakIntervalRef.current = setInterval(() => {
      setBreakTimeLeft(t => {
        if (t <= 1) { clearInterval(breakIntervalRef.current); setShowBreak(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(breakIntervalRef.current)
  }, [showBreak])

  const handleAddTask = useCallback((taskData) => {
    setTasks(prev => [...prev, {
      id: Date.now(),
      text: taskData.text,
      emoji: taskData.emoji,
      estimated: taskData.estimated_pomodoros,
      completed: 0,
      done: false,
    }])
  }, [])

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
        />
        <TaskList
          tasks={tasks}
          setTasks={setTasks}
          onAddTask={handleAddTask}
          onInterrupt={handleInterrupt}
          isTimerRunning={isTimerRunning}
        />
        <RewardPanel stars={stars} stickers={stickers} completedPomodoros={completedPomodoros} />
        <p className="app-footer-tip">专注25分钟 🌱 休息5分钟 · 4次专注后大休息 🌙</p>
      </main>

      {showBreak && (
        <BreakScreen
          isLong={isLongBreak}
          timeLeft={breakTimeLeft}
          onSkip={() => setShowBreak(false)}
          completedPomodoros={completedPomodoros}
          stars={stars}
        />
      )}

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
    try { return JSON.parse(localStorage.getItem('pomodoro_user')) } catch { return null }
  })

  const handleLogin = (userData) => {
    localStorage.setItem('pomodoro_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('pomodoro_user')
    setUser(null)
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />
  return <MainApp user={user} onLogout={handleLogout} />
}
