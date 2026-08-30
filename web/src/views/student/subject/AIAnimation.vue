<template>
  <div class="aa-page">
    <router-link :to="backLink" class="back-link">← 返回学科中心</router-link>

    <div class="aa-hero">
      <div class="aa-emoji">📐</div>
      <h2>AI 动图</h2>
      <p>上传动点题图片或粘贴文字，AI 提取几何关系，生成可播放、可定位最值的交互动图</p>
      <router-link :to="historyLink" class="hist-link">📖 历史记录</router-link>
    </div>

    <div class="aa-layout">
      <!-- 左侧：输入 -->
      <div class="aa-left">
        <div class="upload-card">
          <div
            class="drop-zone"
            :class="{ 'has-img': previewUrl }"
            @dragover.prevent
            @drop.prevent="onDrop"
            @click="fileInput.click()"
          >
            <template v-if="!previewUrl">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.2" stroke-linecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
              <p class="dz-title">拖拽 / 点击 / 粘贴图片</p>
              <p class="dz-desc">支持 PNG / JPG，Ctrl+V 直接粘贴截图</p>
            </template>
            <template v-else>
              <img :src="previewUrl" class="dz-img" />
              <div class="dz-mask" @click.stop>
                <button class="dz-repick" @click.stop="fileInput.click()">更换图片</button>
              </div>
            </template>
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />

          <el-input
            v-model="descText"
            type="textarea"
            :rows="4"
            class="desc-input"
            placeholder="（可选）补充题目文字"
          />

          <div class="meta-row">
            <el-select v-model="grade" size="small" style="width:90px">
              <el-option v-for="g in ['初一','初二','初三']" :key="g" :label="g" :value="g"/>
            </el-select>
            <el-select v-model="subject" size="small" style="width:90px">
              <el-option v-for="s in ['数学','物理']" :key="s" :label="s" :value="s"/>
            </el-select>
            <el-button
              type="primary"
              size="small"
              :loading="analyzing"
              :disabled="!imageFile || analyzing"
              @click="generate"
              style="flex:1"
            >
              {{ analyzing ? 'AI 解析中…' : '✨ 生成动图' }}
            </el-button>
            <el-button size="small" :disabled="analyzing" @click="clearAll" title="清空页面">🗑 清空</el-button>
          </div>
          <div class="cost-hint" title="消耗6智学点">-6点</div>

          <!-- 伪进度条 -->
          <div v-if="analyzing" class="progress-box">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="progress-meta">
              <span class="pm-text">{{ progressText }}</span>
              <span class="pm-pct">{{ Math.floor(progress) }}%</span>
            </div>
          </div>

          <!-- 题目概述 -->
          <div v-if="questionText" class="title-box">
            <div class="title-label">📄 题目</div>
            <div class="title-text">{{ questionText }}</div>
          </div>

          <!-- 错误 -->
          <div v-if="errorMsg" class="error-box">⚠️ {{ errorMsg }}</div>
        </div>
      </div>

      <!-- 右侧：画布 + 控制 -->
      <div class="aa-right">
        <div ref="canvasCardEl" class="canvas-card" :class="{ 'is-empty': !hasScene }">
          <div v-if="!hasScene" class="canvas-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.2" opacity=".4">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
            </svg>
            <p>上传题目生成后，几何动图将在这里呈现</p>
            <p class="ce-sub">可手动播放、拖动滑杆、定位最小值查看动点运动全过程</p>
          </div>
          <div v-if="hasScene" ref="boardEl" class="board"></div>

          <!-- 全屏按钮（右上角） -->
          <button v-if="hasScene" class="btn-fullscreen" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
            {{ isFullscreen ? '⤢ 退出全屏' : '⛶ 全屏' }}
          </button>

          <!-- 图例（右下角） -->
          <div v-if="hasScene" class="legend">
            <span class="lg-item"><i class="dot" style="background:#0ea5e9"></i>主动点</span>
            <span class="lg-item"><i class="dot" style="background:#ef4444"></i>从动点</span>
            <span class="lg-item"><i class="dot" style="background:#000"></i>固定点</span>
            <span class="lg-item"><i class="line" style="background:#16a34a"></i>目标线段</span>
          </div>
        </div>

        <!-- 目标长度 / 答案 -->
        <div v-if="hasScene" class="answer-bar">
          <span v-if="targetLength != null" class="tg-len">
            目标 {{ targetLabel }} = <b>{{ targetLength.toFixed(2) }}</b>
          </span>
          <span v-if="answerText" class="answer-text">{{ answerText }}</span>
        </div>

        <!-- 知识点标签 -->
        <div v-if="hasScene && knowledgeTags.length" class="tag-row">
          <span v-for="(t, i) in knowledgeTags" :key="t" class="k-tag" :class="'k-tag-' + (i % 5)">{{ t }}</span>
        </div>

        <!-- 滑杆 -->
        <div v-if="hasScene && uiConfig.showSlider && sliders.length" class="slider-panel">
          <div v-for="s in sliders" :key="s.name" class="slider-row">
            <span class="sl-name">{{ s.name }}</span>
            <el-slider
              class="sl-bar"
              v-model="sliderVals[s.name]"
              :min="Number(s.min ?? 0)"
              :max="Number(s.max ?? 1)"
              :step="Number(s.step ?? 0.01)"
              :show-tooltip="false"
              @input="(v) => onSliderInput(s.name, v)"
            />
            <span class="sl-val">{{ formatNum(sliderVals[s.name]) }}</span>
          </div>
        </div>

        <!-- 播放控制 -->
        <div v-if="hasScene" class="player">
          <button class="btn-play" :disabled="analyzing" @click="togglePlay">
            <span v-if="!playing">▶</span><span v-else>⏸</span>
          </button>
          <button class="btn-reset" @click="reset">↺</button>
          <el-select v-model="speed" size="small" style="width:82px" @change="onSpeedChange">
            <el-option v-for="v in [0.5,1,2,4]" :key="v" :label="v+'×'" :value="v"/>
          </el-select>
          <button v-if="uiConfig.showLocateMin" class="btn-locate" @click="locateMin">🎯 定位最值</button>
          <button v-if="uiConfig.showTrace" class="btn-clear" @click="clearTrace">清除轨迹</button>
        </div>

        <!-- 缩放滑轨 -->
        <div v-if="hasScene" class="zoom-bar">
          <span class="zoom-icon">🔍</span>
          <el-slider v-model="zoomVal" :min="0.2" :max="8" :step="0.1" :show-tooltip="false" class="zoom-slider" @input="onZoomChange"/>
          <button class="btn-zoom-reset" @click="resetZoom">{{ Math.round(zoomVal * 100) }}%</button>
        </div>

        <!-- 开关 -->
        <div v-if="hasScene" class="switches">
          <el-switch v-if="uiConfig.showTrace" v-model="swTrace" active-text="轨迹" @change="onToggleTrace"/>
          <el-switch v-model="swAux" active-text="辅助线" @change="onToggleAux"/>
          <el-switch v-if="uiConfig.showCoordinate" v-model="swCoord" active-text="坐标系" @change="onToggleCoord"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '@/api/request'
