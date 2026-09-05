<template>
  <div class="ea-page">
    <router-link :to="subjectHome" class="back-link">← 返回学科中心</router-link>

    <div class="ea-layout">
      <!-- 左侧 -->
      <div class="chat-card">
        <div class="chat-messages" ref="chatBox">
          <div v-if="messages.length===0" class="welcome-area">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <h3>AI 试卷分析</h3>
            <p>拍照上传试卷，AI 诊断扣分点和薄弱环节</p>
          </div>
          <div v-for="(msg,i) in messages" :key="i" :class="['msg-row',msg.role]">
            <div class="msg-avatar">{{ msg.role==='user'?'我':'AI' }}</div>
            <div class="msg-body">
              <div v-if="msg.text" class="msg-bubble" v-html="msg.text"></div>
              <div v-if="msg.files?.length" class="msg-files">
                <img v-for="(f,fi) in msg.files.filter(f=>f.type==='image')" :key="fi" :src="f.url" class="msg-img" @click="previewImg=f.url;showPreview=true"/>
                <div v-for="(f,fi) in msg.files.filter(f=>f.type==='pdf')" :key="'p'+fi" class="msg-doc"><span class="md-icon">📕</span><span class="md-name">{{ f.name }}</span><span class="md-size">{{ f.size }}</span></div>
              </div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
          </div>
          <div v-if="typing" class="msg-row ai"><div class="msg-avatar">AI</div><div class="msg-body"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>
        </div>
        <div v-if="pendingImages.length" class="pending-files">
          <div v-for="(pf,i) in pendingImages" :key="i" class="pf-item">
            <img v-if="pf.type==='image'" :src="pf.url" class="pf-thumb"/>
            <span v-else class="pf-icon">📕</span>
            <span class="pf-name">{{ pf.name }}</span><span class="pf-remove" @click="pendingImages.splice(i,1)">✕</span>
          </div>
        </div>
        <div class="chat-input">
          <div class="ci-bar">
            <span class="ci-label">类型</span>
            <el-select v-model="examType" size="small" style="width:90px"><el-option v-for="t in examTypes" :key="t" :label="t" :value="t"/></el-select>
          </div>
          <div class="ci-row" @dragover.prevent @drop.prevent="onDrop">
            <label class="ci-upload-btn" title="上传试卷图片">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <input type="file" accept="image/*,.pdf" multiple hidden @change="onFileChange"/>
            </label>
            <el-input v-model="inputText" type="textarea" :rows="1" placeholder="描述试卷情况或直接粘贴图片…" :disabled="typing" resize="none" @keydown.enter.exact.prevent="send" @paste="onPaste" class="ci-input"/>
            <span class="ci-cost" title="消耗5智学点">-5点</span>
            <button class="ci-send" @click="send" :disabled="!canSend||typing">
              <span v-if="typing" class="spinner-sm"/>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="panel-card">
        <div v-if="!panelData" class="panel-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.2" stroke-linecap="round" opacity=".4"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <div class="pe-text">上传试卷图片<br/>AI 将自动分析扣分点和薄弱环节</div>
          <div v-if="papers.length" class="ea-history">
            <div class="eah-head">
              <span class="eah-title">📋 历史试卷</span>
              <span class="eah-badge">{{ filteredPapers.length }}</span>
            </div>
            <div class="ea-filter"><el-select v-model="filterExamType" size="small" placeholder="类型" clearable style="width:80px"><el-option v-for="t in examTypes" :key="t" :label="t" :value="t"/></el-select><el-date-picker v-model="filterDate" size="small" type="month" placeholder="月份" clearable format="YYYY-MM" value-format="YYYY-MM" style="width:120px"/></div>
            <div v-for="p in filteredPapers" :key="p.id" class="ea-h-item" @click="loadPaper(p.id)">
              <div class="eah-left">
                <span :class="['eah-dot', p.score ? 'green' : 'gray']"/>
                <div>
                  <span class="eah-name">{{ p.examType||'考试' }}</span>
                  <span class="eah-date">{{ p.createdAt?.slice(0,10) }}</span>
                </div>
              </div>
              <div class="eah-right">
                <span class="eah-score" v-if="p.score">{{ p.score }}分</span>
                <span class="eah-noscore" v-else>未评分</span>
                <el-button size="small" text type="danger" @click.stop="delPaper(p.id)">🗑</el-button>
              </div>
            </div>
          </div>
        </div>
        <template v-if="panelData">
          <div class="panel-topbar">
            <el-button text size="small" @click="closePanel">← 返回列表</el-button>
            <div class="panel-topright" v-if="!typing && !panelData.overview.includes('⏳')">
              <div class="pinline-score" v-if="!isTeacher">
                <el-input v-model="studentScore" placeholder="分数" size="small" style="width:80px" :disabled="scoreSubmitted"/>
                <el-button type="primary" size="small" @click="submitScore" :loading="scoreSaving" :disabled="scoreSubmitted">{{ scoreSubmitted ? '✅ 已提交' : '确定' }}</el-button>
              </div>
              <el-button size="small" @click="exportPDF">📥 导出PDF</el-button>
            </div>
          </div>
          <div v-if="myTask && myTask.status === 'running'" class="panel-progress">
            <div class="pp-bar"><div class="pp-fill" :style="{ width: myTask.progress + '%' }"></div></div>
            <div class="pp-text">{{ myTask.stageText }} · {{ myTask.progress }}%</div>
          </div>
          <div class="panel-section"><div class="ps-head">📋 试卷概览</div><div class="ps-body" v-html="panelData.overview||'分析中…'"/></div>
          <div class="panel-section" v-if="panelData.analysis"><div class="ps-head">🔍 模块分析</div><div class="ps-body" v-html="panelData.analysis"/></div>
          <div class="panel-section" v-if="panelData.wrongQuestionsHtml"><div class="ps-head">❌ 错题详解</div><div class="ps-body" v-html="panelData.wrongQuestionsHtml"/></div>
          <div class="panel-section" v-if="panelData.scoreRoadmapRaw"><div class="ps-head">🗺 追分路径</div><div class="roadmap-list" v-html="renderRoadmap(panelData.scoreRoadmapRaw)"/></div>
          <div class="panel-section radar-section" v-if="panelData.abilities"><div class="ps-head">🎯 能力画像</div><div v-html="renderAbilities(panelData.abilities)"/></div>
          <div class="panel-section" v-if="panelData.suggestions"><div class="ps-head">💡 复习建议</div><div class="ps-body" v-html="panelData.suggestions"/></div>
          <div class="panel-section" v-if="panelData.kpList"><div class="ps-head">📖 知识点清单</div><div class="ps-body" v-html="panelData.kpList"/></div>
        </template>
      </div>
    </div>

    <el-dialog v-model="showPreview" title="图片预览" width="90%" :append-to-body="true" destroy-on-close>
      <img :src="previewImg" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px"/>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useAiTaskStore } from '@/store/aiTask'
