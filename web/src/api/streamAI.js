/**
 * AI 流式调用封装（fetch + ReadableStream）
 *
 * 后端流式端点（均为 POST，响应 text/event-stream）：
 *   - /ai/chat/stream           通用聊天
 *   - /ai/wrong-analysis/stream 错题分析
 *   - /ai/exam-analysis/stream  试卷分析
 *
 * 请求体与对应非流式端点完全一致（ChatRequest），模型由后端按模块路由，
 * 前端无需传 model / apiUrl / apiKey。
 *
 * 响应协议：
 *   data: "<JSON编码的token>"\n\n   ← 内容块，JSON.parse 还原（可含换行/特殊字符）
 *   data: [DONE]\n\n               ← 正常结束
 *   data: [ERROR] <中文错误>\n\n    ← 出错
 *
 * 注意：不能用 axios（不支持 ReadableStream），也不能用 EventSource（端点需 POST + 请求体 + 鉴权头）。
 */

const BASE_URL = import.meta.env.VITE_API_BASE || '/api/v1'

async function getToken() {
  // 与 ai.js / request.js 保持一致：从 Pinia 读取（角色隔离存储，避免 localStorage 多 tab 覆盖）
  const { useAuthStore } = await import('@/store/auth')
  return useAuthStore().token
}

/**
 * 通用流式调用
 *
 * @param {string} path    端点路径，如 '/ai/exam-analysis/stream'
 * @param {object} body    请求体（ChatRequest）
 * @param {object} handlers
 *   onChunk(token, fullText)  每收到一块内容回调（token=本次增量，fullText=累计全文）
 *   onDone(fullText)          正常结束
 *   onError(message)          出错（HTTP 错误 / 网络中断 / 后端 [ERROR]）
 *   signal                    AbortSignal，用于取消
 */
export async function streamAI(path, body, { onChunk, onDone, onError, signal } = {}) {
  const token = await getToken()

  let resp
  try {
    resp = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    onError?.('网络异常，请检查网络连接')
    return
  }

  // 非 200：读完整响应体，尝试取后端 Result.message
  if (!resp.ok) {
    let msg = `请求失败 (HTTP ${resp.status})`
    try {
      const text = await resp.text()
      const json = JSON.parse(text)
      if (json && json.message) msg = json.message
    } catch (_) {
      /* ignore */
    }
    onError?.(msg)
    return
  }

  if (!resp.body) {
    onError?.('当前浏览器不支持流式读取')
    return
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''
  let settled = false
  let firstChunk = true

  const handleEvent = (rawEvent) => {
    // 统一换行符后按 \n 切行，取所有 data: 行（SSE 规范：多行 data 用 \n 拼接）
    const dataLines = rawEvent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => {
        // 后端手动加了 data:，Spring SseEmitter 又按 SSE 规范自动加一层，
        // 实际到前端是 data:data:<token>，需剥掉所有多余的 data: 前缀
        let v = l.slice(5)
        while (v.startsWith('data:')) v = v.slice(5).replace(/^ /, '')
        return v
      })
      .filter((v) => v !== '')
    if (dataLines.length === 0) return
    const payload = dataLines.join('\n')

    if (payload === '[DONE]') {
      if (settled) return
      settled = true
      console.log('[streamAI] 完成，全文长度', fullText.length)
      onDone?.(fullText)
      return
    }
    if (payload.startsWith('[ERROR]')) {
      if (settled) return
      settled = true
      onError?.(payload.slice('[ERROR]'.length).trim() || 'AI 调用失败')
      return
    }
    try {
      const tokenText = JSON.parse(payload) // 还原换行/特殊字符
      fullText += tokenText
      if (firstChunk) { firstChunk = false; console.log('[streamAI] 收到首个内容块') }
      onChunk?.(tokenText, fullText)
    } catch (_) {
      // 忽略无法解析的行（心跳/注释等）
    }
  }

  const flush = () => {
    let idx
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      handleEvent(rawEvent)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      // 统一换行符：后端若用 \r\n 分隔 SSE，不归一化会导致 \n\n 切不出事件
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      flush()
    }
    // 流结束：先按 \n\n 处理剩余，再兜底处理无结尾分隔符的残留
    flush()
    if (buffer.trim()) handleEvent(buffer.trim())
    // 后端未发 [DONE]（异常关闭/超时）：兜底按完成处理，避免调用方永久挂起
    if (!settled) {
      const tail = buffer.replace(/\n/g, '\\n').slice(-200)
      console.warn(`[streamAI] 流已关闭但未收到 [DONE] | 已收 ${fullText.length} 字 | 残留buffer末尾: ${tail}`)
      if (fullText) onDone?.(fullText)
      else onError?.('连接已关闭，未收到内容')
    }
  } catch (e) {
    if (e.name === 'AbortError') throw e
    if (!settled) {
      settled = true
      onError?.(fullText ? '连接已中断，已展示部分内容' : '连接已中断')
    }
  }
}

// ---- 三个便捷封装 ----
export const streamChat = (body, handlers) => streamAI('/ai/chat/stream', body, handlers)
export const streamWrongAnalysis = (body, handlers) =>
  streamAI('/ai/wrong-analysis/stream', body, handlers)
export const streamExamAnalysis = (body, handlers) =>
  streamAI('/ai/exam-analysis/stream', body, handlers)
