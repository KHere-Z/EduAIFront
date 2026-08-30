<template>
  <div class="wa-page">
    <router-link :to="subjectHome" class="back-link">← 返回学科中心</router-link>

    <div class="wa-layout">
      <!-- ═══════════ 左侧：聊天窗口 ═══════════ -->
      <div class="chat-card">
        <div class="chat-messages" ref="chatBox">
          <div v-if="messages.length === 0" class="welcome-area">
            <svg class="welcome-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/><circle cx="12" cy="12" r="3" fill="var(--color-primary)" opacity=".15"/>
            </svg>
            <h3>AI 错题分析</h3>
            <p>拍照上传错题，AI 自动识别分析</p>
            <div class="quick-chips">
              <span class="qc-chip" v-for="qc in quickChips" :key="qc" @click="sendQuick(qc)">{{ qc }}</span>
            </div>
          </div>

          <div v-for="(msg, i) in messages" :key="i" :class="['msg-row', msg.role]">
            <div class="msg-avatar">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
            <div class="msg-body">
              <div v-if="msg.text" class="msg-bubble" v-html="msg.text"></div>
              <div v-if="msg.files && msg.files.length" class="msg-files">
                <div v-for="(f, fi) in msg.files" :key="fi" class="msg-file-item">
                  <img v-if="f.type==='image'" :src="f.url" class="msg-img" @click="previewImg=f.url;showPreview=true" />
                  <div v-else class="msg-doc"><span class="md-icon">{{ f.icon }}</span><span class="md-name">{{ f.name }}</span><span class="md-size">{{ f.size }}</span></div>
                </div>
              </div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
          </div>

          <div v-if="typing" class="msg-row ai">
            <div class="msg-avatar">AI</div>
            <div class="msg-body"><div class="typing-dots"><span></span><span></span><span></span></div></div>
          </div>
        </div>

        <div v-if="pendingFiles.length" class="pending-files">
          <div v-for="(pf,i) in pendingFiles" :key="i" class="pf-item">
            <img v-if="pf.type==='image'" :src="pf.url" class="pf-thumb" />
            <span v-else class="pf-icon">{{ pf.icon }}</span>
            <span class="pf-name">{{ pf.name }}</span><span class="pf-remove" @click="pendingFiles.splice(i,1)">✕</span>
          </div>
        </div>

        <div class="chat-input">
          <div class="ci-row">
            <label class="ci-upload-btn" title="上传图片">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <input type="file" accept="image/*" multiple hidden @change="onFileChange($event,'image')" />
            </label>
            <el-input v-model="inputText" type="textarea" :rows="1" placeholder="描述错题或粘贴文字…" :disabled="typing" resize="none" @keydown.enter.exact.prevent="send" @paste="onPaste" class="ci-input" />
            <button class="ci-send" @click="send" :disabled="!canSend||typing">
              <span v-if="typing" class="spinner-sm"/>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ 右侧：分析结果面板 ═══════════ -->
      <div class="panel-card">
        <!-- 空状态 -->
        <div v-if="panelStage==='idle'" class="panel-empty">
          <div class="pe-icon">📋</div>
          <div class="pe-text">上传题目图片或输入文字<br/>豆包 AI 将直接识图分析</div>
        </div>

        <!-- 题目原图 -->
        <div class="panel-section" v-if="panelStage!=='idle'">
          <div class="ps-head">
            <span class="psh-icon">📷</span> 题目
            <span class="psh-hint">（豆包 AI 识图提取题目原文）</span>
          </div>
          <!-- 上传后直接显示原图 -->
          <img v-if="panelOriginal" :src="panelOriginal" class="pd-diagram" @click="previewImg=panelOriginal;showPreview=true" title="原图，点击预览" />
          <div v-else-if="panelStage==='loading'" class="ps-loading">⏳ 处理图片中…</div>
          <div v-else class="pd-hint">💡 未上传图片，豆包将按文字描述分析</div>
          <div v-if="panelStage==='recognizing'" class="ps-loading">🔍 豆包识别题目中…</div>
          <!-- 题目内容：识别后直接渲染，点击「编辑」可改 -->
          <div v-if="panelQuestionText && panelStage !== 'loading' && panelStage !== 'recognizing'" class="pq-view">
            <div v-if="!questionEditing" class="pq-render" v-html="questionHtml"></div>
            <el-input v-else v-model="panelQuestionText" type="textarea" :rows="4" placeholder="题目内容（可编辑）" class="pq-input" />
            <div class="pq-toolbar">
              <el-button v-if="!questionEditing" size="small" text type="primary" @click="questionEditing = true">✏️ 编辑</el-button>
              <template v-else>
                <el-button size="small" @click="questionEditing = false">取消</el-button>
                <el-button size="small" type="primary" @click="questionEditing = false">完成</el-button>
              </template>
            </div>
          </div>
          <div v-if="panelStage==='ocr'" class="ps-actions">
            <el-button @click="closePanel" size="small">清空</el-button>
            <el-button type="primary" @click="startAnalysis" size="small" :loading="panelStage==='analyzing'">✅ 开始分析</el-button>
          </div>
          <div v-if="panelStage==='analyzing' && myTask" class="wa-progress">
            <div class="wp-bar"><div class="wp-fill" :style="{ width: myTask.progress + '%' }"></div></div>
            <div class="wp-text">{{ myTask.stageText }} · {{ myTask.progress }}%</div>
          </div>
        </div>

        <!-- 题目配图 -->
        <div class="panel-section" v-if="panelStage!=='idle'" @paste="onDiagramPaste">
          <div class="ps-head">
            <span class="psh-icon">🖼️</span> 题目配图
            <div style="margin-left:auto;display:flex;gap:4px" v-if="panelOriginal">
              <el-upload v-if="panelDiagram" action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="onReplaceDiagram"><el-button size="small" text type="primary">📁 重新配图</el-button></el-upload>
              <el-button size="small" text type="primary" @click="openCropDiagram">✂️ 裁剪配图</el-button>
            </div>
          </div>
          <div v-if="!panelDiagram" class="pd-hint">💡 题目含几何图？点「✂️ 裁剪配图」从原图框选，帮助豆包更准识别</div>
          <img v-if="panelDiagram" :src="panelDiagram" class="pd-diagram" @click="previewImg=panelDiagram;showPreview=true" @paste="onDiagramPaste" title="可直接 Ctrl+V 粘贴图片替换"/>
        </div>

        <!-- 分析计时 -->
        <div class="ps-loading" v-if="panelStage==='analyzing'">⏱ 分析中 {{ elapsedTime }} 秒</div>
        <!-- 标准解答（右侧面板） -->
        <div class="panel-section" v-if="panelSolution">
          <div class="ps-head"><span class="psh-icon">📝</span> 标准解答 <span class="psh-hint">（左侧为完整分析）</span></div>
          <div class="ps-body" v-html="panelSolution"></div>
        </div>

        <!-- 易错点 -->
        <div class="panel-section" v-if="panelMistake">
          <div class="ps-head"><span class="psh-icon">⚠️</span> 易错点</div>
          <div class="ps-body" v-html="panelMistake"></div>
        </div>

        <!-- 知识点 + 难度 -->
        <div class="panel-meta" v-if="panelKp || panelDifficulty">
          <div class="pm-item" v-if="panelKp"><span class="pmi-label">知识点</span><el-tag type="primary" size="small">{{ panelKp?.name || panelKp }}</el-tag></div>
          <div class="pm-item" v-if="panelDifficulty"><span class="pmi-label">难度</span><el-tag :type="diffTag(panelDifficulty)" size="small">{{ panelDifficulty }}</el-tag></div>
        </div>

        <!-- 错题录入 -->
        <div class="panel-section" v-if="panelStage==='done'">
          <div class="ps-head"><span class="psh-icon">📝</span> 错题录入</div>
          <el-input v-model="panelErrorReason" type="textarea" :rows="2" placeholder="请填写错误原因（必填）" class="per-input" />
          <div class="per-actions">
            <el-button @click="closePanel">忽略关闭</el-button>
            <el-button type="primary" @click="addToWrongBook" :disabled="!panelErrorReason.trim()">📥 加入错题库</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 配图裁剪弹窗 -->
    <el-dialog v-model="showCrop" title="✂️ 裁剪配图" width="820px" :close-on-click-modal="false" destroy-on-close>
      <div style="text-align:center;overflow:auto">
        <div class="crop-wrap" ref="cropWrap">
          <img :src="cropSrc" ref="cropImgEl" class="crop-src-img" @load="initCrop" draggable="false"/>
          <div v-if="cropReady" class="crop-box" :style="cropBoxStyle" @pointerdown="startCropDrag('move', $event)">
            <span class="crop-handle ch-nw" @pointerdown.stop="startCropDrag('nw',$event)"></span>
            <span class="crop-handle ch-n" @pointerdown.stop="startCropDrag('n',$event)"></span>
            <span class="crop-handle ch-ne" @pointerdown.stop="startCropDrag('ne',$event)"></span>
            <span class="crop-handle ch-e" @pointerdown.stop="startCropDrag('e',$event)"></span>
            <span class="crop-handle ch-se" @pointerdown.stop="startCropDrag('se',$event)"></span>
            <span class="crop-handle ch-s" @pointerdown.stop="startCropDrag('s',$event)"></span>
            <span class="crop-handle ch-sw" @pointerdown.stop="startCropDrag('sw',$event)"></span>
            <span class="crop-handle ch-w" @pointerdown.stop="startCropDrag('w',$event)"></span>
          </div>
        </div>
      </div>
      <template #footer><el-button @click="showCrop=false">取消</el-button><el-button type="primary" @click="confirmCrop">✅ 提交</el-button></template>
    </el-dialog>

    <el-dialog v-model="showPreview" title="图片预览" width="90%" :append-to-body="true" destroy-on-close>
      <img :src="previewImg" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { analyzeWrongQuestion } from '@/api/common/ai'