import { usePointsStore } from '@/store/points'
import { streamExamAnalysis } from '@/api/streamAI'
import { renderMarkdown, sanitizeHtml } from '@/utils/markdown'
import http from '@/api/request'
// 本地依赖：pdf.js（PDF 转图片）+ KaTeX CSS（打印报告内联），均不再走外网 CDN
import * as pdfjsImport from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import katexCss from 'katex/dist/katex.min.css?inline'
// pdfjs-dist 为 UMD 包：命名导出可能被 interop 折叠到 default 上，做兜底
const pdfjsLib = pdfjsImport.getDocument ? pdfjsImport : (pdfjsImport.default || pdfjsImport)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const aiTask = useAiTaskStore()
const subject = computed(() => route.params.subject || 'math')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const subjectHome = computed(() => isTeacher.value ? `/teacher/subject/${subject.value}` : `/student/subject/${subject.value}`)
const paperList = ref([])
const papers = computed(() => (Array.isArray(paperList.value) ? paperList.value : (paperList.value?.list || [])))
const examTypes = ['周测','月考','期中','期末','模拟考']
const filterExamType = ref('')
const filterDate = ref('')
const filteredPapers = computed(() => {
  return papers.value.filter(p => {
    if (filterExamType.value && p.examType !== filterExamType.value) return false
    if (filterDate.value && !(p.createdAt||'').startsWith(filterDate.value)) return false
    return true
  })
})
const examType = ref('期末')

async function loadPapers() {
  if (isTeacher.value) return
  try { const r = await http.get(`/student/exam-papers?subject=${subject.value}`); paperList.value = r||[] } catch {}
}
async function loadPaper(id) {
  if (isTeacher.value) return
  panelData.value = { overview: '⏳ 加载中…', analysis: '', suggestions: '', kpList: '' }
  try {
    const r = await http.get(`/student/exam-papers/${id}`)
    if (!r) { panelData.value.overview = '❌ 试卷数据为空'; return }
    panelScoreId.value = r.id || id
    studentScore.value = r.score || ''
    scoreSubmitted.value = !!r.score
    const raw = r.paperAnalysis||''
    if (!raw) { panelData.value.overview = '❌ 该试卷无分析内容'; return }
    const strip = s => (s||'').replace(/\[\/?[a-zA-Z]+\]/g,'')
    const parsed = parseResult(raw)
    panelData.value.overview = await renderMarkdown(strip(parsed.overview || raw))
    panelData.value.analysis = await renderMarkdown(strip(parsed.analysis||r.suggestions||''))
    panelData.value.wrongQuestionsHtml = await renderMarkdown(strip(parsed.wrongQuestions || ''))
    panelData.value.wrongQuestionsRaw = parsed.wrongQuestions || ''
    panelData.value.scoreRoadmapRaw = parsed.scoreRoadmap || ''
    panelData.value.abilities = parsed.abilities || ''
    panelData.value.suggestions = await renderMarkdown(strip(parsed.suggestions||''))
    panelData.value.kpList = await renderMarkdown(strip(parsed.kpList||r.kpList||''))
  } catch(e) {
    panelData.value.overview = `❌ 加载失败：${e?.message||'请确认后端已启动'}`
  }
}
function closePanel() { panelData.value = null; panelScoreId.value = null; studentScore.value = ''; scoreSubmitted.value = false; sessionStorage.removeItem(resultKey) }
async function delPaper(id) {
  try { await http.delete(`/student/exam-papers/${id}`); paperList.value = paperList.value.filter(p=>p.id!==id) } catch {}
}
loadPapers()
const inputText = ref(''); const messages = ref([]); const typing = ref(false); const chatBox = ref(null)
const pendingImages = ref([]); const showPreview = ref(false); const previewImg = ref('')
const panelData = ref(null)
const studentScore = ref('')
const scoreSaving = ref(false)
const scoreSubmitted = ref(false)
const panelScoreId = ref(null)  // 当前试卷ID，用于提交分数
const myTaskId = ref('')
const myTask = computed(() => aiTask.tasks.find(t => t.id === myTaskId.value))

