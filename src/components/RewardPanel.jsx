import './RewardPanel.css'

const STICKER_UNLOCKS = ['🎉', '🦁', '🌈', '🚀', '🦋', '🏆', '🌟', '🐉', '🎪', '🦄']

export default function RewardPanel({ stars, stickers, completedPomodoros }) {
  const progressToNext = completedPomodoros % 4

  return (
    <div className="card reward-card">
      <div className="reward-header">
        <h2 className="section-title">🏅 我的奖励</h2>
        <span className="reward-hint">每4次专注解锁贴纸</span>
      </div>

      {/* Progress */}
      <div className="reward-progress-wrap">
        <div className="reward-progress-label">
          <span>距离下一个贴纸</span>
          <span className="reward-progress-count">{progressToNext}/4</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(progressToNext / 4) * 100}%`,
              background: 'linear-gradient(90deg, var(--duo-yellow), var(--duo-orange))'
            }}
          />
        </div>
      </div>

      {/* Stickers */}
      <div className="sticker-grid">
        {stickers.length === 0 ? (
          <p className="reward-empty">完成4次专注解锁第一个贴纸！🌱🌱🌱🌱</p>
        ) : (
          <>
            {stickers.map((s, i) => (
              <div key={i} className="sticker-item" title={`第${i+1}个奖励`}>{s}</div>
            ))}
            {stickers.length < STICKER_UNLOCKS.length && (
              <div className="sticker-locked">🔒</div>
            )}
          </>
        )}
      </div>

      {/* Summary */}
      {completedPomodoros > 0 && (
        <div className="reward-summary">
          今天完成了 <strong>{completedPomodoros}</strong> 次专注，获得 <strong>{stars}</strong> 颗星星！太棒了 ⭐
        </div>
      )}
    </div>
  )
}
