require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/sessions',      require('./routes/sessions'))
app.use('/api/tasks',         require('./routes/tasks'))
app.use('/api/interruptions', require('./routes/interruptions'))
app.use('/api/stickers',      require('./routes/stickers'))
app.use('/api/stats',         require('./routes/stats'))

app.get('/api/health', (_, res) => res.json({ ok: true }))

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🍅 Server running on http://localhost:${PORT}`))
