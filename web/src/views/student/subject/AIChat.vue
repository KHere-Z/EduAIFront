<template>
  <div class="ac-page">
    <router-link :to="`/student/subject/${subject}`" class="back-link">← 返回学科中心</router-link>
    <!-- Hero 头部 -->
    <div class="ac-hero">
      <div class="ac-emoji">💬</div>
      <h2>AI 智能聊天</h2>
      <p>学习答疑 · 解题辅导 · 知识问答 — 随时提问，AI 即时解答</p>
    </div>

    <!-- 聊天卡片 -->
    <div class="chat-card">
      <!-- 消息区域 -->
      <div class="chat-messages" ref="chatBox">
        <!-- 欢迎引导 -->
        <div v-if="messages.length === 0" class="welcome-area">
          <div class="welcome-icon">🤖</div>
          <h3>Hi～我是你的 AI 学习助手</h3>
          <p>无论是解题思路、知识点讲解还是学习方法，都可以问我！</p>
          <div class="quick-grid">
            <div class="qg-item" v-for="qc in quickTopics" :key="qc.title" @click="sendQuick(qc.prompt)">
              <span class="qgi-emoji">{{ qc.emoji }}</span>
              <span class="qgi-title">{{ qc.title }}</span>
              <span class="qgi-desc">{{ qc.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 聊天消息 -->
        <div v-for="(msg, i) in messages" :key="i" :class="['msg-row', msg.role]">
          <div class="msg-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
          <div class="msg-body">
            <!-- 文本消息 -->
            <div v-if="msg.text" class="msg-bubble" v-html="msg.text"></div>
            <!-- 文件附件 -->
            <div v-if="msg.files && msg.files.length" class="msg-files">
              <div v-for="(f, fi) in msg.files" :key="fi" class="msg-file-item">
                <template v-if="f.type === 'image'">
                  <img :src="f.url" class="msg-img" @click="previewImg = f.url; showPreview = true" />
                </template>
                <template v-else>
                  <div class="msg-doc">
                    <span class="md-icon">{{ f.icon }}</span>
                    <span class="md-name">{{ f.name }}</span>
                    <span class="md-size">{{ f.size }}</span>
                  </div>
                </template>
              </div>
            </div>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- 输入中动画 -->
        <div v-if="typing" class="msg-row ai">
          <div class="msg-avatar">AI</div>
          <div class="msg-body">
            <div class="typing-dots"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>

      <!-- 已选文件预览 -->
      <div v-if="pendingFiles.length" class="pending-files">
        <div v-for="(pf, i) in pendingFiles" :key="i" class="pf-item">
          <template v-if="pf.type === 'image'">
            <img :src="pf.url" class="pf-thumb" />
          </template>
          <template v-else>
            <span class="pf-icon">{{ pf.icon }}</span>
          </template>
          <span class="pf-name">{{ pf.name }}</span>
          <span class="pf-remove" @click="pendingFiles.splice(i, 1)">✕</span>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
        <div class="ci-tools">
          <!-- 上传图片 -->
          <label class="ci-btn" title="上传图片">
            🖼️
            <input type="file" accept="image/*" multiple hidden @change="onFileChange($event, 'image')" />
          </label>
          <!-- 上传PDF -->
          <label class="ci-btn" title="上传PDF">
            📄
            <input type="file" accept=".pdf" hidden @change="onFileChange($event, 'pdf')" />
          </label>
          <!-- 上传Word -->
          <label class="ci-btn" title="上传Word">
            📝
            <input type="file" accept=".doc,.docx" hidden @change="onFileChange($event, 'word')" />
          </label>
        </div>
        <div class="ci-input-row">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="输入你的问题，AI 为你解答…"
            :disabled="typing"
            resize="none"
            @keydown.enter.exact.prevent="send"
            @paste="onPaste"
          />
        </div>
        <div class="ci-send-row">
          <span class="ci-hint">Enter 发送 / Shift+Enter 换行</span>
          <el-button type="primary" @click="send" :disabled="!canSend || typing" :loading="typing">
            {{ typing ? '思考中…' : '发送' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <el-dialog v-model="showPreview" title="图片预览" width="90%" :append-to-body="true">
      <img :src="previewImg" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { streamChat } from '@/api/streamAI'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const subject = computed(() => route.params.subject || 'math')

const inputText = ref('')
const messages = ref([])
const typing = ref(false)
const chatBox = ref(null)
const pendingFiles = ref([])
const showPreview = ref(false)
const previewImg = ref('')

const canSend = computed(() => inputText.value.trim() || pendingFiles.value.length)

const quickTopics = [
  { emoji: '🧮', title: '解数学题', desc: '函数、几何、方程…', prompt: '帮我讲解一道数学题：已知二次函数 y=x²-4x+3，求最小值' },
  { emoji: '📝', title: '写作辅导', desc: '作文思路、语法纠错', prompt: '帮我看看这篇作文怎么写：主题是"我的梦想"' },
  { emoji: '📖', title: '知识点讲解', desc: '概念、定理、公式', prompt: '请给我讲解一下勾股定理的推导过程和常见应用' },
  { emoji: '🎯', title: '学习方法', desc: '记忆技巧、时间规划', prompt: '我的数学总是学不好，有什么好的学习方法和建议吗？' },
  { emoji: '🧪', title: '实验探究', desc: '理化生实验题', prompt: '物理实验中，如何用伏安法测电阻？请说明步骤和注意事项' },
  { emoji: '🗣️', title: '英语学习', desc: '语法、词汇、翻译', prompt: '帮我区分一下英语中的过去完成时和现在完成时' },
]

function onFileChange(e, category) {
  const files = Array.from(e.target.files || [])
  files.forEach(f => {
    if (category === 'image') {
      const url = URL.createObjectURL(f)
      pendingFiles.value.push({ name: f.name, size: formatSize(f.size), type: 'image', url, icon: '🖼️', file: f })
    } else if (category === 'pdf') {
      pendingFiles.value.push({ name: f.name, size: formatSize(f.size), type: 'pdf', url: '', icon: '📕', file: f })
    } else if (category === 'word') {
      pendingFiles.value.push({ name: f.name, size: formatSize(f.size), type: 'word', url: '', icon: '📝', file: f })
    }
  })
  e.target.value = ''
}

function onPaste(e) {
  const items = e.clipboardData?.items || []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      const url = URL.createObjectURL(blob)
      const name = `paste-${Date.now()}.png`
      pendingFiles.value.push({ name, size: formatSize(blob.size), type: 'image', url, icon: '🖼️', file: blob })
      return
    }
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxW = 1600, maxH = 1600
        let w = img.width, h = img.height
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h)
          w = Math.round(w * ratio); h = Math.round(h * ratio)
        }
        const padX = Math.round(w * 0.08), padY = Math.round(h * 0.08)
        const canvas = document.createElement('canvas')
        canvas.width = w + padX * 2; canvas.height = h + padY * 2
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, padX, padY, w, h)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function sendQuick(text) {
  inputText.value = text
  send()
}

async function send() {
  if (!canSend.value || typing.value) return
  const text = inputText.value.trim()
  const files = [...pendingFiles.value]
  inputText.value = ''
  pendingFiles.value = []

  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  messages.value.push({ role: 'user', text, files, time: timeStr })
  scrollBottom()

  typing.value = true
  try {
    // 图片转 base64 直接发送（DeepSeek 可直接读取 data URL）
    let imageUrl = ''
    const imgFiles = files.filter(f => f.type === 'image' && f.file)
    if (imgFiles.length > 0) {
      imageUrl = await fileToBase64(imgFiles[0].file)
    }

    const aiMessages = messages.value
      .filter(m => m.text)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))

    // 流式输出：先占位，逐块显示原文，结束后再渲染 markdown
    const aiMsg = { role: 'ai', text: '', files: [], time: timeStr }
    messages.value.push(aiMsg)
    scrollBottom()

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const rawText = await new Promise((resolve, reject) => {
      streamChat(
        { messages: aiMessages, imageUrl },
        {
          onChunk: (token, full) => {
            aiMsg.text = `<div style="white-space:pre-wrap">${esc(full)}</div>`
            scrollBottom()
          },
          onDone: (full) => resolve(full || 'AI 未返回内容'),
          onError: (msg) => reject(new Error(msg))
        }
      )
    })
    aiMsg.text = await renderMarkdown(rawText)
  } catch (e) {
    messages.value.push({ role: 'ai', text: '⚠️ AI 服务暂时不可用：' + (e?.message || '网络错误'), files: [], time: timeStr })
  }
  typing.value = false
  scrollBottom()
}

