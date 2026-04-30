import { useState } from 'react'
import { auth } from '../lib/api'
import './LoginScreen.css'

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setError(''); setSuccess('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); reset()
    if (!username.trim() || !password) return setError('请输入用户名和密码')
    setLoading(true)

    try {
      let result
      if (tab === 'login') {
        result = await auth.login(username.trim(), password)
      } else {
        result = await auth.register(username.trim(), password, 'child', inviteCode.trim())
        setSuccess('注册成功！正在进入...')
        await new Promise(r => setTimeout(r, 700))
      }
      localStorage.setItem('pomodoro_token', result.token)
      onLogin({ username: result.user.username, role: result.user.role, token: result.token })
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
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
