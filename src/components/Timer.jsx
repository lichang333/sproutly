import { useEffect } from 'react'
import { useTimer, MODES } from '../hooks/useTimer'
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

export default function Timer({ onPomodoroComplete, onBreakEnd, onRunningChange, onModeStart }) {
  const { mode, timeLeft, isRunning, pomodoroCount, progress, start, pause, reset, switchMode } =
    useTimer({ onPomodoroComplete, onBreakEnd })

  useEffect(() => { onRunningChange?.(isRunning) }, [isRunning, onRunningChange])

  const handleStart = () => {
    const modeMap = { FOCUS: 'focus', SHORT_BREAK: 'short_break', LONG_BREAK: 'long_break' }
    onModeStart?.(modeMap[mode])
    start()
  }

  const cfg = MODE_CONFIG[mode]
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className={`timer-card card ${cfg.bg}`}>
      {/* Mode tabs */}
      <div className="timer-tabs">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`timer-tab ${mode === key ? 'active' : ''}`}
            style={mode === key ? { color: MODE_CONFIG[key].color } : {}}
          >
            {val.label}
          </button>
        ))}
      </div>

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
          <span className="timer-time">{formatTime(timeLeft)}</span>
          <span className="timer-label">{cfg.label}</span>
        </div>
      </div>

      {/* Pomodoro progress dots */}
      {mode === 'FOCUS' && (
        <div className="timer-dots">
          {[0,1,2,3].map(i => (
            <div key={i} className={`timer-dot ${i < pomodoroCount ? 'filled' : ''}`}
              style={i < pomodoroCount ? { background: cfg.color } : {}} />
          ))}
          <span className="timer-dots-hint">4次专注后大休息</span>
        </div>
      )}

      {/* Controls */}
      <div className="timer-controls">
        <button className="btn btn-ghost timer-reset" onClick={reset} title="重置">↺</button>
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