// 保留 generateReply 作为 fallback（AI 不可用时降级）
function _generateReplyFallback(text, files) {
  const hasImg = files.some(f => f.type === 'image')

  if (text.includes('二次函数') || text.includes('最小值') || text.includes('y=x²')) {
    return `<div class="ai-card"><div class="ai-card-title">📈 二次函数问题解答</div>
      <p>对于 <b>y = x² - 4x + 3</b>：</p>
      <p><b>方法一：配方法</b></p>
      <p>y = x² - 4x + 3 = (x² - 4x + 4) - 1 = <b>(x - 2)² - 1</b></p>
      <p>∵ a = 1 > 0，开口向上<br/>∴ 当 <b>x = 2</b> 时取最小值 <b>y = -1</b></p>
      <p><b>方法二：顶点公式</b></p>
      <p>x = -b/(2a) = 4/2 = <b>2</b><br/>y = (4ac-b²)/(4a) = (12-16)/4 = <b>-1</b></p>
      <div class="ai-card-tip">💡 <b>总结：</b>配方法和顶点公式是求二次函数最值的两种核心方法，建议都掌握！</div></div>`
  }

  if (text.includes('勾股定理') || text.includes('推导')) {
    return `<div class="ai-card"><div class="ai-card-title">📐 勾股定理讲解</div>
      <p><b>定理内容：</b>直角三角形中，两条直角边的平方和等于斜边的平方。<br/>即：<b>a² + b² = c²</b></p>
      <p><b>常见证明：</b></p>
      <ol><li><b>面积法：</b>以直角边构造大正方形，用面积关系推导</li><li><b>相似三角形法：</b>作高线分斜边，利用相似比</li></ol>
      <p><b>典型应用：</b></p>
      <ul><li>已知两边求第三边</li><li>判断三角形是否为直角三角形（逆定理）</li><li>坐标平面上两点距离公式</li></ul>
      <div class="ai-card-tip">🎯 <b>记忆口诀：</b>勾三股四弦五（3²+4²=5²）</div></div>`
  }

  if (text.includes('方法') || text.includes('建议') || text.includes('学不好')) {
    return `<div class="ai-card"><div class="ai-card-title">🎯 学习建议</div>
      <p>数学学不好通常有原因，我们来分析一下：</p>
      <p><b>1. 诊断问题根源</b></p>
      <ul><li>是<b>概念不理解</b>？→ 回归课本，把定义吃透</li><li>是<b>计算老出错</b>？→ 强制写步骤，每道题验算</li><li>是<b>题目看不懂</b>？→ 练习"翻译"题目条件</li><li>是<b>缺乏信心</b>？→ 从简单题开始建立正反馈</li></ul>
      <p><b>2. 高效学习方法</b></p>
      <ul><li>📝 <b>错题本：</b>每道错题记录错因+正确解法+同类题</li><li>⏰ <b>番茄工作法：</b>25分钟专注+5分钟休息</li><li>🔄 <b>费曼学习法：</b>把知识点讲给别人听</li><li>📊 <b>定期复盘：</b>每周回顾本周错题</li></ul>
      <div class="ai-card-tip">💪 <b>记住：</b>数学是练出来的，不是看出来的。每天坚持30分钟，一个月见效果！</div></div>`
  }

  if (text.includes('作文') || text.includes('梦想') || text.includes('写作')) {
    return `<div class="ai-card"><div class="ai-card-title">✍️ 写作指导</div>
      <p><b>题目：我的梦想</b></p>
      <p><b>写作框架建议：</b></p>
      <ol><li><b>开头（引子）：</b>用一个场景或名言引入梦想话题</li><li><b>主体1：</b>描述你的梦想是什么，为什么有这个梦想</li><li><b>主体2：</b>你为实现梦想做了什么努力/遇到了什么困难</li><li><b>结尾：</b>展望未来，表达决心</li></ol>
      <p><b>写作技巧：</b></p>
      <ul><li>用具体事例代替空洞描述</li><li>加入细节描写增强画面感</li><li>真情实感最打动人</li></ul></div>`
  }

  if (text.includes('伏安法') || text.includes('电阻') || text.includes('实验')) {
    return `<div class="ai-card"><div class="ai-card-title">🔬 伏安法测电阻实验</div>
      <p><b>原理：</b>R = U / I（欧姆定律）</p>
      <p><b>实验器材：</b>电源、开关、电流表、电压表、滑动变阻器、待测电阻、导线</p>
      <p><b>步骤：</b></p>
      <ol><li>按电路图连接电路（电流表串联，电压表并联）</li><li>闭合开关前，滑动变阻器调到<b>最大阻值</b></li><li>闭合开关，调节滑片，记录多组 U、I 值</li><li>计算每组 R = U/I，取<b>平均值</b></li></ol>
      <p><b>⚠️ 注意事项：</b></p>
      <ul><li>连接时开关必须断开</li><li>电流表"+"进"-"出，不能并联</li><li>多次测量取平均值减小误差</li></ul></div>`
  }

  if (text.includes('英语') || text.includes('完成时') || text.includes('语法')) {
    return `<div class="ai-card"><div class="ai-card-title">📖 英语时态辨析</div>
      <p><b>过去完成时 vs 现在完成时</b></p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0">
        <tr><td style="padding:6px 10px;border:1px solid #e0e0e0;font-weight:700">过去完成时</td><td style="padding:6px 10px;border:1px solid #e0e0e0">had + 过去分词</td></tr>
        <tr><td style="padding:6px 10px;border:1px solid #e0e0e0;font-weight:700">现在完成时</td><td style="padding:6px 10px;border:1px solid #e0e0e0">have/has + 过去分词</td></tr>
      </table>
      <p><b>核心区别：</b></p>
      <ul><li>过去完成时 = <b>过去的过去</b>（发生在过去某一时间之前的动作）<br/>例：I <b>had finished</b> homework before Mom came home.</li>
      <li>现在完成时 = <b>过去到现在</b>（过去发生、影响持续到现在）<br/>例：I <b>have finished</b> my homework.（现在作业是完成状态）</li></ul>
      <div class="ai-card-tip">💡 <b>诀窍：</b>过去完成时需要一个"过去参照点"，现在完成时不需要。</div></div>`
  }

  if (hasImg) {
    return `<div class="ai-card"><div class="ai-card-title">📸 图片已收到</div>
      <p>我已经看到你上传的图片了！为了更好地帮你解答，请告诉我：</p>
      <ul><li>图片中的题目你卡在哪一步？</li><li>你目前已经想到了什么思路？</li><li>有没有尝试过什么方法？</li></ul>
      <p>这样我可以给你更有针对性的指导～</p></div>`
  }

  // 默认通用回复
  return `<div class="ai-card"><div class="ai-card-title">🤖 AI 智能回复</div>
    <p>收到你的问题了！让我来帮你分析一下：</p>
    <p>这是一个很好的问题。建议你从以下几个角度思考：</p>
    <ol><li>先明确问题的<b>核心概念</b>是什么</li><li>回顾相关的<b>基础知识</b>和公式</li><li>尝试<b>分步骤</b>拆解问题</li><li>做完后<b>反向验证</b>结果是否合理</li></ol>
    <p>如果需要更详细的解答，可以给我更多具体信息哦～</p>
    <div class="ai-card-tip">💡 <b>提示：</b>上传题目图片或提供更多细节，我能给出更精准的分析！</div></div>`
}