// 结果持久化到 sessionStorage：切出页面/刷新后仍能恢复（store 的 task 会超时清理）
const resultKey = 'eduai_result_' + route.path
function saveResult() {
  try { sessionStorage.setItem(resultKey, JSON.stringify({ panelData: panelData.value })) } catch {}
}
function restoreSaved() {
  try {
    const raw = sessionStorage.getItem(resultKey)
    if (!raw) return
    const r = JSON.parse(raw)
    if (r?.panelData) panelData.value = r.panelData
  } catch {}
}

// 切出页面后分析仍在后台跑：挂载时恢复进度/结果
onMounted(() => {
  restoreSaved()
  const t = aiTask.taskForRoute(route.fullPath)
  if (t) {
    myTaskId.value = t.id
    if (t.status === 'done' && t.result?.panelData) panelData.value = t.result.panelData
    else if (t.status === 'running') panelData.value = { overview: '🔍 AI 正在分析试卷…（可离开本页）', analysis:'', suggestions:'', kpList:'', wrongQuestions:'', scoreRoadmap:'', abilities:'' }
  }
})
watch(() => myTask.value?.status, (s) => {
  if (s === 'done') {
    if (myTask.value?.result?.panelData) panelData.value = myTask.value.result.panelData
    restoreSaved()
  }
})
const canSend = computed(() => inputText.value.trim() || pendingImages.value.length)

function onFileChange(e) {
  Array.from(e.target.files||[]).forEach(f => {
    const isPdf = f.name.endsWith('.pdf')
    pendingImages.value.push({ name:f.name, url:isPdf?'':URL.createObjectURL(f), type:isPdf?'pdf':'image', file:f, size:formatSize(f.size) })
  })
  e.target.value = ''
}
function onPaste(e) {
  for (const item of e.clipboardData?.items||[]) {
    if (item.type.startsWith('image/')) { e.preventDefault(); const b=item.getAsFile(); pendingImages.value.push({ name:'paste.png', url:URL.createObjectURL(b), type:'image', file:b, size:formatSize(b.size) }); return }
  }
}
function onDrop(e) {
  Array.from(e.dataTransfer?.files||[]).forEach(f => {
    const isPdf = f.name.endsWith('.pdf')
    pendingImages.value.push({ name:f.name, url:isPdf?'':URL.createObjectURL(f), type:isPdf?'pdf':'image', file:f, size:formatSize(f.size) })
  })
}
function formatSize(b) { return b<1024?b+'B':b<1048576?(b/1024).toFixed(1)+'KB':(b/1048576).toFixed(1)+'MB' }
function preprocessImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image(); img.onload = () => {
        const maxW=1600, maxH=1600; let w=img.width, h=img.height
        if(w>maxW||h>maxH){const r=Math.min(maxW/w,maxH/h);w=Math.round(w*r);h=Math.round(h*r)}
        const padW=Math.round(w*.04), padH=Math.round(h*.04)
        const c=document.createElement('canvas');c.width=w+padW*2;c.height=h+padH*2
        const ctx=c.getContext('2d');ctx.fillStyle='#FFF';ctx.fillRect(0,0,c.width,c.height)
        ctx.drawImage(img,padW,padH,w,h)
        c.toBlob(b=>resolve(new File([b],file.name,{type:'image/png'})),'image/png')
      }; img.src=reader.result
    }; reader.readAsDataURL(file)
  })
}

async function pdfToImage(file) {
  // 用 FileReader 读 ArrayBuffer → pdf.js 渲染
  const buffer = await new Promise((resolve) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsArrayBuffer(file)
  })
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const page = await pdf.getPage(1)
  const vp = page.getViewport({ scale: 1.5 })
  const canvas = document.createElement('canvas'); canvas.width = vp.width; canvas.height = vp.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
  return canvas.toDataURL('image/jpeg', 0.8)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image(); img.onload = () => {
        const maxW=800, maxH=800; let w=img.width, h=img.height
        if(w>maxW||h>maxH){const r=Math.min(maxW/w,maxH/h);w=Math.round(w*r);h=Math.round(h*r)}
        const c=document.createElement('canvas');c.width=w;c.height=h
        c.getContext('2d').drawImage(img,0,0,w,h)
        resolve(c.toDataURL('image/jpeg',0.6))
      }; img.onerror=()=>reject(new Error('加载失败')); img.src=reader.result
    }; reader.onerror=()=>reject(new Error('读取失败')); reader.readAsDataURL(file)
  })
}

