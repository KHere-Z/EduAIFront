const express = require('express')
const { authMiddleware, roleGuard } = require('../middleware/auth')

const router = express.Router()

router.get('/dashboard', authMiddleware, roleGuard(3), (req, res) => {
  res.json({
    success: true,
    data: {
      student_count: 12,
      today_classes: 3,
      pending_homework: 5,
      student_progress: 78,
      this_week_classes: 15,
      new_students: 2,
      tests_completed: 8,
      readings_completed: 23
    }
  })
})

module.exports = router
