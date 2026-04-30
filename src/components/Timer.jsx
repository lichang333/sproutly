import { useEffect } from 'react'
import { useTimer, MODES } from '../hooks/useTimer'
import { unlockAudio } from '../utils/notify'
import './Timer.css'

const SIZE = 220
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const MODE_CONFIG = {
  FOCUS:       { emoji: '🌱', label: '专注时间', color: '#58CC02', shadow: '#389E00', bg: 'timer-bg-sprout' },
  SHORT_BREAK: { emoji: '💧', label: '短休息',   color: '#1CB0F6', shadow: '#0A85C2', bg: 'timer-bg-water'  },
  LONG_BREAK:  { emoji: '🌙', label: '长休息',   color: '#CE82FF', shadow: '#9B4FCC', bg: 'timer-bg-night'  },
}

const SHORT_ACTIVITIES = [
  { emoji: '💧', text: '喝一杯水' },
  { emoji: '🙆', text: '伸展手臂' },
  { emoji: '👀', text: '闭眼休息' },
  { emoji: '😊', text: '和旁边人说话' },
]

const LONG_ACTIVITIES = [
  { emoji: '🚶', text: '起来走一走' },
  { emoji: '🍎', text: '吃点健康零食' },
  { emoji: '🎵', text: '听一首喜欢的歌' },
  { emoji: '🌤️', text: '看看窗外' },
]

export default function Timer({ onPomodoroComplete, onBreakEnd, onRunningChange, onModeStart, onFocusAbort }) {
  const { mode, timeLeft, isRunning, pomodoroCount, progress, start, pause, reset, switchMode } =
    useTimer({ onPomodoroComplete, onBreakEnd })

  useEffect(() => { onRunningChange?.(isRunning) }, [isRunning, onRunningChange])

  const handleStart = () => {
    unlockAudio()
    const modeMap = { FOCUS: 'focus', SHORT_BREAK: 'short_break', LONG_BREAK: 'long_break' }
    onModeStart?.(modeMap[mode])
    start()
  }

  const handleReset = () => {
    unlockAudio()
    if (mode === 'FOCUS' && progress > 0) {
      onFocusAbort?.()
    }
    reset()
  }

  const cfg = MODE_CONFIG[mode]
  const dashOffset = CIRCUMFERENCE * progress
  const isPaused = !isRunning && progress > 0 && progress < 1

  return (
    <div className={`timer-card card ${cfg.bg}`}>
      {/* SVG ring */}
      <div className="timer-ring-wrap">
        <svg width={SIZE} height={SIZE} className="timer-svg">
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" stroke="var(--timer-track)" strokeWidth={STROKE} />
          <circle
            cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
            stroke={cfg.color} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <div className="timer-center">
          <span className="timer-emoji">{cfg.emoji}</span>
          <span className="timer-time" style={{ opacity: isPaused ? 0.4 : 1, transition: 'opacity 0.3s ease' }}>
            {formatTime(timeLeft)}
          </span>
          <span className="timer-label">{cfg.label}</span>
        </div>
      </div>

      {/* Info Section (Dots & Activities) */}
      <div className="timer-info-section" style={{ minHeight: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
        {/* Pomodoro progress dots (Always visible) */}
        <div className="timer-dots" style={{ marginBottom: mode !== 'FOCUS' ? '12px' : '0' }}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`timer-dot ${i < pomodoroCount ? 'filled' : ''}`}
              style={i < pomodoroCount ? { background: cfg.color } : {}} />
          ))}
          <span className="timer-dots-hint">4次专注后大休息</span>
        </div>

        {/* Break Activities */}
        {mode !== 'FOCUS' && (
          <div className="timer-break-activities" style={{ width: '100%', textAlign: 'center', animation: 'fade-in 0.3s ease' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>休息期间可以：</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(mode === 'LONG_BREAK' ? LONG_ACTIVITIES : SHORT_ACTIVITIES).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', color: 'var(--text-main)', border: '2px solid var(--border)' }}>
                  <span>{a.emoji}</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="timer-controls">
        <button className="btn btn-ghost timer-reset" onClick={handleReset} title="重置">↺</button>
        <button
          className="timer-play-btn"
          style={{ background: cfg.color, boxShadow: `0 5px 0 ${cfg.shadow}` }}
          onClick={isRunning ? pause : handleStart}
          aria-label={isRunning ? '暂停' : '开始'}
        >
          <span className={`timer-play-icon ${isRunning ? 'pause' : 'play'}`} aria-hidden="true" />
        </button>
        <div style={{ width: 44 }} />
      </div>
    </div>
  )
}
