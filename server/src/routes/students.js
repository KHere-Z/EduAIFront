const express = require('express')
const { authMiddleware, roleGuard } = require('../middleware/auth')

const router = express.Router()

// 学员数据（模拟）
let students = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `学员${i + 1}`,
  age: 8 + Math.floor(Math.random() * 10),
  level: ['初级', '中级', '高级'][i % 3],
  coach_id: 150,
  org_id: 1,
  words_learned: Math.floor(Math.random() * 500),
  lexile_score: Math.floor(Math.random() * 800) + 200,
  status: 1,
  created_at: new Date().toISOString()
}))

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  let list = students
  if (req.user.roleType === 3) list = students.filter(s => s.coach_id === req.user.id)
  const start = (page - 1) * pageSize
  const paginated = list.slice(start, start + parseInt(pageSize))
  res.json({ success: true, data: { list: paginated, total: list.length, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/:id', authMiddleware, (req, res) => {
  const student = students.find(s => s.id == req.params.id)
  if (!student) return res.json({ success: false, message: '学员不存在' })
  res.json({ success: true, data: student })
})

router.post('/', authMiddleware, (req, res) => {
  const newStudent = { id: students.length + 1, ...req.body, created_at: new Date().toISOString() }
  students.push(newStudent)
  res.json({ success: true, data: newStudent })
})

module.exports = router