import { streamWrongAnalysis } from '@/api/streamAI'
import { renderMarkdown } from '@/utils/markdown'
import { getKnowledgePoints } from '@/api/common/knowledge'
import { useAuthStore } from '@/store/auth'
import { useAiTaskStore } from '@/store/aiTask'
import { usePointsStore } from '@/store/points'
import http from '@/api/request'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const aiTask = useAiTaskStore()
const subject = computed(() => route.params.subject || 'math')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const subjectHome = computed(() => isTeacher.value ? `/teacher/subject/${subject.value}` : `/student/subject/${subject.value}`)
const studentGrade = computed(() => auth.user?.grade || '初三')

const inputText = ref('')
const messages = ref([])
const typing = ref(false)
const chatBox = ref(null)
const pendingFiles = ref([])
const showPreview = ref(false)
const previewImg = ref('')
const canSend = computed(() => inputText.value.trim() || pendingFiles.value.length)

const quickChips = [
  '这道题我不会，请帮我分析错因',
  '拍照上传了一道几何题，帮我讲解',
  '最近总是计算粗心怎么办？',
  '帮我举一反三出3道类似题',
  '请分析这道题的考点和解题思路',
]

// ═══════════ 右侧面板 ═══════════
const panelStage = ref('idle') // idle | loading | recognizing | ocr | analyzing | done
const panelOriginal = ref('')  // 上传的原图 base64（豆包直接识图）
const panelQuestionText = ref('')  // 用户文字说明（可选）
const panelSolution = ref('')
const panelSolutionRaw = ref('')  // 原始纯文本，用于保存
const panelMistake = ref('')  // 易错点（从完整分析精炼）
const panelDiagram = ref('')  // 用户裁剪的题目配图URL
const panelKp = ref(null)
const panelDifficulty = ref('')
const panelErrorReason = ref('')
const myTaskId = ref('')
const myTask = computed(() => aiTask.tasks.find(t => t.id === myTaskId.value))