async function send() {
  if (!canSend.value || typing.value) return
  const text = inputText.value.trim(); inputText.value = ''
  const imgs = [...pendingImages.value]; pendingImages.value = []
  const timeStr = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
  messages.value.push({ role:'user', text, files:imgs, time:timeStr }); scrollBottom()

  // 智学点消耗检查
  try {
    const pts = await http.get('/user/points')
    const balance = pts?.points ?? pts?.data?.points ?? 0
    if (balance < 5) {
      await ElMessageBox.confirm(`智学点不足！当前余额 ${balance} 点，本次分析需消耗 5 点。是否前往充值？`, '智学点不足', { confirmButtonText:'去充值', cancelButtonText:'取消', type:'warning' })
        .then(() => router.push('/' + (route.path.startsWith('/teacher') ? 'teacher' : 'student') + '/recharge'))
      return
    }
    await ElMessageBox.confirm(`本次 AI 试卷分析将消耗 5 智学点（当前余额 ${balance} 点），是否继续？`, '确认消耗', { confirmButtonText:'确认分析', cancelButtonText:'取消', type:'info' })
  } catch (e) { if (e !== 'confirm') return }

  typing.value = true
  const taskId = aiTask.start({ title: 'AI 试卷分析', type: 'exam', route: route.fullPath })
  myTaskId.value = taskId
  aiTask.update(taskId, { progress: 8, stageText: '图片预处理中' })
  panelData.value = { overview: '🔍 AI 正在分析试卷…（可离开本页，进度条会在右下角悬浮显示）', analysis:'', suggestions:'', kpList:'', wrongQuestions:'', scoreRoadmap:'', abilities:'' }
  let imageUrls = []
  try {
    // 所有图片转 base64 发给 AI 识图
    const imgFiles = imgs.filter(f=>f.type==='image'&&f.file)
    const pdfFiles = imgs.filter(f=>f.type==='pdf'&&f.file)
    if (imgFiles.length > 0) {
      imageUrls = await Promise.all(imgFiles.map(f => fileToBase64(f.file)))
      aiTask.update(taskId, { progress: 30, stageText: '图片转码完成' })
    } else if (pdfFiles.length > 0) {
      aiTask.fail(taskId, 'PDF请截图后上传PNG/JPG格式')
      panelData.value = { overview:'⚠️ PDF请截图后上传PNG/JPG格式', analysis:'', suggestions:'', kpList:'' }
      typing.value = false; return
    }

    const sysPrompt = `你现在是数学老师，帮我分析试卷的得分情况、错误点，和建议。按以下格式回复：

[overview]
像老师跟学生谈话一样概述得分和整体表现。
[/overview]
[analysis]
指出错题涉及的知识点和错误类型，分析薄弱环节。
[/analysis]
[wrongQuestions]
逐题分析每道错题，格式：题号. 题目简述 — 错误原因（1-2句）— 正确思路（1-2句）。每道错题用空行分隔。
[/wrongQuestions]
[scoreRoadmap]
从易到难列出提分路径，每行一条：知识点名称 | 预计提分 | 建议用时 | 优先级(高/中/低)。至少5条。
[/scoreRoadmap]
[abilities]
用JSON格式给出六维能力画像：{"概念理解":80,"计算能力":75,"逻辑推理":70,"空间想象":65,"应用建模":60,"规范表达":85}。根据试卷表现评分0-100。
[/abilities]
[suggestions]
针对性给3条具体学习建议。
[/suggestions]
[kpList]
知识点清单，逗号分隔。
[/kpList]
[score]
得分数字，未识别填"未识别"。
[/score]

公式用 $...$ 包裹。`

    const userContent = (text||'请分析我的试卷')
    aiTask.update(taskId, { progress: 45, stageText: 'AI 诊断中' })
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const rawText = await new Promise((resolve, reject) => {
      streamExamAnalysis(
        { messages: [{ role:'user', content:userContent }], imageUrls, systemPrompt: sysPrompt },
        {
          onChunk: (token, full) => {
            aiTask.update(taskId, { stageText: `AI 诊断中（已生成 ${full.length} 字）` })
            // 流式原文预览：结束后替换为结构化报告
            panelData.value.overview = `<div style="white-space:pre-wrap">${esc(full)}</div>`
          },
          onDone: (full) => resolve(full),
          onError: (msg) => reject(new Error(msg))
        }
      )
    })
    if (!rawText) { aiTask.fail(taskId, 'AI未返回内容'); panelData.value.overview = 'AI未返回内容，请重试'; typing.value=false; return }
    aiTask.update(taskId, { progress: 88, stageText: '生成分析报告' })
    const parsed = parseResult(rawText)
    // 直接用 AI 原始回复渲染
    // 清洗所有 [xxx] [/xxx] 标签后渲染
    const clean = (s) => renderMarkdown((s||'').replace(/\[\/?[a-zA-Z]+\]/g,''))
    const wqText = parsed.wrongQuestions || ''
    const rmText = parsed.scoreRoadmap || ''
    panelData.value = {
      overview: await clean(parsed.overview || rawText),
      analysis: await clean(parsed.analysis||''),
      wrongQuestionsHtml: await renderMarkdown((wqText||'').replace(/\[\/?[a-zA-Z]+\]/g,'')),
      wrongQuestionsRaw: wqText,
      scoreRoadmapRaw: rmText,
      abilities: parsed.abilities || '',
      suggestions: await clean(parsed.suggestions||''),
      kpList: await clean(parsed.kpList||'')
    }
    // 保存原卷图片(base64)到后端
    const paperImages = await Promise.all(imgs.filter(f=>f.file).map(async f => {
      return new Promise(resolve => { const r=new FileReader(); r.onload=()=>resolve(r.result); r.readAsDataURL(f.file) })
    }))
    if (panelData.value.overview && !isTeacher.value) {
      try {
        const saved = await http.post('/student/exam-papers', {
          subject: subject.value, examType: examType.value,
          school: auth.user?.school||'', paperImages,
          paperAnalysis: rawText, suggestions: (parsed.suggestions||''),
          kpList: (parsed.kpList||'')
        })
        panelScoreId.value = saved?.id || null
        studentScore.value = ''
        scoreSubmitted.value = false
      } catch {}
      loadPapers()
    }
    const chatHtml = await renderMarkdown(rawText.replace(/\[\/?[a-zA-Z]+\]/g,''))
    messages.value.push({ role:'ai', text:chatHtml, files:[], time:timeStr })
    saveResult()
    usePointsStore().refresh()
    aiTask.finish(taskId, { result: { panelData: panelData.value } })
  } catch(e) {
    aiTask.fail(taskId, e?.message || '网络错误')
    panelData.value = { overview: `⚠️ 分析失败<br><small>${e?.message||'请确认后端已启动'}</small>`, analysis:'', suggestions:'', kpList:'' }
    messages.value.push({ role:'ai', text:'⚠️ 分析失败：'+(e?.message||'网络错误'), files:[], time:timeStr })
  }
  typing.value = false; scrollBottom()
}

