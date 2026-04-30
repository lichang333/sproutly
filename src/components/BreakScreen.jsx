import './BreakScreen.css'

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

function fmt(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` }

export default function BreakScreen({ isLong, timeLeft, onSkip, completedPomodoros, stars }) {
  const activities = isLong ? LONG_ACTIVITIES : SHORT_ACTIVITIES

  return (
    <div className={`break-overlay ${isLong ? 'break-long' : 'break-short'}`}>
      <div className="break-card">
        <div className="break-icon">{isLong ? '😴' : '🌿'}</div>
        <h2 className="break-title">{isLong ? '大休息时间！' : '短暂休息！'}</h2>
        <p className="break-subtitle">
          {isLong ? '完成了4次专注，好好休息一下！' : '休息一会儿，马上回来继续！'}
        </p>

        <div className="break-timer">{fmt(timeLeft)}</div>

        {/* Stats */}
        <div className="break-stats">
          <div className="break-stat">
            <span className="break-stat-val">{stars}</span>
            <span className="break-stat-label">颗星星</span>
          </div>
          <div className="break-stat-divider" />
          <div className="break-stat">
            <span className="break-stat-val">{completedPomodoros}</span>
            <span className="break-stat-label">次专注</span>
          </div>
        </div>

        {/* Activities */}
        <div className="break-activities">
          <p className="break-activities-title">休息期间可以：</p>
          <div className="break-activities-grid">
            {activities.map((a, i) => (
              <div key={i} className="break-activity">
                <span className="break-activity-emoji">{a.emoji}</span>
                <span className="break-activity-text">{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="break-skip" onClick={onSkip}>跳过休息，继续学习</button>
      </div>
    </div>
  )
}