function scrollBottom() {
  nextTick(() => {
    const el = chatBox.value
    if (el) el.scrollTop = el.scrollHeight
  })
}
</script>

<style scoped>
.ac-page { max-width: 760px; margin: 0 auto; padding: 20px 14px 40px; }

/* Hero */
.ac-hero { text-align: center; padding: 16px 0 8px; }
.ac-emoji { font-size: 48px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.ac-hero h2 { font-size: 22px; font-weight: 800; margin: 6px 0 2px; color: var(--text-primary); }
.ac-hero p { font-size: 13px; color: var(--text-muted); }

/* 聊天卡片 */
.chat-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
  min-height: 480px;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--color-bg);
}

/* 欢迎区 */
.welcome-area { text-align: center; padding: 20px 20px 12px; }
.welcome-icon { font-size: 56px; margin-bottom: 8px; }
.welcome-area h3 { font-size: 18px; color: var(--text-primary); font-weight: 700; margin-bottom: 4px; }
.welcome-area p { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

/* 快速话题网格 */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: left; }
.qg-item {
  padding: 12px; border-radius: 12px; cursor: pointer; transition: all var(--transition);
  background: #fff; border: 1px solid var(--color-border-light);
}
.qg-item:hover { border-color: var(--color-primary-light); box-shadow: var(--shadow-sm); transform: translateY(-2px); }
.qgi-emoji { font-size: 22px; display: block; margin-bottom: 4px; }
.qgi-title { font-size: 13px; font-weight: 600; color: var(--text-primary); display: block; }
.qgi-desc { font-size: 11px; color: var(--text-muted); }