function renderRoadmap(text) {
  if (!text) return ''
  const lines = text.trim().split('\n').filter(Boolean)
  return sanitizeHtml(`<div class="flow-chart">` + lines.map((line,i) => {
    const parts = line.split('|').map(s=>s.trim())
    const prio = parts[3] || ''
    const cls = prio.includes('高')?'hi':prio.includes('中')?'mid':'lo'
    return `<div class="fc-step">
      <div class="fcs-dot"><span>${i+1}</span></div>
      ${i < lines.length-1 ? '<div class="fcs-line"></div>' : ''}
      <div class="fcs-card">
        <div class="fcsc-top">
          <span class="fcsc-name">${parts[0]||''}</span>
          <span class="fcsc-priority ${cls}">${prio||'中'}</span>
        </div>
        <div class="fcsc-bottom">
          <span class="fcsc-gain">⬆ ${parts[1]||''}</span>
          <span class="fcsc-time">⏱ ${parts[2]||''}</span>
        </div>
      </div>
    </div>`
  }).join('') + `</div>`)
}

function parseResult(text) {
  const get = (tag) => {
    // 兼容多种格式：[tag]、[ tag ]、[ tag]、[tag ]
    const m=text.match(new RegExp(`\\[\\s*${tag}\\s*\\]\\s*([\\s\\S]*?)\\s*\\[\\s*\\/\\s*${tag}\\s*\\]`,'i'))
    if (m) return m[1].trim()
    // 回退：尝试匹配 ### tag 格式
    const m2=text.match(new RegExp(`#{1,3}\\s*${tag}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}|$)`,'i'))
    return m2?m2[1].trim():''
  }
  return { overview: get('overview'), analysis: get('analysis'), wrongQuestions: get('wrongQuestions'), scoreRoadmap: get('scoreRoadmap'), abilities: get('abilities'), suggestions: get('suggestions'), kpList: get('kpList'), score: get('score') }
}

async function submitScore() {
  if (isTeacher.value) return
  if (!studentScore.value.trim()) { ElMessage.warning('请先填写分数'); return }
  if (!panelScoreId.value) { ElMessage.warning('试卷未保存，请重试'); return }
  scoreSaving.value = true
  try {
    await http.put(`/student/exam-papers/${panelScoreId.value}`, { score: studentScore.value.trim() })
    scoreSubmitted.value = true
    ElMessage.success('成绩已提交')
  } catch (e) { ElMessage.error(e.message||'提交失败') }
  scoreSaving.value = false
}

const abilityLabels = ['概念理解','计算能力','逻辑推理','空间想象','应用建模','规范表达']
const abilityColors = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899']

