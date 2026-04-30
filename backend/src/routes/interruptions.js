const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// POST /api/interruptions
router.post('/', async (req, res) => {
  const { session_id, type = 'internal', note = '' } = req.body
  const { rows } = await pool.query(
    `INSERT INTO interruptions (user_id, session_id, type, note)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, session_id || null, type, note]
  )
  res.status(201).json(rows[0])
})

// GET /api/interruptions?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query(
    `SELECT * FROM interruptions WHERE user_id = $1 AND created_at::DATE = $2 ORDER BY created_at`,
    [req.user.id, date]
  )
  res.json(rows)
})

module.exports = router