// 题目识别结果：默认渲染，可切换编辑
const questionEditing = ref(false)
const questionHtml = ref('')
watch(panelQuestionText, async (v) => {
  questionHtml.value = v ? await renderMarkdown(wrapLatex(v)) : ''
})

function applyResult(r) {
  if (!r) return
  panelStage.value = 'done'
  panelOriginal.value = r.panelOriginal || ''
  panelQuestionText.value = r.panelQuestionText || ''
  panelDiagram.value = r.panelDiagram || ''
  panelSolution.value = r.panelSolution || ''
  panelSolutionRaw.value = r.panelSolutionRaw || ''
  panelMistake.value = r.panelMistake || ''
  panelKp.value = r.panelKp || null
  panelDifficulty.value = r.panelDifficulty || ''
}
function restoreFromTask(t) { applyResult(t?.result) }

// 结果持久化到 sessionStorage：切出页面/刷新后仍能恢复（store 的 task 会超时清理）
const resultKey = 'eduai_result_' + route.path
function saveResult() {
  try {
    sessionStorage.setItem(resultKey, JSON.stringify({
      panelOriginal: panelOriginal.value, panelQuestionText: panelQuestionText.value,
      panelDiagram: panelDiagram.value, panelSolution: panelSolution.value, panelSolutionRaw: panelSolutionRaw.value, panelMistake: panelMistake.value,
      panelKp: panelKp.value, panelDifficulty: panelDifficulty.value,
    }))
  } catch {}
}
function restoreSaved() {
  try { const raw = sessionStorage.getItem(resultKey); if (raw) applyResult(JSON.parse(raw)) } catch {}
}

// 切出页面后分析仍在后台跑：挂载时恢复进度/结果
onMounted(() => {
  restoreSaved()
  const t = aiTask.taskForRoute(route.fullPath)
  if (t) {
    myTaskId.value = t.id
    if (t.status === 'done') restoreFromTask(t)
    else if (t.status === 'running') panelStage.value = 'analyzing'
  }
})
watch(() => myTask.value?.status, (s) => { if (s === 'done') { restoreFromTask(myTask.value); restoreSaved() } })

// 裁剪相关（拖拽框选模式）
const showCrop = ref(false)
const cropSrc = ref('')
const cropImgEl = ref(null)
const cropWrap = ref(null)
const cropReady = ref(false)
const cropRect = reactive({ x: 0, y: 0, w: 0, h: 0 })
let cropDragHandle = ''
let cropDragStart = null
const cropBoxStyle = computed(() => ({ left: cropRect.x + 'px', top: cropRect.y + 'px', width: cropRect.w + 'px', height: cropRect.h + 'px' }))

function openCropDiagram() {
  if (!panelOriginal.value) { ElMessage.warning('请先上传题目原图'); return }
  cropSrc.value = panelOriginal.value; cropReady.value = false; showCrop.value = true
}
function initCrop() {
  const img = cropImgEl.value; if (!img) return
  const w = img.clientWidth || img.naturalWidth; const h = img.clientHeight || img.naturalHeight
  const cw = w * 0.8, ch = h * 0.8
  cropRect.x = (w - cw) / 2; cropRect.y = (h - ch) / 2; cropRect.w = cw; cropRect.h = ch
  cropReady.value = true
}
function startCropDrag(handle, e) {
  const img = cropImgEl.value; if (!img) return
  cropDragHandle = handle
  cropDragStart = { x: e.clientX, y: e.clientY, left: cropRect.x, top: cropRect.y, right: cropRect.x + cropRect.w, bottom: cropRect.y + cropRect.h, imgW: img.clientWidth || img.naturalWidth, imgH: img.clientHeight || img.naturalHeight }
  window.addEventListener('pointermove', onCropMove); window.addEventListener('pointerup', onCropUp)
  e.preventDefault()
}
function onCropMove(e) {
  if (!cropDragStart) return
  const dx = e.clientX - cropDragStart.x, dy = e.clientY - cropDragStart.y, MIN = 20
  let { left, top, right, bottom, imgW, imgH } = cropDragStart
  if (cropDragHandle === 'move') {
    const w = right - left, h = bottom - top
    left = Math.max(0, Math.min(cropDragStart.left + dx, imgW - w)); top = Math.max(0, Math.min(cropDragStart.top + dy, imgH - h))
    right = left + w; bottom = top + h
  } else {
    if (cropDragHandle.includes('w')) left = cropDragStart.left + dx
    if (cropDragHandle.includes('e')) right = cropDragStart.right + dx
    if (cropDragHandle.includes('n')) top = cropDragStart.top + dy
    if (cropDragHandle.includes('s')) bottom = cropDragStart.bottom + dy
    left = Math.max(0, Math.min(left, right - MIN)); right = Math.min(imgW, Math.max(right, left + MIN))
    top = Math.max(0, Math.min(top, bottom - MIN)); bottom = Math.min(imgH, Math.max(bottom, top + MIN))
  }
  cropRect.x = left; cropRect.y = top; cropRect.w = right - left; cropRect.h = bottom - top
}
function onCropUp() {
  cropDragHandle = ''; cropDragStart = null
  window.removeEventListener('pointermove', onCropMove); window.removeEventListener('pointerup', onCropUp)
}