function renderAbilities(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    const cx=180, cy=180, r=85, sides=6, pad=32
    const points = abilityLabels.map((_,i) => {
      const angle = Math.PI*2*i/sides - Math.PI/2
      return { x: cx + r*Math.cos(angle), y: cy + r*Math.sin(angle), angle }
    })
    const getScore = (label) => Math.max(0, Math.min(100, data[label]||0))
    const dataPoints = abilityLabels.map((l,i) => {
      const s = getScore(l)/100
      return `${cx + r*s*Math.cos(points[i].angle)},${cy + r*s*Math.sin(points[i].angle)}`
    }).join(' ')
    const gridLines = [0.2,0.4,0.6,0.8,1].map(scale =>
      `<polygon points="${points.map(p => `${cx + r*scale*Math.cos(p.angle)},${cy + r*scale*Math.sin(p.angle)}`).join(' ')}" fill="none" stroke="#e8e8e8" stroke-width="0.5"/>`
    ).join('')
    const labels = abilityLabels.map((l,i) => {
      const p = points[i]; const ex = cx + (r+pad)*Math.cos(p.angle); const ey = cy + (r+pad)*Math.sin(p.angle)
      const ax = ex > cx+5 ? 'start' : ex < cx-5 ? 'end' : 'middle'
      const s = getScore(l)
      return `<text x="${ex}" y="${ey-2}" text-anchor="${ax}" font-size="10" fill="#555" font-weight="500">${l}</text>
        <text x="${ex}" y="${ey+10}" text-anchor="${ax}" font-size="11" fill="${abilityColors[0]}" font-weight="700">${s}</text>`
    }).join('')
    return `<svg viewBox="0 0 360 360" style="width:100%;max-width:400px;display:block;margin:0 auto">
      ${gridLines}
      <polygon points="${dataPoints}" fill="${abilityColors[0]}22" stroke="${abilityColors[0]}" stroke-width="2" stroke-linejoin="round"/>
      ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${abilityColors[0]}"/>`).join('')}
      ${labels}
    </svg>`
  } catch { return '' }
}

async function exportPDF() {
  // 优先用后端生成 PDF（带鉴权请求下载：window.open 无法携带 token，会 401）
  if (panelScoreId.value) {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'
      const res = await fetch(`${API_BASE}/student/exam-papers/${panelScoreId.value}/pdf`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(errText || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '试卷分析报告.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return
    } catch (e) {
      ElMessage.error('导出失败：' + (e?.message || '网络错误'))
      return
    }
  }
  // fallback: 客户端 HTML 导出
  const sec = panelData.value
  if (!sec) return
  const subjMap = {math:'数学',chinese:'语文',english:'英语',physics:'物理',chemistry:'化学',biology:'生物',history:'历史',politics:'政治',geography:'地理'}
  const now = new Date().toLocaleString('zh-CN')
  const cards = [
    {icon:'📋',title:'试卷概览',body:sec.overview||'',color:'#6366F1',bg:'#EEF2FF'},
    {icon:'🔍',title:'模块分析',body:sec.analysis||'',color:'#8B5CF6',bg:'#F5F3FF'},
    {icon:'❌',title:'错题详解',body:sec.wrongQuestionsHtml||'',color:'#EF4444',bg:'#FEF2F2'},
    {icon:'🗺',title:'追分路径',body:renderRoadmapForPdf(sec.scoreRoadmapRaw||''),color:'#10B981',bg:'#ECFDF5'},
    {icon:'🎯',title:'能力画像',body:renderAbilities(sec.abilities||'')||'',color:'#8B5CF6',bg:'#F5F3FF',isSvg:true},
    {icon:'💡',title:'复习建议',body:sec.suggestions||'',color:'#F59E0B',bg:'#FFFBEB'},
    {icon:'📖',title:'知识点清单',body:sec.kpList||'',color:'#F59E0B',bg:'#FFFBEB'}
  ].filter(c=>c.body?.trim())

function renderRoadmapForPdf(text) {
  if (!text) return ''
  return sanitizeHtml(text.trim().split('\n').filter(Boolean).map(line => {
    const parts = line.split('|').map(s=>s.trim())
    return `${parts[0]} — ${parts[1]||''} · ${parts[2]||''} · ${parts[3]||''}`
  }).join('<br/>'))
}
  const cardHtml = cards.map(c=>`<div class="card" style="border-left-color:${c.color}"><div class="card-head" style="background:${c.bg};color:${c.color}">${c.icon} ${c.title}</div><div class="card-body" style="${c.isSvg?'text-align:center':''}">${c.body}</div></div>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>试卷分析报告</title>
    <style>${katexCss}</style>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;padding:32px 40px;color:#2D3748;max-width:1000px;margin:0 auto;font-size:14px;line-height:1.8}
      .header{text-align:center;padding:28px 20px 24px;background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:14px;color:#fff;margin-bottom:24px}
      .title{font-size:22px;font-weight:800;margin-bottom:10px}.tags{display:flex;justify-content:center;gap:10px}.tags span{background:rgba(255,255,255,.2);padding:4px 14px;border-radius:14px;font-size:12px}
      .card{margin-bottom:16px;border-radius:12px;border-left:4px solid #6366F1;overflow:hidden}
      .card-head{padding:10px 16px;font-weight:700;font-size:15px}.card-body{padding:14px 16px;background:#fff}.card-body p{margin-bottom:8px}.card-body ul,.card-body ol{padding-left:20px;margin:6px 0}.card-body li{margin-bottom:4px}.card-body svg{max-width:100%;height:auto}
      .footer{text-align:center;color:#cbd5e0;font-size:12px;margin-top:28px;padding-top:14px;border-top:1px solid #edf2f7}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:12mm}}
    </style></head><body><div class="header"><div class="title">📊 试卷分析报告</div><div class="tags"><span>${subjMap[subject.value]||subject.value}</span><span>${examType.value}</span><span>${now}</span></div></div>${cardHtml}<div class="footer">智学AI教育</div></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (w) { w.onload = () => { w.print(); URL.revokeObjectURL(url) } }
}

async function addToBank(q, idx) {
  try {
    await http.post(`/student/subject/${subject.value}/wrong-question`, {
      subject: subject.value, title: q.title,
      knowledgePointNames: q.kp, difficulty: q.difficulty==='简单'?'EASY':q.difficulty==='中等'?'MEDIUM':'HARD',
      analysis: '试卷错题', errorType: '试卷扣分', mastery: 'UNMASTERED'
    })
    ElMessage.success('已加入错题库')
    panelData.value.wrongQuestions.splice(idx, 1); eaSelected.value.delete(idx)
  } catch(e) { ElMessage.error('加入失败') }
}
function sendToAnalysis() {
  const selected = [...eaSelected.value].map(i => panelData.value.wrongQuestions[i]).filter(Boolean)
  if (!selected.length) return
  sessionStorage.setItem('ea_analysis_questions', JSON.stringify(selected))
  router.push(`/student/subject/${subject.value}/wrong-analysis`)
}

function scrollBottom() { nextTick(()=>{const el=chatBox.value;if(el)el.scrollTop=el.scrollHeight}) }
</script>

<style scoped>
.ea-page{max-width:1200px;margin:0 auto;padding:12px 14px 40px}
.ea-layout{display:flex;gap:16px;align-items:stretch;height:calc(100vh - 100px)}
.chat-card{flex:1;min-width:0;background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.03);overflow:hidden;border:1px solid var(--color-border);display:flex;flex-direction:column}
.panel-card{flex:1;min-width:0;background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.03);border:1px solid var(--color-border);overflow-y:auto;overflow-x:visible}
.panel-topbar{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-bottom:1px solid var(--color-border-light);position:sticky;top:0;background:#fff;z-index:1}
.chat-messages{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--color-bg)}
.welcome-area{text-align:center;padding:40px 20px 20px}.welcome-area svg{margin-bottom:10px;animation:bounce 2s infinite}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}.welcome-area h3{font-size:17px;font-weight:700;color:var(--text-primary);margin-bottom:4px}.welcome-area p{font-size:13px;color:var(--text-muted)}
.msg-row{display:flex;gap:8px;max-width:88%}.msg-row.user{align-self:flex-end;flex-direction:row-reverse}.msg-row.ai{align-self:flex-start}
.msg-avatar{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff}
.msg-row.user .msg-avatar{background:var(--color-primary)}.msg-row.ai .msg-avatar{background:#6366F1}
.msg-bubble{padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.7;word-break:break-word}
.msg-row.user .msg-bubble{background:var(--color-primary-bg);border-bottom-right-radius:4px}.msg-row.ai .msg-bubble{background:#fff;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.msg-time{font-size:10px;color:var(--text-muted);margin-top:2px}.msg-row.user .msg-time{text-align:right}
.msg-files{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px}.msg-img{max-width:140px;max-height:140px;border-radius:8px;cursor:pointer}.msg-img:hover{opacity:.85}
.pending-files{display:flex;gap:6px;padding:8px 12px;flex-wrap:wrap;border-top:1px solid var(--color-border-light);background:var(--color-bg-alt)}
.pf-item{display:flex;align-items:center;gap:6px;padding:4px 8px;background:#fff;border-radius:8px;border:1px solid var(--color-border)}.pf-thumb{width:28px;height:28px;object-fit:cover;border-radius:4px}.pf-name{font-size:12px;color:var(--text-secondary);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pf-remove{cursor:pointer;color:var(--text-muted);font-size:12px}.pf-remove:hover{color:var(--color-danger)}

/* 内联输入栏 */
.chat-input{border-top:1px solid var(--color-border);background:#fff;padding:8px 14px 10px}
.ci-bar{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px}
.ci-label{color:var(--text-muted);flex-shrink:0}
.ci-row{display:flex;align-items:center;gap:8px}
.ci-upload-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;color:var(--text-muted);flex-shrink:0;transition:all .15s}
.ci-upload-btn:hover{background:var(--color-primary-bg);color:var(--color-primary)}
.ci-upload-btn input{display:none}
.ci-input{flex:1}.ci-input :deep(.el-textarea__inner){border-radius:10px!important;font-size:13px;line-height:1.5;border-color:var(--color-border-light)!important}.ci-input :deep(.el-textarea__inner):focus{border-color:var(--color-primary-light)!important}
.ci-cost{font-size:11px;color:#F59E0B;font-weight:600;flex-shrink:0}
.ci-send{width:34px;height:34px;border:none;border-radius:10px;background:var(--color-primary);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}.ci-send:hover:not(:disabled){background:var(--color-primary-dark)}.ci-send:disabled{opacity:.35;cursor:not-allowed}
.spinner-sm{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.typing-dots{display:flex;gap:5px;padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}.typing-dots span{width:7px;height:7px;border-radius:50%;background:var(--color-primary-light);animation:dotBounce 1.4s infinite ease-in-out}.typing-dots span:nth-child(2){animation-delay:.2s}.typing-dots span:nth-child(3){animation-delay:.4s}
@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
.panel-empty{text-align:center;padding:50px 20px}.pe-text{font-size:13px;color:var(--text-muted);line-height:1.8;margin-top:12px}
.panel-topright{display:flex;align-items:center;gap:8px}
.pinline-score{display:flex;align-items:center;gap:6px}
.panel-progress{padding:12px 16px;border-bottom:1px solid var(--color-border-light)}.pp-bar{height:6px;border-radius:3px;background:#eef0f6;overflow:hidden;margin-bottom:6px}.pp-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#6366F1,#8B5CF6);transition:width .4s ease}.pp-text{font-size:12px;color:var(--text-muted)}
.panel-section{padding:14px 16px;border-bottom:1px solid var(--color-border-light)}.ps-head{font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:8px}.ps-body{font-size:13px;line-height:1.8;color:#444}.ps-body :deep(p){margin-bottom:6px}

/* 错题详解 */
.panel-card :deep(.wq-item){display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--color-border-light);align-items:flex-start}
.panel-card :deep(.wq-num){width:22px;height:22px;border-radius:50%;background:#EF4444;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
.panel-card :deep(.wq-text){font-size:13px;line-height:1.7;color:#555;flex:1}

/* 追分流程图 */
:deep(.flow-chart){display:flex;flex-direction:column}
:deep(.fc-step){display:flex;align-items:flex-start;gap:0;position:relative;padding-left:36px;min-height:50px}
:deep(.fcs-dot){width:28px;height:28px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;position:absolute;left:0;top:6px;z-index:1;flex-shrink:0}
:deep(.fcs-line){position:absolute;left:13px;top:38px;width:2px;bottom:0;background:var(--color-primary);opacity:.2}
:deep(.fcs-card){flex:1;margin-bottom:12px;padding:12px 14px;border-radius:10px;background:var(--color-bg);border:1px solid var(--color-border-light)}
:deep(.fcsc-top){display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
:deep(.fcsc-name){font-size:13px;font-weight:600;color:var(--text-primary)}
:deep(.fcsc-priority){font-size:10px;padding:1px 8px;border-radius:8px;font-weight:600}:deep(.fcsc-priority.hi){background:#FEE2E2;color:#EF4444}:deep(.fcsc-priority.mid){background:#FFF7ED;color:#F97316}:deep(.fcsc-priority.lo){background:#F0FDF4;color:#10B981}
:deep(.fcsc-bottom){display:flex;gap:12px;font-size:12px}
:deep(.fcsc-gain){color:#10B981;font-weight:600}:deep(.fcsc-time){color:var(--text-muted)}
.radar-section{overflow:visible}
.radar-section :deep(svg){max-width:400px}
/* 历史试卷 */
.ea-history{margin-top:24px;text-align:left}
.eah-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.eah-title{font-size:14px;font-weight:700;color:var(--text-primary)}
.eah-badge{font-size:11px;background:var(--color-primary-bg);color:var(--color-primary);padding:1px 8px;border-radius:10px;font-weight:600}
.ea-filter{display:flex;gap:6px;margin-bottom:10px}
.ea-h-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;cursor:pointer;transition:all .15s;border:1px solid var(--color-border-light);margin-bottom:4px}
.ea-h-item:hover{background:var(--color-primary-bg);border-color:var(--color-primary-light)}
.eah-left{display:flex;align-items:center;gap:8px}
.eah-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.eah-dot.green{background:#10B981}.eah-dot.gray{background:#CBD5E1}
.eah-name{font-size:13px;color:var(--text-primary);display:block}.eah-date{font-size:11px;color:var(--text-muted)}
.eah-right{display:flex;align-items:center;gap:6px}.eah-score{font-size:13px;color:#10B981;font-weight:600}.eah-noscore{font-size:11px;color:var(--text-muted)}
.msg-row.ai .msg-bubble :deep(h1),.msg-row.ai .msg-bubble :deep(h2),.msg-row.ai .msg-bubble :deep(h3),.msg-row.ai .msg-bubble :deep(h4){margin:8px 0 4px;font-weight:700}
.msg-row.ai .msg-bubble :deep(ol),.msg-row.ai .msg-bubble :deep(ul){padding-left:18px}.msg-row.ai .msg-bubble :deep(.katex){font-size:1.05em}.msg-row.ai .msg-bubble :deep(.katex-display){margin:8px 0}
.ea-wq-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0}.ea-wq-num{width:22px;height:22px;border-radius:50%;background:#EF4444;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}.ea-wq-text{flex:1;font-size:13px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:860px){.ea-layout{flex-direction:column;height:auto}.panel-card{max-height:500px}}
</style>
