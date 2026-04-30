const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

router.use(auth)

// GET /api/stats/daily?days=7 — 最近N天每日汇总
router.get('/daily', async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 90)
  const { rows } = await pool.query(
    `SELECT * FROM daily_stats
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY date DESC`,
    [req.user.id]
  )
  res.json(rows)
})

// GET /api/stats/summary — 总体统计（所有时间）
router.get('/summary', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)        FILTER (WHERE mode = 'focus' AND completed = TRUE)  AS total_pomodoros,
       COUNT(*)        FILTER (WHERE mode = 'focus' AND completed = TRUE) * 25 AS total_focus_minutes,
       COUNT(DISTINCT date)                                                  AS total_days,
       (SELECT COUNT(*) FROM interruptions WHERE user_id = $1)              AS total_interruptions,
       (SELECT COUNT(*) FROM stickers WHERE user_id = $1)                   AS total_stickers,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND done = TRUE)      AS total_tasks_done
     FROM pomodoro_sessions
     WHERE user_id = $1`,
    [req.user.id]
  )
  res.json(rows[0])
})

// GET /api/stats/sessions?date=YYYY-MM-DD — 某天详细时间线
router.get('/sessions', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const { rows } = await pool.query(
    `SELECT
       s.*,
       (SELECT json_agg(i ORDER BY i.created_at)
        FROM interruptions i
        WHERE i.session_id = s.id) AS interruptions
     FROM pomodoro_sessions s
     WHERE s.user_id = $1 AND s.date = $2
     ORDER BY s.started_at`,
    [req.user.id, date]
  )
  res.json(rows)
})

// GET /api/stats/heatmap?weeks=12 — 热力图数据（类似 GitHub 贡献图）
router.get('/heatmap', async (req, res) => {
  const weeks = Math.min(parseInt(req.query.weeks) || 12, 52)
  const { rows } = await pool.query(
    `SELECT
       date,
       COUNT(*) FILTER (WHERE mode = 'focus' AND completed = TRUE) AS pomodoros,
       COUNT(*) FILTER (WHERE mode = 'focus' AND completed = TRUE) * 25 AS focus_minutes
     FROM pomodoro_sessions
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${weeks} weeks'
     GROUP BY date
     ORDER BY date`,
    [req.user.id]
  )
  res.json(rows)
})

module.exports = router
