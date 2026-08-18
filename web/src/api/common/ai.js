import http from '@/api/request'

/**
 * AI 聊天 / 错题分析 API
 * 后端 AI 服务（DeepSeek）对接接口
 */

// 发送聊天消息（文本 + 可选文件）
export function sendChatMessage(data) {
  return http.post('/ai/chat', data)
}

// 上传文件（图片/PDF/Word），返回文件URL
export function uploadChatFile(formData) {
  // 不手动设 Content-Type，让浏览器自动补充 multipart/form-data; boundary=xxx
  return http.post('/ai/upload', formData)
}

// 获取聊天历史
export function getChatHistory(params) {
  return http.get('/ai/chat/history', { params })
}

// 清空聊天历史
export function deleteChatHistory(subject) {
  return http.delete('/ai/chat/history', { params: { subject } })
}

// 错题分析 — 上传错题图片并获取AI分析
export function analyzeWrongQuestion(data) {
  return http.post('/ai/wrong-analysis', data)
}

// 试卷分析 — 上传试卷获取AI诊断
export function analyzeExam(data) {
  return http.post('/ai/exam-analysis', data)
}

// 获取AI分析结果
export function getAnalysisResult(analysisId) {
  return http.get(`/ai/analysis/${analysisId}`)
}

// 流式聊天 — 返回 AsyncGenerator，逐块 yield 文本
export async function* sendChatMessageStream(data) {
  const { useAuthStore } = await import('@/store/auth')
  const token = useAuthStore().token
  const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
  const res = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `HTTP ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const text = line.slice(6)
        if (text && text !== '[DONE]') yield text
      }
    }
  }
}