function onReplaceDiagram(file) { if (file?.raw) { const r = new FileReader(); r.onload = () => { panelDiagram.value = r.result }; r.readAsDataURL(file.raw) } }
function onDiagramPaste(e) {
  for (const item of e.clipboardData?.items||[]) {
    if (item.type.startsWith('image/')) { e.preventDefault(); const b=item.getAsFile(); const r=new FileReader(); r.onload=()=>{panelDiagram.value=r.result}; r.readAsDataURL(b); return }
  }
}
function confirmCrop() {
  const img = cropImgEl.value; if (!img) return
  const sx = img.naturalWidth / (img.clientWidth || img.naturalWidth); const sy = img.naturalHeight / (img.clientHeight || img.naturalHeight)
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(cropRect.w * sx)); c.height = Math.max(1, Math.round(cropRect.h * sy))
  c.getContext('2d').drawImage(img, cropRect.x * sx, cropRect.y * sy, cropRect.w * sx, cropRect.h * sy, 0, 0, c.width, c.height)
  panelDiagram.value = c.toDataURL('image/png'); showCrop.value = false; ElMessage.success('配图已截取')
}

// 豆包识图：先提取图片中的题目原文，作为题库标题和后续分析依据
function recognizeQuestion() {
  const imageUrls = []
  if (panelOriginal.value) imageUrls.push(panelOriginal.value)
  if (panelDiagram.value && panelDiagram.value !== panelOriginal.value) imageUrls.push(panelDiagram.value)
  const userText = panelQuestionText.value.trim()
    ? '用户补充说明：' + panelQuestionText.value + '\n请结合图片识别出完整题目原文'
    : '请识别图片中的题目，输出完整题目原文（包括题干、选项、公式），不要任何分析或解释'
  const sysPrompt = '你是题目识别引擎。请直接读取图片，输出图片中题目的完整原文（含公式、选项），不要添加任何解释、分析或格式。'
  return new Promise((resolve, reject) => {
    streamWrongAnalysis(
      { messages: [{ role: 'user', content: userText }], imageUrls, systemPrompt: sysPrompt },
      {
        onDone: (full) => resolve(full || ''),
        onError: (msg) => reject(new Error(msg))
      }
    )
  })
}

// 知识点缓存
let allKps = []  // [{id, name}]

async function loadKps() {
  try { const r = await getKnowledgePoints({ subject: subject.value, pageSize: 200 }); allKps = r?.list || [] } catch {}
}
loadKps()

function matchKp(text) {
  if (!allKps.length) return null
  const sorted = [...allKps].sort((a,b) => b.name.length - a.name.length)
  const lower = text.toLowerCase()
  for (const kp of sorted) { if (lower.includes(kp.name.toLowerCase())) return kp }
  return null
}
function matchDiff(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('困难') || t.includes('hard')) return '困难'
  if (t.includes('中等') || t.includes('medium')) return '中等'
  if (t.includes('简单') || t.includes('easy') || t.includes('容易')) return '简单'
  return ''
}
function diffTag(d) { return d === '困难' ? 'danger' : d === '中等' ? 'warning' : 'success' }

