const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// POST /api/stickers — 解锁贴纸
router.post('/', async (req, res) => {
  const { emoji, pomodoros_at_earn } = req.body
  if (!emoji) return res.status(400).json({ error: 'emoji is required' })
  const { rows } = await pool.query(
    `INSERT INTO stickers (user_id, emoji, pomodoros_at_earn) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.id, emoji, pomodoros_at_earn || null]
  )
  res.status(201).json(rows[0])
})

// GET /api/stickers
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM stickers WHERE user_id = $1 ORDER BY earned_at',
    [req.user.id]
  )
  res.json(rows)
})

module.exports = router
