import './ActivityLog.css'

const STATUS_ICON = {
  pending: { icon: '⏳', label: '同步中', cls: 'status-pending' },
  ok:      { icon: '✅', label: '已保存', cls: 'status-ok' },
  error:   { icon: '❌', label: '保存失败', cls: 'status-error' },
  local:   { icon: '💾', label: '本地记录', cls: 'status-local' },
}

export default function ActivityLog({ activities = [] }) {
  return (
    <div className="card activity-log-card">
      <h3 className="activity-log-title">今日动态</h3>
      {activities.length === 0 ? (
        <p className="activity-log-empty">开始专注后，记录会显示在这里 🌱</p>
      ) : (
        <div className="activity-log-list">
          {activities.map(a => {
            const time = new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            let colorClass = ''
            if (a.type === 'FOCUS_COMPLETE') colorClass = 'activity-green'
            else if (a.type === 'FOCUS_START') colorClass = 'activity-green-dim'
            else if (a.type === 'FOCUS_ABORT') colorClass = 'activity-red'
            else if (a.type === 'BREAK_START' || a.type === 'BREAK_COMPLETE') colorClass = 'activity-blue'
            const s = STATUS_ICON[a.status] ?? STATUS_ICON.local
            return (
              <div key={a.id} className="activity-log-row">
                <span className="activity-time">{time}</span>
                <span className={`activity-message ${colorClass}`}>{a.message}</span>
                <span className={`activity-status ${s.cls}`} title={s.label}>{s.icon}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
