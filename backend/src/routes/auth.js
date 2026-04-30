const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, role = 'child', inviteCode, invite_code } = req.body
  const expectedInviteCode = (process.env.INVITE_CODE || 'SPROUT2026').trim().toUpperCase()
  const submittedInviteCode = String(inviteCode || invite_code || '').trim().toUpperCase()
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
  if (username.length < 2) return res.status(400).json({ error: '用户名至少2个字符' })
  if (password.length < 4) return res.status(400).json({ error: '密码至少4位' })
  if (!['child', 'parent'].includes(role)) return res.status(400).json({ error: '无效角色' })
  if (!submittedInviteCode) return res.status(400).json({ error: '请输入邀请码' })
  if (submittedInviteCode !== expectedInviteCode) return res.status(403).json({ error: '邀请码不正确' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username.trim(), hash, role]
    )
    res.status(201).json({ token: sign(rows[0]), user: rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: '用户名已存在' })
    throw err
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })

  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()])
  if (!rows.length) return res.status(401).json({ error: '用户名不存在' })

  const valid = await bcrypt.compare(password, rows[0].password)
  if (!valid) return res.status(401).json({ error: '密码错误' })

  const { password: _, ...user } = rows[0]
  res.json({ token: sign(user), user })
})

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'User not found' })
  res.json(rows[0])
})

module.exports = router