import { saveAnimation, getAnimationDetail } from '@/api/common/ai'
import { createAnimationScene } from '@/utils/animationRenderer'

const route = useRoute()
const subjectRoute = computed(() => route.params.subject || 'math')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const backLink = computed(() => (isTeacher.value ? '/teacher/subject/math' : `/student/subject/${subjectRoute.value}`))
const historyLink = computed(() => (isTeacher.value ? '/teacher/subject/math/ai-animation-history' : `/student/subject/${subjectRoute.value}/ai-animation-history`))

const imageFile = ref(null)
const previewUrl = ref('')
const descText = ref('')
const grade = ref('初二')
const subject = ref('数学')
const analyzing = ref(false)
const errorMsg = ref('')
const questionText = ref('')
const answerText = ref('')

const fileInput = ref(null)
const boardEl = ref(null)
const scene = ref(null)
const hasScene = ref(false)
const playing = ref(false)
const sliders = ref([])
const sliderVals = ref({})
const speed = ref(1)
const targetLength = ref(null)
const targetLabel = ref('')
const knowledgeTags = ref([])
const uiConfig = ref({ showSlider: true, showLocateMin: true, showTrace: true, showCoordinate: true })
const swTrace = ref(true)
const swAux = ref(true)
const swCoord = ref(true)
const lastSceneJson = ref(null)
const coverImage = ref('')
const canvasCardEl = ref(null)
const zoomVal = ref(1)
const isFullscreen = ref(false)
const progress = ref(0)
const progressText = ref('')