/* 消息行 */
.msg-row { display: flex; gap: 10px; max-width: 88%; }
.msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
.msg-row.ai { align-self: flex-start; }
.msg-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff;
}
.msg-row.user .msg-avatar { background: var(--color-primary); }
.msg-row.ai .msg-avatar { background: linear-gradient(135deg, #8B5CF6, #6366F1); }
.msg-body { max-width: 100%; }

.msg-bubble {
  padding: 12px 16px; border-radius: var(--radius-md);
  font-size: 14px; line-height: 1.75; color: var(--text-primary);
  word-break: break-word;
}
.msg-row.user .msg-bubble { background: var(--color-primary-bg); border-bottom-right-radius: 4px; }
.msg-row.ai .msg-bubble { background: #fff; border-bottom-left-radius: 4px; box-shadow: var(--shadow-sm); }

.msg-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.msg-row.user .msg-time { text-align: right; }

/* 文件附件 */
.msg-files { margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 8px; }
.msg-img { max-width: 200px; max-height: 200px; border-radius: 10px; cursor: pointer; transition: all var(--transition); }
.msg-img:hover { opacity: .85; transform: scale(1.02); }
.msg-doc {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: #fff; border-radius: 8px;
  border: 1px solid var(--color-border); font-size: 12px;
}
.md-icon { font-size: 20px; }
.md-name { color: var(--text-primary); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.md-size { color: var(--text-muted); font-size: 11px; }

/* AI卡片/Markdown 样式 */
.msg-row.ai .msg-bubble :deep(h1), .msg-row.ai .msg-bubble :deep(h2),
.msg-row.ai .msg-bubble :deep(h3), .msg-row.ai .msg-bubble :deep(h4) { margin: 10px 0 6px; font-weight: 700; }
.msg-row.ai .msg-bubble :deep(h3) { font-size: 16px; }
.msg-row.ai .msg-bubble :deep(h4) { font-size: 15px; }
.msg-row.ai .msg-bubble :deep(p) { margin-bottom: 8px; }
.msg-row.ai .msg-bubble :deep(ol), .msg-row.ai .msg-bubble :deep(ul) { padding-left: 20px; margin-bottom: 8px; }
.msg-row.ai .msg-bubble :deep(li) { margin-bottom: 4px; }
.msg-row.ai .msg-bubble :deep(b), .msg-row.ai .msg-bubble :deep(strong) { color: #222; }
.msg-row.ai .msg-bubble :deep(code) { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
.msg-row.ai .msg-bubble :deep(pre) { background: #F8FAFC; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 8px 0; }
.msg-row.ai .msg-bubble :deep(hr) { border: none; border-top: 1px solid #eee; margin: 12px 0; }
.msg-row.ai .msg-bubble :deep(.katex) { font-size: 1.05em; }
.msg-row.ai .msg-bubble :deep(.katex-display) { margin: 10px 0; overflow-x: auto; }
/* 输入中动画 */
.typing-dots { display: flex; gap: 5px; padding: 14px 18px; background: #fff; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary-light); animation: dotBounce 1.4s infinite ease-in-out; }
.typing-dots span:nth-child(2) { animation-delay: .2s; }
.typing-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }

/* 已选文件 */
.pending-files { display: flex; gap: 8px; padding: 10px 16px; flex-wrap: wrap; border-top: 1px solid var(--color-border-light); background: var(--color-bg-alt); }
.pf-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: #fff; border-radius: 8px; border: 1px solid var(--color-border); }
.pf-thumb { width: 32px; height: 32px; object-fit: cover; border-radius: 4px; }
.pf-icon { font-size: 18px; }
.pf-name { font-size: 12px; color: var(--text-secondary); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-remove { cursor: pointer; color: var(--text-muted); font-size: 12px; padding: 2px 4px; }
.pf-remove:hover { color: var(--color-danger); }

/* 输入区 */
.chat-input { border-top: 1px solid var(--color-border); background: #fff; }
.ci-tools { display: flex; gap: 4px; padding: 10px 16px 0; }
.ci-btn {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; cursor: pointer; font-size: 17px; transition: all var(--transition);
}
.ci-btn:hover { background: var(--color-primary-bg); }
.ci-btn input { display: none; }
.ci-input-row { padding: 8px 16px; }
.ci-input-row :deep(.el-textarea__inner) { border-radius: var(--radius-md); font-size: 14px; line-height: 1.6; }
.ci-send-row { display: flex; justify-content: space-between; align-items: center; padding: 0 16px 14px; }
.ci-hint { font-size: 11px; color: var(--text-muted); }

@media (max-width: 480px) {
  .chat-card { height: auto; min-height: 0; }
  .chat-messages { height: 340px; padding: 12px; }
  .msg-row { max-width: 95%; }
  .msg-img { max-width: 140px; max-height: 140px; }
  .quick-grid { grid-template-columns: 1fr 1fr; }
}
</style>
