const express = require('express')
const jwt = require('jsonwebtoken')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// 模拟用户数据（后续替换为真实数据库）
const users = [
  { id: 150, username: 'coach', password: 'coach123', real_name: '李教练', role_type: 3, org_id: 1, org_type: 2, partner_level: 3, status: 1 },
  { id: 200, username: 'agency', password: 'agency123', real_name: '张校长', role_type: 2, org_id: 1, org_type: 2, partner_level: 2, status: 1 },
  { id: 1, username: 'admin', password: 'admin123', real_name: '管理员', role_type: 1, org_id: 0, org_type: 0, partner_level: 0, status: 1 }
]

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.json({ success: false, message: '用户名或密码错误' })
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, realName: user.real_name, roleType: user.role_type, orgId: user.org_id, orgType: user.org_type, partnerLevel: user.partner_level },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({
    success: true,
    data: {
      user: { id: user.id, username: user.username, real_name: user.real_name, role_type: user.role_type, org_id: user.org_id, org_type: user.org_type, partner_level: user.partner_level, status: user.status },
      token
    }
  })
})

router.get('/me', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.id)
  if (!user) return res.json({ success: false, message: '用户不存在' })
  res.json({ success: true, data: { id: user.id, username: user.username, real_name: user.real_name, role_type: user.role_type, org_id: user.org_id, status: user.status } })
})

router.post('/register', (req, res) => {
  const { username, password, role_type } = req.body
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: '用户名已存在' })
  }
  const newUser = { id: users.length + 1, username, password, real_name: username, role_type: role_type || 3, org_id: 1, org_type: 2, partner_level: 1, status: 1 }
  users.push(newUser)
  res.json({ success: true, data: { id: newUser.id, username: newUser.username } })
})

module.exports = router