// 伪进度条阶段（总时长约 1.5 分钟）
const PROGRESS_STAGES = [
  { max: 18, text: '识别图片题目…' },
  { max: 36, text: '理解题目含义…' },
  { max: 56, text: '构建参数模型…' },
  { max: 78, text: '生成几何画布…' },
  { max: 98, text: '参数注入中…' },
]
const PROGRESS_TOTAL = 90000 // 90 秒
let progressTimer = null

function startProgress() {
  stopProgress()
  progress.value = 0
  progressText.value = PROGRESS_STAGES[0].text
  const startTs = Date.now()
  progressTimer = setInterval(() => {
    const pct = Math.min(98, ((Date.now() - startTs) / PROGRESS_TOTAL) * 100)
    progress.value = pct
    const stage = PROGRESS_STAGES.find((s) => pct <= s.max)
    progressText.value = stage ? stage.text : PROGRESS_STAGES[PROGRESS_STAGES.length - 1].text
  }, 200)
}

function stopProgress() {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
}

function finishProgress() {
  stopProgress()
  progress.value = 100
  progressText.value = '生成完成'
}

function formatNum(v) { return Number(v).toFixed(2).replace(/\.?0+$/, '') }

// ---- 图片上传 / 粘贴 ----
function onFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) return
  setImage(f)
  e.target.value = ''
}
function onDrop(e) {
  const f = e.dataTransfer?.files?.[0]
  if (f) setImage(f)
}
function setImage(f) {
  if (!f.type.startsWith('image/')) { ElMessage.warning('请上传图片文件'); return }
  imageFile.value = f
  previewUrl.value = URL.createObjectURL(f)
  errorMsg.value = ''
}
function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile()
      if (f) { e.preventDefault(); setImage(f); break }
    }
  }
}

// 图片转 base64（对齐后端 DOUBAO_MAX_IMAGE_DIMENSION=1024）
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxW = 1024, maxH = 1024
        let w = img.width, h = img.height
        if (w > maxW || h > maxH) { const r = Math.min(maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r) }
        const c = document.createElement('canvas'); c.width = w; c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}

// ---- 生成 ----
async function generate() {
  if (!imageFile.value || analyzing.value) return
  analyzing.value = true
  errorMsg.value = ''
  clearScene()
  startProgress()

  try {
    const imageUrl = await fileToBase64(imageFile.value)
    coverImage.value = imageUrl
    const parts = ['请分析这道几何动点题，识别图形类型、动点/定点、几何约束与求解目标，输出完整几何场景 JSON']
    parts.push(`年级：${grade.value}，学科：${subject.value}`)
    if (descText.value.trim()) parts.push('【题目文字描述（以文字为准，可纠正图片识别误差）】\n' + descText.value.trim())
    const data = await http.post('/ai/animation', {
      imageUrl,
      messages: [{ role: 'user', content: parts.join('\n') }],
    })

    // 诊断：完整打印后端返回的 schema 原文，便于排查漏点/原点问题
    // 开发环境直接看浏览器控制台；生产环境经 logger 上报到后端 /client-log 查询
    console.log('[animation] 后端返回 schema 原文:', typeof data === 'string' ? data : JSON.stringify(data))

    const sceneJson = parseScene(data)
    if (!sceneJson) throw new Error('AI 未能解析出几何关系，请换一张更清晰的题目图')
    await renderScene(sceneJson)
    saveHistory()
    finishProgress()
    await new Promise((r) => setTimeout(r, 600)) // 让 100% 可见
    ElMessage.success('动图生成成功，可手动播放 / 定位最值')
  } catch (e) {
    stopProgress()
    errorMsg.value = e?.message || '生成失败，请重试'
    ElMessage.error(errorMsg.value)
  } finally {
    analyzing.value = false
  }
}

