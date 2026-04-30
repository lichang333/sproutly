import { useState } from 'react'
import './LoginScreen.css'

const INVITE_CODE = (import.meta.env.VITE_INVITE_CODE || 'SPROUT2026').trim().toUpperCase()

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}

function getAccounts() {
  try { return JSON.parse(localStorage.getItem('pomodoro_accounts') || '{}') }
  catch { return {} }
}

function saveAccounts(accounts) {
  localStorage.setItem('pomodoro_accounts', JSON.stringify(accounts))
}

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setError(''); setSuccess('') }

  const handleSubmit = (e) => {
    e.preventDefault(); reset()
    if (!username.trim() || !password) return setError('请输入用户名和密码')
    setLoading(true)

    const accounts = getAccounts()
    const name = username.trim()

    if (tab === 'login') {
      const account = accounts[name]
      if (!account) { setLoading(false); return setError('用户名不存在，请先注册 👇') }
      if (account.passwordHash !== hashPassword(password)) { setLoading(false); return setError('密码错误，再试试吧！') }
      onLogin({ username: name, role: account.role || 'child' })
    } else {
      if (name.length < 2) { setLoading(false); return setError('用户名至少2个字符') }
      if (password.length < 4) { setLoading(false); return setError('密码至少4位') }
      if (!inviteCode.trim()) { setLoading(false); return setError('请输入邀请码') }
      if (inviteCode.trim().toUpperCase() !== INVITE_CODE) { setLoading(false); return setError('邀请码不正确') }
      if (accounts[name]) { setLoading(false); return setError('用户名已存在，请直接登录') }
      accounts[name] = { passwordHash: hashPassword(password), role: 'child', createdAt: Date.now() }
      saveAccounts(accounts)
      setSuccess('注册成功！正在进入...')
      setTimeout(() => onLogin({ username: name, role: 'child' }), 700)
    }
    setLoading(false)
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img className="login-logo-icon" src="/icon.svg" alt="" />
          <h1 className="login-title">小芽专注</h1>
          <p className="login-subtitle">每一次专注，都在长大</p>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); reset() }}>登录</button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); reset() }}>注册</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label className="form-label">用户名</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="你的昵称，比如：小明" className="input" autoComplete="username" />
          </div>
          <div className="form-field">
            <label className="form-label">密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? '至少4位' : '请输入密码'} className="input"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
          </div>
          {tab === 'register' && (
            <div className="form-field">
              <label className="form-label">邀请码</label>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                placeholder="请输入邀请码" className="input" autoComplete="off" />
            </div>
          )}

          {error && <div className="form-error">⚠️ {error}</div>}
          {success && <div className="form-success">✅ {success}</div>}

          <button type="submit" className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '请稍候...' : tab === 'login' ? '开始专注 🌱' : '注册账号 ✨'}
          </button>
        </form>

      </div>
    </div>
  )
}
