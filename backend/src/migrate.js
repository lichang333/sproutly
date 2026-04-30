require('dotenv').config()
const pool = require('./db')

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,           -- bcrypt hash
  role       TEXT NOT NULL DEFAULT 'child' CHECK (role IN ('child', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pomodoro sessions (每个计时段记录一条)
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode         TEXT NOT NULL CHECK (mode IN ('focus', 'short_break', 'long_break')),
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ,
  completed    BOOLEAN DEFAULT FALSE,
  interrupted  BOOLEAN DEFAULT FALSE,
  date         DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                   SERIAL PRIMARY KEY,
  user_id              INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text                 TEXT NOT NULL,
  emoji                TEXT DEFAULT '📚',
  estimated_pomodoros  INT DEFAULT 2,
  completed_pomodoros  INT DEFAULT 0,
  done                 BOOLEAN DEFAULT FALSE,
  date                 DATE DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  done_at              TIMESTAMPTZ
);

-- Interruptions (每次打断记录一条)
CREATE TABLE IF NOT EXISTS interruptions (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id INT REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
  type       TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'external')),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stickers / rewards
CREATE TABLE IF NOT EXISTS stickers (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji            TEXT NOT NULL,
  pomodoros_at_earn INT,
  earned_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON pomodoro_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date    ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_interruptions_user ON interruptions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stickers_user      ON stickers(user_id, earned_at);

-- Daily stats view
CREATE OR REPLACE VIEW daily_stats AS
SELECT
  u.id                                                                      AS user_id,
  u.username,
  s.date,
  COUNT(*)        FILTER (WHERE s.mode = 'focus' AND s.completed = TRUE)   AS completed_pomodoros,
  COUNT(*)        FILTER (WHERE s.mode = 'focus' AND s.completed = TRUE) * 25
                                                                            AS focus_minutes,
  COUNT(*)        FILTER (WHERE s.interrupted = TRUE)                      AS interrupted_sessions,
  (SELECT COUNT(*) FROM interruptions i
   WHERE i.user_id = u.id AND i.created_at::DATE = s.date)                 AS total_interruptions,
  (SELECT COUNT(*) FROM stickers st
   WHERE st.user_id = u.id AND st.earned_at::DATE = s.date)                AS stickers_earned,
  (SELECT COUNT(*) FROM tasks t
   WHERE t.user_id = u.id AND t.date = s.date AND t.done = TRUE)           AS tasks_completed,
  (SELECT COUNT(*) FROM tasks t
   WHERE t.user_id = u.id AND t.date = s.date)                             AS tasks_total
FROM pomodoro_sessions s
JOIN users u ON u.id = s.user_id
GROUP BY u.id, u.username, s.date;
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(SQL)
    console.log('✅ Database migration complete')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => { console.error('Migration failed:', err); process.exit(1) })