function parseScene(data) {
  if (!data) return null
  if (typeof data === 'string') {
    const cleaned = data.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    try { return JSON.parse(cleaned) } catch { return null }
  }
  if (typeof data === 'object') return data
  return null
}

async function renderScene(sceneJson) {
  lastSceneJson.value = sceneJson
  const meta = sceneJson?.meta || {}
  questionText.value = meta.question || meta.title || sceneJson?.title || ''
  answerText.value = meta.answer || ''

  hasScene.value = true
  await nextTick()
  if (!boardEl.value) return

  const sc = createAnimationScene(boardEl.value, sceneJson)
  scene.value = sc

  // UI 开关（知识点模板路由下发） + 知识点标签
  uiConfig.value = sc.ui || { showSlider: true, showLocateMin: true, showTrace: true, showCoordinate: true }
  knowledgeTags.value = sc.knowledgeTags || []

  // 滑杆
  sliders.value = sc.getSliders() || []
  sliderVals.value = {}
  for (const s of sliders.value) sliderVals.value[s.name] = Number(s.min ?? 0)

  targetLabel.value = sc.getTargetLabel()

  sc.onTick((tick) => {
    targetLength.value = tick.targetLength
    // 同步滑杆值（播放时）
    for (const k in tick.params) sliderVals.value[k] = tick.params[k]
  })

  targetLength.value = sc.getTargetLength()
  playing.value = false
  swTrace.value = uiConfig.value.showTrace
  swAux.value = true
  swCoord.value = uiConfig.value.showCoordinate
}

// 保存历史（schema 持久化，静默失败不影响主流程）
async function saveHistory() {
  if (!lastSceneJson.value) return
  try {
    const meta = lastSceneJson.value?.meta || {}
    await saveAnimation({
      title: meta.title || questionText.value || '未命名动图',
      grade: grade.value,
      subject: subject.value,
      knowledgeTags: knowledgeTags.value || [],
      schema: JSON.stringify(lastSceneJson.value),
      coverImage: coverImage.value || '',
    })
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || '保存失败'
    ElMessage.warning('动图已生成，但保存历史失败：' + msg)
  }
}

// 通过 route.query.id 加载历史 schema
async function loadHistory(id) {
  try {
    const res = await getAnimationDetail(id)
    const record = res?.data ?? res
    const schemaStr = record?.schema ?? record?.schemaJson ?? ''
    if (!schemaStr) { ElMessage.warning('未找到该历史记录'); return }
    const sceneJson = typeof schemaStr === 'string' ? JSON.parse(schemaStr) : schemaStr
    if (sceneJson) {
      grade.value = record?.grade || sceneJson?.meta?.grade || grade.value
      subject.value = record?.subject || sceneJson?.meta?.subject || subject.value
      await renderScene(sceneJson)
    }
  } catch (e) { ElMessage.error('加载历史失败：' + (e?.message || '数据异常')) }
}

function clearScene() {
  scene.value?.destroy()
  scene.value = null
  hasScene.value = false
  questionText.value = ''
  answerText.value = ''
  targetLength.value = null
  sliders.value = []
  sliderVals.value = {}
  playing.value = false
}

// 清空整个页面：输入 + 已生成场景，回到初始状态
function clearAll() {
  if (analyzing.value) return
  stopProgress()
  clearScene()
  imageFile.value = null
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }
  descText.value = ''
  grade.value = '初二'
  subject.value = '数学'
  errorMsg.value = ''
  knowledgeTags.value = []
  lastSceneJson.value = null
  coverImage.value = ''
  progress.value = 0
  progressText.value = ''
  zoomVal.value = 1
}

