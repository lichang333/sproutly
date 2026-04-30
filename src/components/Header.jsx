import './Header.css'

export default function Header({ username, stars, completedPomodoros, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <img className="header-logo" src="/icon.svg" alt="" />
        <div className="header-info">
          <span className="header-appname">小芽专注</span>
          <span className="header-user">👤 {username}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-badge badge-stars">
          <span>⭐</span>
          <span className="badge-count">{stars}</span>
        </div>
        {completedPomodoros > 0 && (
          <div className="header-badge badge-sprout">
            <span>🌱</span>
            <span className="badge-count">{completedPomodoros}</span>
          </div>
        )}
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>退出</button>
      </div>
    </header>
  )
}
