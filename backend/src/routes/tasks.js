const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 AND date = $2 ORDER BY created_at',
    [req.user.id, date]
  )
  res.json(rows)
})

// POST /api/tasks
router.post('/', async (req, res) => {
  const { text, emoji = '📚', estimated_pomodoros = 2 } = req.body
  if (!text?.trim()) return res.status(400).json({ error: '任务内容不能为空' })
  const { rows } = await pool.query(
    `INSERT INTO tasks (user_id, text, emoji, estimated_pomodoros)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, text.trim(), emoji, estimated_pomodoros]
  )
  res.status(201).json(rows[0])
})

// PATCH /api/tasks/:id — 更新任务（完成番茄数 / 标记完成）
router.patch('/:id', async (req, res) => {
  const { completed_pomodoros, done } = req.body
  const updates = []
  const values = []
  let idx = 1

  const { completed_pomodoros, done, text, emoji, estimated_pomodoros } = req.body
  if (completed_pomodoros !== undefined) {
    updates.push(`completed_pomodoros = $${idx++}`)
    values.push(completed_pomodoros)
  }
  if (done !== undefined) {
    updates.push(`done = $${idx++}`)
    values.push(done)
    if (done) { updates.push(`done_at = NOW()`) }
  }
  if (text !== undefined) {
    updates.push(`text = $${idx++}`)
    values.push(text.trim())
  }
  if (emoji !== undefined) {
    updates.push(`emoji = $${idx++}`)
    values.push(emoji)
  }
  if (estimated_pomodoros !== undefined) {
    updates.push(`estimated_pomodoros = $${idx++}`)
    values.push(estimated_pomodoros)
  }
  if (!updates.length) return res.status(400).json({ error: '无更新内容' })

  values.push(req.params.id, req.user.id)
  const { rows } = await pool.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`,
    values
  )
  if (!rows.length) return res.status(404).json({ error: 'Task not found' })
  res.json(rows[0])
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Task not found' })
  res.status(204).end()
})

module.exports = router