// ---- 控制 ----
function onSliderInput(name, v) { scene.value?.setParam(name, v) }

function togglePlay() {
  if (!scene.value) return
  if (playing.value) { scene.value.pause(); playing.value = false }
  else { scene.value.play(); playing.value = true }
}
function reset() { scene.value?.stop(); playing.value = false }
function onSpeedChange(v) { scene.value?.setSpeed(v) }
function locateMin() {
  const res = scene.value?.locate()
  playing.value = false
  if (res) ElMessage.success(`已定位最值：参数 = ${formatNum(res.t)}，长度 = ${res.len.toFixed(2)}`)
}
function clearTrace() { scene.value?.clearTrace() }
function onToggleTrace(v) { scene.value?.toggleTrace(v) }
function onToggleAux(v) { scene.value?.toggleAuxiliary(v) }
function onToggleCoord(v) { scene.value?.toggleCoordinate(v) }

// ---- 缩放 / 全屏 ----
function onZoomChange(v) { scene.value?.setZoom(v) }
function resetZoom() { zoomVal.value = 1; scene.value?.setZoom(1) }
async function toggleFullscreen() {
  const el = canvasCardEl.value
  if (!el) return
  try {
    if (!document.fullscreenElement) await el.requestFullscreen()
    else await document.exitFullscreen()
  } catch (e) { /* skip */ }
}
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  nextTick(() => scene.value?.resize())
}