function parseAIResponse(rawText) {
  // 尝试解析 AI 的结构化输出
  let question = '', solution = '', kp = '', diff = '', mistake = ''

  const qMatch = rawText.match(/\[题目\]([\s\S]*?)\[\/题目\]/i)
  const sMatch = rawText.match(/\[解答\]([\s\S]*?)\[\/解答\]/i)
  const mMatch = rawText.match(/\[易错点\]([\s\S]*?)\[\/易错点\]/i)
  const kMatch = rawText.match(/\[知识点\](.*?)\[\/知识点\]/i)
  const dMatch = rawText.match(/\[难度\](.*?)\[\/难度\]/i)

  question = qMatch ? qMatch[1].trim() : ''
  solution = sMatch ? sMatch[1].trim() : ''
  mistake = mMatch ? mMatch[1].trim() : ''
  kp = kMatch ? kMatch[1].trim() : ''
  diff = dMatch ? dMatch[1].trim() : ''

  // 如果没有标签格式，回退：从 "题目识别" "正确解法" 段落提取
  if (!question) {
    const m = rawText.match(/(?:题目识别|题目原文|题目内容)[：:]*\s*([\s\S]*?)(?=(?:##|###|\*\*错因|\*\*正确|\[解答\]|$))/i)
    if (m) question = m[1].trim()
  }
  if (!solution) {
    const m = rawText.match(/(?:正确解法|解题步骤|解答)[：:]*\s*([\s\S]*?)(?=(?:##|###|\*\*举一反三|\[举一反三\]|$))/i)
    if (m) solution = m[1].trim()
  }
  if (!kp) {
    const m = rawText.match(/(?:知识点|考点)[：:]*\s*(.+)/i)
    if (m) kp = m[1].trim()
  }
  if (!diff) {
    const m = rawText.match(/(?:难度|难易)[：:]*\s*(.+)/i)
    if (m) diff = m[1].trim()
  }

  return { question, solution, kp, diff, mistake }
}

// ═══════════ 发送消息 ═══════════
function onFileChange(e, category) {
  const files = Array.from(e.target.files || [])
  files.forEach(f => {
    if (category === 'image') {
      const url = URL.createObjectURL(f)
      pendingFiles.value.push({ name: f.name, size: formatSize(f.size), type: 'image', url, icon: '🖼️', file: f })
    } else {
      pendingFiles.value.push({ name: f.name, size: formatSize(f.size), type: category, url: '', icon: category === 'pdf' ? '📕' : '📝', file: f })
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
      pendingFiles.value.push({ name: `paste-${Date.now()}.png`, size: formatSize(blob.size), type: 'image', url, icon: '🖼️', file: blob })
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
        if (w > maxW || h > maxH) { const r = Math.min(maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r) }
        // 加 8% 白边，防止 OCR 裁剪边缘文字
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

function sendQuick(text) { inputText.value = text }

// 自动检测裸 LaTeX 命令（如 \frac、\sqrt）并包裹为 $$...$$ 或 $...$
function wrapLatex(text) {
  if (!text) return text
  if (/\$/.test(text)) return text
  // 清洗 OCR 在 LaTeX 命令中误插的空格：\ frac → \frac
  text = text.replace(/\\\s+([a-zA-Z])/g, '\\$1')
  return text.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return line
    if (/\\[a-zA-Z]+/.test(trimmed) && !/\$/.test(trimmed)) {
      return `$$${trimmed}$$`
    }
    return line
  }).join('\n')
}

async function send() {
  if (!canSend.value || typing.value) return
  const text = inputText.value.trim()
  const files = [...pendingFiles.value]

  // 智学点消耗检查：点击发送即开始扣除
  try {
    const pts = await http.get('/user/points')
    const balance = pts?.points ?? pts?.data?.points ?? 0
    if (balance < 3) {
      ElMessageBox.confirm(`智学点不足！当前余额 ${balance} 点，本次分析需消耗 3 点。是否前往充值？`, '智学点不足', { confirmButtonText:'去充值', cancelButtonText:'取消', type:'warning' })
        .then(() => router.push('/' + (route.path.startsWith('/teacher') ? 'teacher' : 'student') + '/recharge'))
      return
    }
    await ElMessageBox.confirm(`本次 AI 错题分析将消耗 3 智学点（当前余额 ${balance} 点），是否继续？`, '确认消耗', { confirmButtonText:'确认分析', cancelButtonText:'取消', type:'info' })
  } catch (e) { if (e !== 'confirm') return }

  inputText.value = ''; pendingFiles.value = []

  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
  messages.value.push({ role: 'user', text, files, time: timeStr })
  scrollBottom()

  // 初始化面板
  panelStage.value = 'loading'
  panelOriginal.value = ''
  panelQuestionText.value = text  // 先放用户输入文字（无图时即题目内容）
  panelDiagram.value = ''
  panelSolution.value = ''
  panelMistake.value = ''
  panelKp.value = null
  panelDifficulty.value = ''
  panelErrorReason.value = ''

  typing.value = true
  try {
    const imgFiles = files.filter(f => f.type === 'image' && f.file)
    if (imgFiles.length > 0) {
      panelOriginal.value = await fileToBase64(imgFiles[0].file)
      // 豆包识图：先提取图片中的题目原文，作为题库标题和后续分析依据
      panelStage.value = 'recognizing'
      try {
        const recognized = await recognizeQuestion()
        if (recognized) panelQuestionText.value = recognized.trim()
      } catch (e) { /* 识别失败：保留用户文字，可手动补充 */ }
    }

    panelStage.value = 'ocr'

    const tip = imgFiles.length > 0
      ? '📷 **题目已识别**，豆包已提取题目内容（右侧可编辑）。确认后点击「开始分析」'
      : '📝 **题目已录入**，可在右侧补充文字说明后点击「开始分析」'
    messages.value.push({ role: 'ai', text: await renderMarkdown(tip), files: [], time: timeStr })
  } catch (e) {
    panelStage.value = 'ocr'
    messages.value.push({ role: 'ai', text: '⚠️ 图片处理失败：' + (e?.message || '网络错误'), files: [], time: timeStr })
  }
  typing.value = false
  scrollBottom()
}

// 第二阶段：用户确认题目后开始分析
const elapsedTime = ref('')
let elapsedTimer = null

async function startAnalysis() {
  if (!panelOriginal.value && !panelQuestionText.value.trim()) { ElMessage.warning('请上传题目图片或输入文字'); return }
  panelStage.value = 'analyzing'
  const taskId = aiTask.start({ title: 'AI 错题分析', type: 'wrong', route: route.fullPath })
  myTaskId.value = taskId
  aiTask.update(taskId, { progress: 5, stageText: '题目分析中' })
  const startTime = Date.now()
  elapsedTime.value = ''
  clearInterval(elapsedTimer)
  elapsedTimer = setInterval(() => { elapsedTime.value = ((Date.now() - startTime) / 1000).toFixed(1) }, 100)
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  try {
    // ===== 第1步：完整分析 → 左侧聊天区 =====
    const sysPrompt1 = `你是资深K12数学老师。请直接阅读图片中的错题（若有文字说明一并参考），分析：审题要点、解题思路、详细推导、易错点。公式用 $...$ 包裹。`
    aiTask.update(taskId, { progress: 20, stageText: '第1步·完整分析' })

    // 图片：原图 + 用户裁剪的配图（若有）
    const imageUrls = []
    if (panelOriginal.value) imageUrls.push(panelOriginal.value)
    if (panelDiagram.value && panelDiagram.value !== panelOriginal.value) imageUrls.push(panelDiagram.value)
    const userText = panelQuestionText.value.trim()
      ? '题目文字说明：' + panelQuestionText.value
      : '请分析这张图片中的错题'

    // 流式：先占位，逐块显示原文，结束后再渲染 markdown
    const aiMsg = { role: 'ai', text: '', files: [], time: timeStr }
    messages.value.push(aiMsg)
    scrollBottom()
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const fullAnalysis = await new Promise((resolve, reject) => {
      streamWrongAnalysis(
        { messages: [{ role: 'user', content: userText }], imageUrls, systemPrompt: sysPrompt1 },
        {
          onChunk: (token, full) => {
            aiTask.update(taskId, { stageText: `第1步·完整分析（已生成 ${full.length} 字）` })
            aiMsg.text = `<div style="white-space:pre-wrap">${esc(full)}</div>`
            scrollBottom()
          },
          onDone: (full) => resolve(full || ''),
          onError: (msg) => reject(new Error(msg))
        }
      )
    })
    aiMsg.text = await renderMarkdown(wrapLatex(fullAnalysis))
    scrollBottom()
    aiTask.update(taskId, { progress: 55, stageText: '第2步·精炼解答' })

    // ===== 第2步：精炼解答 → 右侧面板（非流式，内容短） =====
    const sysPrompt2 = `你是一个答题规范引擎。请根据以下分析内容，输出**考试标准格式的解答步骤**和**易错点**。

分析内容：
"""
${fullAnalysis.slice(-2000)}
"""

要求：
1. 输出纯解答步骤，不解释、不啰嗦，每题控制在 300 字以内
2. 每步一行，步骤编号，公式用 $...$ 包裹
3. 格式如下：

[解答]
（分步解答，按考试得分点写）
[/解答]
[易错点]
（本题容易出错的地方，写 2-3 条，每条一行）
[/易错点]
[知识点]
（一个知识点名称）
[/知识点]
[难度]
（简单/中等/困难）
[/难度]`

    const reply2 = await analyzeWrongQuestion({
      messages: [{ role: 'user', content: '请精简为考试标准解答：' }],
      systemPrompt: sysPrompt2
    })
    const rawText = typeof reply2 === 'string' ? reply2 : (reply2?.data || reply2?.reply || '')

    const parsed = parseAIResponse(rawText)
    let solutionText = parsed.solution || rawText
    solutionText = wrapLatex(solutionText)
    panelSolutionRaw.value = solutionText  // 存原始文本（纯文本+$公式），用于保存
    clearInterval(elapsedTimer)
    elapsedTime.value = ((Date.now() - startTime) / 1000).toFixed(1)
    panelSolution.value = `<div style="font-size:11px;color:#999;margin-bottom:4px">⏱ 耗时 ${elapsedTime.value} 秒</div>` + await renderMarkdown(solutionText)
    panelMistake.value = parsed.mistake ? await renderMarkdown(wrapLatex(parsed.mistake)) : ''
    panelKp.value = matchKp(parsed.kp || panelQuestionText.value || '')
    panelDifficulty.value = matchDiff(parsed.diff || '')
    if (!panelDifficulty.value) panelDifficulty.value = '中等'
    panelStage.value = 'done'
    saveResult()
    usePointsStore().refresh()
    aiTask.finish(taskId, { result: {
      panelOriginal: panelOriginal.value, panelQuestionText: panelQuestionText.value,
      panelDiagram: panelDiagram.value, panelSolution: panelSolution.value, panelSolutionRaw: panelSolutionRaw.value, panelMistake: panelMistake.value,
      panelKp: panelKp.value, panelDifficulty: panelDifficulty.value,
    }})
  } catch (e) {
    aiTask.fail(taskId, e?.message || '网络错误')
    panelStage.value = 'ocr'
    messages.value.push({ role: 'ai', text: '⚠️ 分析失败：' + (e?.message || '网络错误'), files: [], time: timeStr })
  }
}

function closePanel() {
  panelStage.value = 'idle'
  panelOriginal.value = ''; panelQuestionText.value = ''
  panelDiagram.value = ''; panelSolution.value = ''; panelSolutionRaw.value = ''; panelMistake.value = ''; panelKp.value = null
  panelDifficulty.value = ''; panelErrorReason.value = ''
  sessionStorage.removeItem(resultKey)
}

async function addToWrongBook() {
  if (!panelErrorReason.value.trim()) { ElMessage.warning('请填写错误原因'); return }
  try {
    const diffMap = { '简单': 'EASY', '中等': 'MEDIUM', '困难': 'HARD' }
    await http.post(`/student/subject/${subject.value}/wrong-question`, {
      subject: subject.value,
      title: panelQuestionText.value.trim() || '图片错题',
      answer: '',
      knowledgePointNames: panelKp.value?.name||'',
      knowledgePointIds: panelKp.value?.id ? String(panelKp.value.id) : '',
      difficulty: diffMap[panelDifficulty.value] || 'MEDIUM',
      gradeLevel: studentGrade.value,
      analysis: panelErrorReason.value,
      solution: panelSolutionRaw.value,  // 原始文本，无 HTML
      errorType: panelErrorReason.value.slice(0, 20),
      mastery: 'UNMASTERED',
      diagramImageUrl: panelDiagram.value,
      originalImageUrl: panelOriginal.value  // 学生上传的原图
    })
    ElMessage.success('已加入错题库！')
    closePanel()
  } catch (e) {
    ElMessage.error('加入失败：' + (e?.response?.data?.message || e?.message || '未知错误'))
  }
}

function scrollBottom() { nextTick(() => { const el = chatBox.value; if (el) el.scrollTop = el.scrollHeight }) }

// 从试卷分析跳转：预填错题
const eaQuestions = sessionStorage.getItem('ea_analysis_questions')
if (eaQuestions) {
  sessionStorage.removeItem('ea_analysis_questions')
  try {
    const qs = JSON.parse(eaQuestions)
    if (qs.length) {
      inputText.value = qs.map(q => q.title).join('\n\n')
      ElMessage.info(`已加载${qs.length}道试卷错题，可直接发送分析`)
    }
  } catch {}
}

// 离开页面时关闭弹窗，避免 teleport 残留
onBeforeUnmount(() => { showCrop.value = false; showPreview.value = false })
</script>

<style scoped>
.wa-page { max-width: 1200px; margin: 0 auto; padding: 12px 14px 40px; }

/* ═══════════ 左右布局 ═══════════ */
.wa-layout { display: flex; gap: 16px; align-items: stretch; height: calc(100vh - 200px); max-height: calc(100vh - 200px); }
.chat-card { flex: 1; min-width: 0; background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; border: 1px solid var(--color-border); display: flex; flex-direction: column; }
.panel-card { flex: 1; min-width: 0; background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--color-border); overflow-y: auto; }

/* 聊天区 */
.chat-messages { height: 420px; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: var(--color-bg); }
.welcome-area { text-align: center; padding: 40px 20px 20px; }
.welcome-svg { margin-bottom: 12px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
.welcome-area h3 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.welcome-area p { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
.quick-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.qc-chip { padding: 6px 14px; border-radius: 16px; font-size: 12px; background: var(--color-bg-alt); color: var(--text-secondary); cursor: pointer; transition: all .15s; border: 1px solid var(--color-border-light); }
.qc-chip:hover { border-color: var(--color-primary-light); color: var(--color-primary); background: #fff; }

.msg-row { display: flex; gap: 8px; max-width: 88%; }
.msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
.msg-row.ai { align-self: flex-start; }
.msg-avatar { width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
.msg-row.user .msg-avatar { background: var(--color-primary); }
.msg-row.ai .msg-avatar { background: #6366F1; }
.msg-body { max-width: 100%; }
.msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.7; word-break: break-word; }
.msg-row.user .msg-bubble { background: var(--color-primary-bg); border-bottom-right-radius: 4px; }
.msg-row.ai .msg-bubble { background: #fff; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
.msg-time { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.msg-row.user .msg-time { text-align: right; }
.msg-files { margin-bottom: 4px; display: flex; flex-wrap: wrap; gap: 6px; }
.msg-img { max-width: 140px; max-height: 140px; border-radius: 8px; cursor: pointer; }
.msg-img:hover { opacity: .85; }
.msg-doc { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fff; border-radius: 8px; border: 1px solid var(--color-border); font-size: 12px; }
.md-icon { font-size: 18px; } .md-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .md-size { color: var(--text-muted); font-size: 11px; }

/* Markdown */
.msg-row.ai .msg-bubble :deep(h1), .msg-row.ai .msg-bubble :deep(h2), .msg-row.ai .msg-bubble :deep(h3), .msg-row.ai .msg-bubble :deep(h4) { margin: 8px 0 4px; font-weight: 700; }
.msg-row.ai .msg-bubble :deep(p) { margin-bottom: 6px; }
.msg-row.ai .msg-bubble :deep(ol), .msg-row.ai .msg-bubble :deep(ul) { padding-left: 18px; margin-bottom: 6px; }
.msg-row.ai .msg-bubble :deep(li) { margin-bottom: 3px; }
.msg-row.ai .msg-bubble :deep(b), .msg-row.ai .msg-bubble :deep(strong) { color: #222; }
.msg-row.ai .msg-bubble :deep(code) { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
.msg-row.ai .msg-bubble :deep(pre) { background: #F8FAFC; padding: 10px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; margin: 6px 0; }
.msg-row.ai .msg-bubble :deep(.katex) { font-size: 1.05em; }
.msg-row.ai .msg-bubble :deep(.katex-display) { margin: 8px 0; overflow-x: auto; }

.typing-dots { display: flex; gap: 5px; padding: 12px 16px; background: #fff; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.typing-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--color-primary-light); animation: dotBounce 1.4s infinite ease-in-out; }
.typing-dots span:nth-child(2) { animation-delay: .2s; } .typing-dots span:nth-child(3) { animation-delay: .4s; }
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }

.pending-files { display: flex; gap: 6px; padding: 8px 12px; flex-wrap: wrap; border-top: 1px solid var(--color-border-light); background: var(--color-bg-alt); }
.pf-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: #fff; border-radius: 8px; border: 1px solid var(--color-border); }
.pf-thumb { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; }
.pf-icon { font-size: 14px; } .pf-name { font-size: 12px; color: var(--text-secondary); max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-remove { cursor: pointer; color: var(--text-muted); font-size: 12px; } .pf-remove:hover { color: var(--color-danger); }

.chat-input { border-top: 1px solid var(--color-border); background: #fff; padding: 10px 14px; }
.ci-row { display: flex; align-items: center; gap: 8px; }
.ci-upload-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; cursor: pointer; color: var(--text-muted); transition: all .15s; flex-shrink: 0; }
.ci-upload-btn:hover { background: var(--color-primary-bg); color: var(--color-primary); }
.ci-upload-btn input { display: none; }
.ci-input { flex: 1; }
.ci-input :deep(.el-textarea__inner) { border-radius: 10px !important; font-size: 13px; line-height: 1.5; border-color: var(--color-border-light) !important; }
.ci-input :deep(.el-textarea__inner):focus { border-color: var(--color-primary-light) !important; }
.ci-send { width: 34px; height: 34px; border: none; border-radius: 10px; background: var(--color-primary); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
.ci-send:hover:not(:disabled) { background: var(--color-primary-dark); }
.ci-send:disabled { opacity: .35; cursor: not-allowed; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════ 右侧面板 ═══════════ */
.panel-empty { text-align: center; padding: 60px 20px; }
.pe-icon { font-size: 40px; margin-bottom: 12px; }
.pe-text { font-size: 13px; color: var(--text-muted); line-height: 1.8; }
.panel-section { padding: 14px 16px; border-bottom: 1px solid var(--color-border-light); }
.ps-head { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.psh-icon { font-size: 16px; }
.psh-hint { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
.ps-edit-btn { margin-left: auto; width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--color-border); background: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
.ps-edit-btn:hover { background: var(--color-primary-bg); border-color: var(--color-primary); }
.pq-input { margin-top: 6px; }
.pq-render { min-height: 40px; }
.pq-view { margin-top: 6px; }
.pq-view .pq-render { background: #F8FAFC; padding: 10px 12px; border-radius: 8px; font-size: 14px; line-height: 1.8; }
.pq-view .pq-render :deep(.katex) { font-size: 1em; }
.pq-view .pq-render :deep(.katex-display) { margin: 6px 0; overflow-x: auto; }
.pq-toolbar { display: flex; gap: 6px; justify-content: flex-end; margin-top: 4px; }
.pd-diagram { max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--color-border); cursor: pointer; }
.pd-hint { font-size: 12px; color: #F59E0B; background: #FFFBEB; padding: 8px 12px; border-radius: 6px; text-align: center; }
.crop-wrap { position: relative; display: inline-block; }
.crop-src-img { display: block; max-width: 760px; max-height: 60vh; }
.crop-box { position: absolute; border: 2px solid #3B82F6; box-sizing: border-box; cursor: move; touch-action: none; }
.crop-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid #3B82F6; border-radius: 2px; touch-action: none; }
.ch-nw { left: -6px; top: -6px; cursor: nwse-resize; } .ch-n { left: 50%; top: -6px; margin-left: -5px; cursor: ns-resize; } .ch-ne { right: -6px; top: -6px; cursor: nesw-resize; }
.ch-e { right: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; } .ch-se { right: -6px; bottom: -6px; cursor: nwse-resize; } .ch-s { left: 50%; bottom: -6px; margin-left: -5px; cursor: ns-resize; }
.ch-sw { left: -6px; bottom: -6px; cursor: nesw-resize; } .ch-w { left: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; }
.pq-input :deep(.el-textarea__inner) { font-size: 14px; line-height: 1.8; }
.ps-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
.ps-body { font-size: 14px; line-height: 1.8; color: #444; }
.ps-body :deep(p) { margin-bottom: 6px; }
.ps-body :deep(ol), .ps-body :deep(ul) { padding-left: 18px; margin: 4px 0; }
.ps-body :deep(.katex) { font-size: 1em; }
.ps-body :deep(.katex-display) { margin: 6px 0; overflow-x: auto; }
.ps-loading { text-align: center; padding: 12px; color: var(--text-muted); font-size: 13px; }
.wa-progress { padding: 12px 16px; }
.wp-bar { height: 6px; border-radius: 3px; background: #eef0f6; overflow: hidden; margin-bottom: 6px; }
.wp-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #6366F1, #8B5CF6); transition: width .4s ease; }
.wp-text { font-size: 12px; color: var(--text-muted); }
.ps-empty { text-align: center; padding: 12px; color: var(--text-muted); font-size: 13px; }

.panel-meta { display: flex; gap: 16px; padding: 10px 16px; border-bottom: 1px solid var(--color-border-light); }
.pm-item { display: flex; align-items: center; gap: 6px; }
.pmi-label { font-size: 13px; color: var(--text-muted); }

.per-input { margin-bottom: 10px; }
.per-actions { display: flex; gap: 8px; justify-content: flex-end; }

@media (max-width: 860px) {
  .wa-layout { flex-direction: column; height: auto; max-height: none; }
  .panel-card { max-height: 400px; }
}
@media (max-width: 480px) {
  .chat-messages { height: 300px; padding: 12px; }
  .msg-row { max-width: 95%; }
}
</style>
