const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const studentRoutes = require('./routes/students')
const wordRoutes = require('./routes/words')
const classRoutes = require('./routes/classes')
const coachRoutes = require('./routes/coach')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/words', wordRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/coach', coachRoutes)

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

module.exports = app
