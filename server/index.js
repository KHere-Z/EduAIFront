const app = require('./src/app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`📖 阅读云英语 API Server running on http://localhost:${PORT}`)
})
