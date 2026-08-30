// ============================================================
// 前端日志采集器
// - 生产环境（import.meta.env.PROD）：拦截全局 console，浏览器控制台不再显示，
//   改为批量上报到后端 /client-log 接口（后端用内存环形缓冲承接，不落盘）。
// - 开发环境：保留原始 console 输出，方便本地调试。
// 需在 main.js 最顶部 import，确保覆盖生效于应用启动最早期。
// ============================================================

const isProd = import.meta.env.PROD

// 原始 console 引用：dev 环境直接透传；prod 环境上报内部不再调用 console，避免递归
const _orig = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
}

// 上报队列 + 节流批量发送
let queue = []
let flushTimer = null
const MAX_BATCH = 20        // 单批最多 20 条
const FLUSH_INTERVAL = 2000 // 2s 内积攒后合并发送
const MAX_MSG = 1000        // 单条消息截断长度，控制请求体积

function serializeArg(a) {
  if (a === null || a === undefined) return String(a)
  if (typeof a === 'string') return a
  if (a instanceof Error) return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack : ''}`
  try { return JSON.stringify(a) } catch { return String(a) }
}

// 从 sessionStorage 读取当前登录身份（token/uid/role），随日志一起上报供后端归集
function readIdentity() {
  try {
    for (const r of [4, 3, 1]) {
      const token = sessionStorage.getItem(`eduai_token_${r}`)
      const user = sessionStorage.getItem(`eduai_user_${r}`)
      if (token) {
        let uid = ''
        if (user) { try { uid = JSON.parse(user)?.id || '' } catch {} }
        return { role: r, uid, token }
      }
    }
  } catch {}
  return { role: null, uid: '', token: '' }
}

function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (!queue.length) return
  const batch = queue.splice(0, queue.length)
  try {
    const { role, uid, token } = readIdentity()
    const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
    // keepalive：页面卸载时也能把最后一批送达
    fetch(`${API_BASE}/client-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, uid, token, entries: batch }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* 静默：日志上报失败不影响业务 */ }
}

function report(level, args) {
  if (!isProd) { _orig[level](...args); return }
  // 生产：隐藏控制台，仅入队上报
  queue.push({
    level,
    msg: args.map(serializeArg).join(' ').slice(0, MAX_MSG),
    url: location.pathname + location.search,
    time: Date.now(),
  })
  if (queue.length >= MAX_BATCH) flush()
  else if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_INTERVAL)
}

if (isProd) {
  console.log = (...a) => report('log', a)
  console.info = (...a) => report('info', a)
  console.warn = (...a) => report('warn', a)
  console.error = (...a) => report('error', a)
  console.debug = (...a) => report('debug', a)
}

// 页面关闭/刷新前冲刷队列
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
}

export default { flush }
