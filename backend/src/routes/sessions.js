const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// POST /api/sessions/start — 开始一个计时段
router.post('/start', async (req, res) => {
  const { mode } = req.body  // 'focus' | 'short_break' | 'long_break'
  if (!['focus', 'short_break', 'long_break'].includes(mode)) {
    return res.status(400).json({ error: '无效 mode' })
  }
  const { rows } = await pool.query(
    `INSERT INTO pomodoro_sessions (user_id, mode, started_at)
     VALUES ($1, $2, NOW()) RETURNING *`,
    [req.user.id, mode]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/sessions/:id/complete — 完成一个计时段
router.patch('/:id/complete', async (req, res) => {
  const { interrupted = false } = req.body
  const { rows } = await pool.query(
    `UPDATE pomodoro_sessions
     SET ended_at = NOW(), completed = TRUE, interrupted = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [interrupted, req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Session not found' })
  res.json(rows[0])
})

// PATCH /api/sessions/:id/abandon — 放弃（烂番茄）
router.patch('/:id/abandon', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE pomodoro_sessions
     SET ended_at = NOW(), completed = FALSE, interrupted = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ error: 'Session not found' })
  res.json(rows[0])
})

// GET /api/sessions?date=YYYY-MM-DD — 查询某天的会话
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query(
    'SELECT * FROM pomodoro_sessions WHERE user_id = $1 AND date = $2 ORDER BY started_at',
    [req.user.id, date]
  )
  res.json(rows)
})

module.exports = router