onMounted(() => {
  window.addEventListener('paste', onPaste)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if (route.query.id) loadHistory(route.query.id)
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  stopProgress()
  scene.value?.destroy()
  scene.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.aa-page { max-width: 1200px; margin: 0 auto; padding: 12px 14px 40px; }

.aa-hero { text-align: center; padding: 12px 0 16px; }
.aa-emoji { font-size: 42px; }
.aa-hero h2 { font-size: 22px; font-weight: 800; margin: 4px 0 2px; color: var(--text-primary); }
.aa-hero p { font-size: 13px; color: var(--text-muted); }
.hist-link { display: inline-block; margin-top: 6px; font-size: 13px; color: var(--color-primary); text-decoration: none; font-weight: 600; }
.hist-link:hover { text-decoration: underline; }

.aa-layout { display: flex; gap: 16px; align-items: stretch; }
.aa-left { width: 340px; flex-shrink: 0; }
.aa-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

.upload-card { background: var(--color-surface); border-radius: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); padding: 16px; }
.drop-zone { border: 2px dashed var(--color-border); border-radius: 12px; padding: 22px 16px; text-align: center; cursor: pointer; transition: all .2s; position: relative; overflow: hidden; }
.drop-zone:hover { border-color: var(--color-primary-light); background: var(--color-primary-bg); }
.drop-zone.has-img { padding: 0; border-style: solid; }
.dz-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 10px 0 4px; }
.dz-desc { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
.dz-img { width: 100%; max-height: 220px; object-fit: contain; display: block; background: var(--color-bg); }
.dz-mask { position: absolute; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; }
.drop-zone.has-img:hover .dz-mask { opacity: 1; }
.dz-repick { border: none; background: #fff; color: #333; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 600; }
.desc-input { margin-top: 12px; }
.meta-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
.cost-hint { font-size: 11px; color: #F59E0B; font-weight: 600; margin-top: 8px; }

.progress-box { margin-top: 12px; }
.progress-track { height: 8px; background: var(--color-bg); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #0ea5e9); border-radius: 4px; transition: width .2s ease; }
.progress-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 12px; }
.pm-text { color: var(--color-primary); font-weight: 600; }
.pm-pct { color: var(--text-muted); font-variant-numeric: tabular-nums; }

.title-box { margin-top: 12px; padding: 12px; background: var(--color-bg); border-radius: 10px; border: 1px solid var(--color-border-light); }
.title-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.title-text { font-size: 13px; color: var(--text-primary); line-height: 1.6; }
.error-box { margin-top: 12px; padding: 10px 12px; background: #FEF2F2; color: #EF4444; border-radius: 8px; font-size: 12px; line-height: 1.6; }

.canvas-card { flex: 1; min-height: 440px; background: #fff; border-radius: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); position: relative; overflow: hidden; }
.canvas-card.is-empty { display: flex; align-items: center; justify-content: center; }
.canvas-empty { text-align: center; padding: 40px 20px; color: var(--text-muted); }
.canvas-empty p { font-size: 14px; margin-top: 12px; }
.ce-sub { font-size: 12px; opacity: .7; }
.board { position: absolute; inset: 0; }

.legend { position: absolute; right: 10px; bottom: 10px; background: rgba(255,255,255,.92); border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text-secondary); box-shadow: var(--shadow-sm); }
.lg-item { display: flex; align-items: center; gap: 6px; }
.lg-item .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.lg-item .line { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }

.answer-bar { display: flex; align-items: center; gap: 16px; padding: 8px 14px; background: #fff; border-radius: 10px; border: 1px solid var(--color-border); font-size: 13px; }
.tg-len b { color: #16a34a; font-size: 15px; }
.answer-text { color: var(--text-secondary); flex: 1; }

.tag-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 4px; }
.k-tag { font-size: 12px; padding: 3px 10px; border-radius: 12px; font-weight: 500; }
.k-tag-0 { background: #eef2ff; color: #4f46e5; }
.k-tag-1 { background: #fef3c7; color: #b45309; }
.k-tag-2 { background: #dcfce7; color: #15803d; }
.k-tag-3 { background: #fee2e2; color: #b91c1c; }
.k-tag-4 { background: #e0f2fe; color: #0369a1; }

.slider-panel { display: flex; flex-direction: column; gap: 4px; padding: 6px 14px; background: #fff; border-radius: 10px; border: 1px solid var(--color-border); }
.slider-row { display: flex; align-items: center; gap: 10px; }
.sl-name { width: 36px; font-weight: 700; color: var(--color-primary); font-size: 13px; }
.sl-bar { flex: 1; margin: 0; }
.sl-val { width: 52px; text-align: right; font-size: 12px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

.player { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #fff; border-radius: 10px; border: 1px solid var(--color-border); }
.btn-play, .btn-reset { width: 42px; height: 42px; border-radius: 50%; border: none; cursor: pointer; font-size: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.btn-play { background: var(--color-primary); color: #fff; }
.btn-play:hover { background: var(--color-primary-dark); }
.btn-reset { background: var(--color-bg); color: var(--text-primary); border: 1px solid var(--color-border); }
.btn-locate, .btn-clear { border: 1px solid var(--color-border); background: #fff; color: var(--text-primary); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-locate { border-color: #16a34a; color: #16a34a; font-weight: 600; }
.btn-locate:hover { background: #f0fdf4; }
.btn-clear:hover { background: var(--color-bg); }

.switches { display: flex; gap: 20px; padding: 4px 14px; font-size: 13px; }

.btn-fullscreen { position: absolute; top: 10px; right: 10px; z-index: 5; border: 1px solid var(--color-border); background: rgba(255,255,255,.92); color: var(--text-primary); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; box-shadow: var(--shadow-sm); }
.btn-fullscreen:hover { background: #fff; }

.zoom-bar { display: flex; align-items: center; gap: 10px; padding: 6px 14px; background: #fff; border-radius: 10px; border: 1px solid var(--color-border); }
.zoom-icon { font-size: 14px; }
.zoom-slider { flex: 1; margin: 0; }
.btn-zoom-reset { border: 1px solid var(--color-border); background: #fff; color: var(--text-primary); padding: 4px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; font-variant-numeric: tabular-nums; }
.btn-zoom-reset:hover { background: var(--color-bg); }

.canvas-card:fullscreen { background: #fff; border-radius: 0; min-height: 100vh; }

@media (max-width: 860px) {
  .aa-layout { flex-direction: column; }
  .aa-left { width: 100%; }
  .canvas-card { min-height: 320px; }
}
</style>
