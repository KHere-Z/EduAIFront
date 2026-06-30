const express = require('express')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

let classes = [
  { id: 1, name: '初级阅读课 A班', coach_id: 150, students_count: 8, schedule: '周一 14:00', status: 1 },
  { id: 2, name: '中级词汇强化班', coach_id: 150, students_count: 6, schedule: '周三 16:00', status: 1 }
]

router.get('/', authMiddleware, (req, res) => {
  let list = classes
  if (req.user.roleType === 3) list = classes.filter(c => c.coach_id === req.user.id)
  res.json({ success: true, data: { list } })
})

router.post('/', authMiddleware, (req, res) => {
  const newClass = { id: classes.length + 1, ...req.body, status: 1 }
  classes.push(newClass)
  res.json({ success: true, data: newClass })
})

module.exports = router
