import { useState, useEffect, useRef, useCallback } from 'react'

export const MODES = {
  FOCUS: { label: '专注时间', duration: 25 * 60, color: '#ef4444' },
  SHORT_BREAK: { label: '短休息', duration: 5 * 60, color: '#22c55e' },
  LONG_BREAK: { label: '长休息', duration: 15 * 60, color: '#3b82f6' },
}

export function useTimer({ onPomodoroComplete, onBreakEnd }) {
  const [mode, setMode] = useState('FOCUS')
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0) // count in current cycle (0-3)
  const intervalRef = useRef(null)

  const currentMode = MODES[mode]

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeLeft(MODES[mode].duration)
  }, [mode, stop])

  const switchMode = useCallback((newMode) => {
    stop()
    setMode(newMode)
    setTimeLeft(MODES[newMode].duration)
  }, [stop])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)

          if (mode === 'FOCUS') {
            const newCount = pomodoroCount + 1
            setPomodoroCount(newCount % 4)
            onPomodoroComplete?.()
            // Auto-switch to break
            const nextMode = newCount % 4 === 0 ? 'LONG_BREAK' : 'SHORT_BREAK'
            setTimeout(() => switchMode(nextMode), 500)
          } else {
            onBreakEnd?.()
            setTimeout(() => switchMode('FOCUS'), 500)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, mode, pomodoroCount, onPomodoroComplete, onBreakEnd, switchMode])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => stop(), [stop])

  const progress = 1 - timeLeft / currentMode.duration

  return {
    mode,
    currentMode,
    timeLeft,
    isRunning,
    pomodoroCount,
    progress,
    start,
    pause,
    reset,
    switchMode,
  }
}
