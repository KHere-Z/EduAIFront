const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'eduai-secret-key-2026'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' })
  }
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleType)) {
      return res.status(403).json({ success: false, message: '权限不足' })
    }
    next()
  }
}

module.exports = { authMiddleware, roleGuard, JWT_SECRET }
