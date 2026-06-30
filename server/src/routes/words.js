const express = require('express')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

const sampleWords = [
  { id: 1, word: 'abandon', chinese: '放弃', level: 'CET4', category: '动词', example: 'They had to abandon the plan.' },
  { id: 2, word: 'ability', chinese: '能力', level: 'CET4', category: '名词', example: 'She has the ability to lead.' },
  { id: 3, word: 'abroad', chinese: '在国外', level: 'CET4', category: '副词', example: 'He went abroad last year.' },
  { id: 4, word: 'academic', chinese: '学术的', level: 'CET4', category: '形容词', example: 'Academic research is important.' },
  { id: 5, word: 'ambitious', chinese: '有雄心的', level: 'CET6', category: '形容词', example: 'She is an ambitious student.' }
]

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query
  const start = (page - 1) * pageSize
  res.json({ success: true, data: { list: sampleWords, total: sampleWords.length, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

module.exports = router
