const router = require('express').Router()
const auth = require('../middleware/auth')
const pool = require('../db')

const TODAY = () => new Date().toISOString().slice(0, 10)

// GET /api/state — load user state, auto-reset daily fields if date changed
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM user_state WHERE user_id = $1',
    [req.user.id]
  )

  if (!rows.length) {
    return res.json({
      date: TODAY(), stars: 0, completed_pomodoros: 0,
      interruptions: 0, stickers: []
    })
  }

  const row = rows[0]
  const today = TODAY()

  // New day — reset daily counters but keep stickers
  if (row.date.toISOString().slice(0, 10) !== today) {
    await pool.query(
      `UPDATE user_state
       SET date=$1, stars=0, completed_pomodoros=0, interruptions=0, updated_at=NOW()
       WHERE user_id=$2`,
      [today, req.user.id]
    )
    return res.json({
      date: today, stars: 0, completed_pomodoros: 0,
      interruptions: 0, stickers: row.stickers
    })
  }

  res.json({
    date: today,
    stars: row.stars,
    completed_pomodoros: row.completed_pomodoros,
    interruptions: row.interruptions,
    stickers: row.stickers,
  })
})

// PUT /api/state — save user state
router.put('/', auth, async (req, res) => {
  const { stars, completed_pomodoros, interruptions, stickers } = req.body
  await pool.query(
    `INSERT INTO user_state (user_id, date, stars, completed_pomodoros, interruptions, stickers, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET date=$2, stars=$3, completed_pomodoros=$4, interruptions=$5, stickers=$6, updated_at=NOW()`,
    [req.user.id, TODAY(), stars ?? 0, completed_pomodoros ?? 0, interruptions ?? 0, JSON.stringify(stickers ?? [])]
  )
  res.json({ ok: true })
})

module.exports = router
