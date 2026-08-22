<template>
  <div class="bu-page">
    <div class="bu-header">
      <div class="bu-header-title">
        <el-button class="bu-back" text @click="goBack">← 返回上一页</el-button>
        <div>
          <h2>📤 批量上传题目</h2>
          <p>上传 PDF 或图片，自动识别题目、框选配图、批量入库</p>
        </div>
      </div>
      <div class="bu-top-controls">
        <el-radio-group v-model="uploadType">
          <el-radio-button value="NEW">新题</el-radio-button>
          <el-radio-button value="WRONG">错题</el-radio-button>
        </el-radio-group>
        <span class="bu-shared">共享 <el-switch v-model="shared" /></span>
      </div>
    </div>

    <!-- 上传区 -->
    <div v-if="!pages.length" class="bu-upload">
      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        multiple
        accept=".pdf,image/*"
        :on-change="onFileChange"
        :disabled="processing"
      >
        <div class="bu-upload-icon">📄</div>
        <div class="bu-upload-text">拖拽 PDF 或图片到此处，或<em>点击选择</em></div>
        <div class="bu-upload-tip">仅支持 .pdf / 图片文件，PDF 自动分页识别</div>
      </el-upload>
    </div>

    <!-- 处理中 -->
    <div v-if="processing" class="bu-processing">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在识别第 {{ processedCount + 1 }}/{{ totalPages }} 页…</span>
    </div>

    <!-- 主分栏 -->
    <div v-if="pages.length" class="bu-layout">
      <!-- 左：页内预览 -->
      <div class="bu-preview">
        <div class="bu-preview-toolbar">
          <span class="bu-page-info">第 {{ currentPage + 1 }} / {{ pages.length }} 页</span>
          <div style="margin-left:auto;display:flex;gap:6px">
            <el-button size="small" :disabled="currentPage === 0" @click="currentPage--">‹ 上一页</el-button>
            <el-button size="small" :disabled="currentPage === pages.length - 1" @click="currentPage++">下一页 ›</el-button>
            <el-button size="small" @click="resetAll">↺ 重新上传</el-button>
          </div>
        </div>
        <div class="bu-page-wrap" ref="pageWrap">
          <img :src="pages[currentPage].imageUrl" class="bu-page-img" ref="pageImg" draggable="false" />
          <!-- 蓝框：题目区域（可拖拽/缩放） -->
          <div
            v-for="(q, qi) in pages[currentPage].questions"
            :key="q.id"
            class="qbox"
            :style="boxStyle(q.bbox)"
            @pointerdown="startBlueDrag(q, 'move', $event)"
          >
            <span class="qbox-label">{{ qi + 1 }}</span>
            <div class="qbox-tools" @pointerdown.stop>
              <el-select v-model="q.questionType" size="small" style="width:76px" @click.stop>
                <el-option v-for="t in questionTypes" :key="t" :label="t" :value="t" />
              </el-select>
              <el-button v-if="!q.cropActive" size="small" type="primary" @click.stop="activateCrop(q)">✂️ 配图</el-button>
              <template v-else>
                <el-button size="small" type="success" @click.stop="confirmCrop(q)">✓ 截取</el-button>
                <el-button size="small" @click.stop="q.cropActive = false">取消</el-button>
              </template>
            </div>
            <span class="bq-handle bh-nw" @pointerdown.stop="startBlueDrag(q,'nw',$event)"></span>
            <span class="bq-handle bh-n" @pointerdown.stop="startBlueDrag(q,'n',$event)"></span>
            <span class="bq-handle bh-ne" @pointerdown.stop="startBlueDrag(q,'ne',$event)"></span>
            <span class="bq-handle bh-e" @pointerdown.stop="startBlueDrag(q,'e',$event)"></span>
            <span class="bq-handle bh-se" @pointerdown.stop="startBlueDrag(q,'se',$event)"></span>
            <span class="bq-handle bh-s" @pointerdown.stop="startBlueDrag(q,'s',$event)"></span>
            <span class="bq-handle bh-sw" @pointerdown.stop="startBlueDrag(q,'sw',$event)"></span>
            <span class="bq-handle bh-w" @pointerdown.stop="startBlueDrag(q,'w',$event)"></span>
          </div>
          <!-- 红框：配图截取（在蓝框内拖拽） -->
          <div
            v-for="q in pages[currentPage].questions.filter(x => x.cropActive)"
            :key="q.id + '-crop'"
            class="crop-red"
            :style="boxStyle(q.cropRect)"
            @pointerdown="startRedDrag(q, 'move', $event)"
          >
            <span class="crop-handle ch-nw" @pointerdown.stop="startRedDrag(q,'nw',$event)"></span>
            <span class="crop-handle ch-n" @pointerdown.stop="startRedDrag(q,'n',$event)"></span>
            <span class="crop-handle ch-ne" @pointerdown.stop="startRedDrag(q,'ne',$event)"></span>
            <span class="crop-handle ch-e" @pointerdown.stop="startRedDrag(q,'e',$event)"></span>
            <span class="crop-handle ch-se" @pointerdown.stop="startRedDrag(q,'se',$event)"></span>
            <span class="crop-handle ch-s" @pointerdown.stop="startRedDrag(q,'s',$event)"></span>
            <span class="crop-handle ch-sw" @pointerdown.stop="startRedDrag(q,'sw',$event)"></span>
            <span class="crop-handle ch-w" @pointerdown.stop="startRedDrag(q,'w',$event)"></span>
          </div>
        </div>
      </div>

      <!-- 右：题目预览 -->
      <div class="bu-list">
        <div class="bu-list-head">
          <span>题目预览（本页 {{ currentQuestions.length }} 题）</span>
          <el-checkbox v-model="selectAll" @change="toggleSelectAll">全选</el-checkbox>
        </div>
        <div class="bu-list-scroll">
          <div v-for="(q, qi) in currentQuestions" :key="q.id" class="qcard" :class="{ selected: q.selected }">
            <div class="qcard-head">
              <el-checkbox v-model="q.selected" />
              <span class="qcard-idx">第 {{ qi + 1 }} 题</span>
              <el-tag size="small" type="info">P{{ q.pageIndex + 1 }}</el-tag>
              <span class="qcard-type">{{ q.questionType }}</span>
              <span class="qcard-del" title="取消该题识别" @click.stop="removeQuestion(q)">✕</span>
            </div>
            <!-- 题干：默认渲染预览，点编辑切换输入框 -->
            <div v-if="!q.editing" class="qcard-preview-wrap">
              <div class="qcard-preview" v-html="q._textHtml"></div>
              <el-button size="small" text type="primary" @click="startEdit(q)">✏️ 编辑</el-button>
            </div>
            <template v-else>
              <el-input v-model="q.text" type="textarea" :rows="4" placeholder="题目内容" />
              <div style="margin-top:6px;display:flex;gap:6px">
                <el-button size="small" type="primary" @click="saveEdit(q)">保存</el-button>
                <el-button size="small" @click="cancelEdit(q)">取消</el-button>
              </div>
            </template>
            <div class="qcard-body">
              <div v-if="q.diagram" class="qcard-diagram">
                <img :src="q.diagram" @click="previewImg = q.diagram; showPreview = true" />
                <span class="qcard-diagram-del" @click.stop="q.diagram = ''">✕</span>
              </div>
              <el-button v-else size="small" text type="primary" @click="activateCrop(q); currentPage = q.pageIndex">✂️ 添加配图</el-button>

              <!-- 知识点悬浮框 -->
              <el-popover placement="bottom" width="300" trigger="click">
                <template #reference>
                  <span class="kp-chip" :class="{ filled: q.kpIds.length }">
                    {{ q.kpIds.length ? kpLabel(q) : '🏷 知识点' }}
                  </span>
                </template>
                <el-select v-model="q.kpIds" multiple filterable placeholder="选择本题知识点" style="width:100%">
                  <el-option v-for="k in kps" :key="k.id" :label="k.name" :value="k.id" />
                </el-select>
              </el-popover>

              <!-- 解析悬浮按钮 -->
              <el-popover placement="bottom" width="340" trigger="click">
                <template #reference>
                  <span class="analysis-chip" :class="{ done: q.analysisDone }">
                    {{ q.analysisDone ? '✅ 解析' : '📝 解析' }}
                  </span>
                </template>
                <el-input v-model="q.analysis" type="textarea" :rows="4" placeholder="输入解析文字（可 Ctrl+V 粘贴）" />
                <div style="margin-top:6px;display:flex;align-items:center;gap:6px">
                  <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="(f) => onAnalysisImg(q, f)">
                    <el-button size="small">📁 上传解析图</el-button>
                  </el-upload>
                  <img v-if="q.analysisImage" :src="q.analysisImage" style="max-width:60px;max-height:40px;border-radius:4px" />
                </div>
                <el-button type="primary" size="small" style="margin-top:8px;width:100%" @click="q.analysisDone = true">确定</el-button>
              </el-popover>
            </div>
          </div>
          <el-empty v-if="!currentQuestions.length" description="本页暂无题目" :image-size="80" />
        </div>
        <div class="bu-list-foot">
          <el-button type="primary" size="large" :disabled="!selectedCount" :loading="submitting" @click="submitBatch">
            📥 添加至题库（已选 {{ selectedCount }} 题）
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPreview" title="配图预览" width="70%" destroy-on-close>
      <img :src="previewImg" style="width:100%;max-height:75vh;object-fit:contain" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getKnowledgePoints } from '@/api/common/knowledge'
import { uploadTeacherQuestion } from '@/api/common/questions'
import { renderMarkdown } from '@/utils/markdown'
import * as pdfjsImport from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'

const pdfjsLib = pdfjsImport.getDocument ? pdfjsImport : (pdfjsImport.default || pdfjsImport)

const questionTypes = ['选择题', '填空题', '计算题', '解答题']

const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/teacher/subject/math/manage')
}

const uploadType = ref('NEW')      // NEW | WRONG
const shared = ref(true)
const processing = ref(false)
const processedCount = ref(0)
const totalPages = ref(0)
const pages = ref([])             // [{ imageUrl, file, width, height, questions: [] }]
const currentPage = ref(0)
const pageWrap = ref(null)
const pageImg = ref(null)
const kps = ref([])
const submitting = ref(false)
const showPreview = ref(false)
const previewImg = ref('')
const selectAll = ref(false)

const allQuestions = computed(() => pages.value.flatMap(p => p.questions))
const currentQuestions = computed(() => pages.value[currentPage.value]?.questions || [])
const selectedCount = computed(() => allQuestions.value.filter(q => q.selected).length)

// 红框拖拽状态
let dragQ = null
let dragHandle = ''
let dragStart = null
// 蓝框拖拽状态
let dragBQ = null
let dragBHandle = ''
let dragBStart = null

function boxStyle(r) {
  return { left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%' }
}
function clamp(v, min, max) { return Math.max(min, Math.min(v, max)) }

function loadKps() { getKnowledgePoints({ subject: 'math', pageSize: 200 }).then(r => { kps.value = r?.list || [] }).catch(() => {}) }
loadKps()

function kpLabel(q) {
  return q.kpIds.map(id => kps.value.find(k => k.id === id)?.name).filter(Boolean).join('、') || '已选知识点'
}

// ===== 文件读取 =====
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file)
  })
}
function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsArrayBuffer(file)
  })
}
function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'))
}
function getImageDims(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = url
  })
}

// ===== 文件处理入口 =====
async function onFileChange(f) {
  const raw = f?.raw
  if (!raw) return
  const isPdf = raw.type === 'application/pdf' || raw.name.toLowerCase().endsWith('.pdf')
  const isImage = raw.type.startsWith('image/')
  if (!isPdf && !isImage) { ElMessage.warning('仅支持 PDF 或图片文件'); return }
  try {
    if (isPdf) await handlePdf(raw)
    else await handleImage(raw)
  } catch (e) { ElMessage.error('处理失败：' + (e?.message || e)) }
}

async function handleImage(file) {
  const dataUrl = await fileToDataUrl(file)
  const dims = await getImageDims(dataUrl)
  const page = { imageUrl: dataUrl, file, width: dims.width, height: dims.height, questions: [] }
  pages.value.push(page)
  await ocrPage(page)
}

async function handlePdf(file) {
  const buffer = await fileToArrayBuffer(file)
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  totalPages.value += pdf.numPages
  for (let i = 1; i <= pdf.numPages; i++) {
    const p = await pdf.getPage(i)
    const vp = p.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height)
    await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const blob = await canvasToBlob(canvas)
    const page = { imageUrl: dataUrl, file: blob, width: vp.width, height: vp.height, questions: [] }
    pages.value.push(page)
    await ocrPage(page)
    processedCount.value++
  }
}

async function ocrPage(page) {
  const pageIndex = pages.value.indexOf(page)
  processing.value = true
  try {
    const fd = new FormData()
    fd.append('file', page.file, 'page.png')
    const res = await fetch('/ocr', { method: 'POST', body: fd })
    const data = await res.json()
    console.log('[BatchUpload OCR]', JSON.stringify({
      error: data?.error ?? null,
      pages: data?.pages?.length ?? 0,
      blocks: (data?.pages?.[0]?.blocks || []).map(b => ({ l: b.label, c: (b.content || '').slice(0, 24), bbox: b.bbox })),
      text: (data?.text || '').slice(0, 60),
    }))
    if (data.error) { ElMessage.warning('该页 OCR 失败：' + data.error) }
    const op = (data.pages && data.pages[0]) || {}
    const W = op.width || page.width
    const H = op.height || page.height
    const blocks = op.blocks || []
    // 按「题号」切分题目：题号块开启新题，吞并其后直至下一题号前的块（选项/图片/图题）
    let groups = groupQuestions(blocks)
    // 未识别出题号时：每个文本块视为一题，图片/图题块归入前一个文本块
    if (!groups.length) {
      let cur = null
      for (const b of blocks) {
        if (b.label === 'text' && b.content) { cur = [b]; groups.push(cur) }
        else if (cur && (b.label === 'image' || b.label === 'figure_title')) cur.push(b)
      }
    }
    pages.value[pageIndex].questions = groups.map((g, idx) => {
      const textBlocks = g.filter(b => b.label === 'text' && b.content)
      const imgBlock = g.find(b => b.label === 'image')
      return {
        id: 'p' + pageIndex + '-' + idx,
        pageIndex,
        bbox: unionBboxes(g, W, H) || defaultBbox(idx, groups.length),
        text: textBlocks.map(b => b.content).join('\n'),
        editing: false,
        _textHtml: '',
        questionType: '选择题',
        kpIds: [],
        diagram: '',
        diagramCrop: imgBlock ? bboxToPct(imgBlock.bbox, W, H) : null,
        cropRect: { x: 0, y: 0, w: 0, h: 0 },
        cropActive: false,
        analysis: '',
        analysisImage: '',
        analysisDone: false,
        selected: false,
      }
    })
    // 兜底：未识别出任何题号时，整页文字作为一题
    if (!pages.value[pageIndex].questions.length && (data.text || '').trim()) {
      pages.value[pageIndex].questions = [{
        id: 'p' + pageIndex + '-0', pageIndex,
        bbox: { x: 0, y: 0, w: 100, h: 100 },
        text: data.text, questionType: '选择题', kpIds: [],
        editing: false, _textHtml: '',
        diagram: '', diagramCrop: null,
        cropRect: { x: 0, y: 0, w: 0, h: 0 }, cropActive: false,
        analysis: '', analysisImage: '', analysisDone: false, selected: false,
      }]
    }
    // 渲染每道题的题干 HTML 预览（含 LaTeX 公式）
    await Promise.all(pages.value[pageIndex].questions.map(async (q) => {
      q._textHtml = await renderMarkdown(q.text)
    }))
  } finally {
    processing.value = false
  }
}

function isQuestionStart(content) {
  const c = (content || '').trim()
  return /^\d+[\.、．\s]/.test(c) || /^第\s*\d+\s*[题问]/.test(c) || /^[（(]\s*\d+\s*[）)]/.test(c)
}
function groupQuestions(blocks) {
  const groups = []
  let cur = null
  for (const b of blocks) {
    if (b.label === 'text' && b.content && isQuestionStart(b.content)) {
      cur = [b]; groups.push(cur)
    } else if (cur && (b.label === 'text' || b.label === 'image' || b.label === 'figure_title')) {
      cur.push(b)
    }
  }
  return groups
}
function bboxToPct(bbox, w, h) {
  if (!Array.isArray(bbox) || bbox.length < 4 || !w || !h) return null
  const x1 = Number(bbox[0]), y1 = Number(bbox[1]), x2 = Number(bbox[2]), y2 = Number(bbox[3])
  const x = Math.min(x1, x2), y = Math.min(y1, y2)
  const bw = Math.abs(x2 - x1), bh = Math.abs(y2 - y1)
  if (bw <= 0 || bh <= 0) return null
  return { x: x / w * 100, y: y / h * 100, w: bw / w * 100, h: bh / h * 100 }
}
function unionBboxes(group, w, h) {
  const valid = group.map(b => bboxToPct(b.bbox, w, h)).filter(Boolean)
  if (!valid.length) return null
  const x1 = Math.min(...valid.map(r => r.x))
  const y1 = Math.min(...valid.map(r => r.y))
  const x2 = Math.max(...valid.map(r => r.x + r.w))
  const y2 = Math.max(...valid.map(r => r.y + r.h))
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}
function defaultBbox(idx, count) {
  const h = 100 / Math.max(1, count)
  return { x: 0, y: idx * h, w: 100, h: h }
}

// ===== 配图裁剪 =====
function activateCrop(q) {
  const b = q.bbox
  q.cropRect = q.diagramCrop ? { ...q.diagramCrop } : { x: b.x + b.w * 0.1, y: b.y + b.h * 0.1, w: b.w * 0.8, h: b.h * 0.8 }
  q.cropActive = true
  currentPage.value = q.pageIndex
}
function startRedDrag(q, handle, e) {
  const img = pageImg.value
  if (!img) return
  dragQ = q; dragHandle = handle
  const rect = img.getBoundingClientRect()
  dragStart = {
    x: e.clientX, y: e.clientY,
    left: q.cropRect.x, top: q.cropRect.y,
    right: q.cropRect.x + q.cropRect.w, bottom: q.cropRect.y + q.cropRect.h,
    dispW: rect.width, dispH: rect.height,
    bx: q.bbox.x, by: q.bbox.y, bx2: q.bbox.x + q.bbox.w, by2: q.bbox.y + q.bbox.h,
  }
  window.addEventListener('pointermove', onRedMove)
  window.addEventListener('pointerup', onRedUp)
  e.preventDefault()
}
function onRedMove(e) {
  if (!dragStart) return
  const dxPct = (e.clientX - dragStart.x) / dragStart.dispW * 100
  const dyPct = (e.clientY - dragStart.y) / dragStart.dispH * 100
  const MIN = 2
  let { left, top, right, bottom, bx, by, bx2, by2 } = dragStart
  if (dragHandle === 'move') {
    const w = right - left, h = bottom - top
    left = clamp(dragStart.left + dxPct, bx, bx2 - w)
    top = clamp(dragStart.top + dyPct, by, by2 - h)
    right = left + w; bottom = top + h
  } else {
    if (dragHandle.includes('w')) left = dragStart.left + dxPct
    if (dragHandle.includes('e')) right = dragStart.right + dxPct
    if (dragHandle.includes('n')) top = dragStart.top + dyPct
    if (dragHandle.includes('s')) bottom = dragStart.bottom + dyPct
    left = clamp(left, bx, right - MIN); right = clamp(right, left + MIN, bx2)
    top = clamp(top, by, bottom - MIN); bottom = clamp(bottom, top + MIN, by2)
  }
  dragQ.cropRect.x = left; dragQ.cropRect.y = top
  dragQ.cropRect.w = right - left; dragQ.cropRect.h = bottom - top
}
function onRedUp() {
  dragQ = null; dragHandle = ''; dragStart = null
  window.removeEventListener('pointermove', onRedMove)
  window.removeEventListener('pointerup', onRedUp)
}
function startBlueDrag(q, handle, e) {
  const img = pageImg.value
  if (!img) return
  dragBQ = q; dragBHandle = handle
  const rect = img.getBoundingClientRect()
  dragBStart = {
    x: e.clientX, y: e.clientY,
    left: q.bbox.x, top: q.bbox.y,
    right: q.bbox.x + q.bbox.w, bottom: q.bbox.y + q.bbox.h,
    dispW: rect.width, dispH: rect.height,
  }
  window.addEventListener('pointermove', onBlueMove)
  window.addEventListener('pointerup', onBlueUp)
  e.preventDefault()
}
function onBlueMove(e) {
  if (!dragBStart) return
  const dxPct = (e.clientX - dragBStart.x) / dragBStart.dispW * 100
  const dyPct = (e.clientY - dragBStart.y) / dragBStart.dispH * 100
  const MIN = 2
  let { left, top, right, bottom } = dragBStart
  if (dragBHandle === 'move') {
    const w = right - left, h = bottom - top
    left = clamp(dragBStart.left + dxPct, 0, 100 - w)
    top = clamp(dragBStart.top + dyPct, 0, 100 - h)
    right = left + w; bottom = top + h
  } else {
    if (dragBHandle.includes('w')) left = dragBStart.left + dxPct
    if (dragBHandle.includes('e')) right = dragBStart.right + dxPct
    if (dragBHandle.includes('n')) top = dragBStart.top + dyPct
    if (dragBHandle.includes('s')) bottom = dragBStart.bottom + dyPct
    left = clamp(left, 0, right - MIN); right = clamp(right, left + MIN, 100)
    top = clamp(top, 0, bottom - MIN); bottom = clamp(bottom, top + MIN, 100)
  }
  dragBQ.bbox.x = left; dragBQ.bbox.y = top
  dragBQ.bbox.w = right - left; dragBQ.bbox.h = bottom - top
}
function onBlueUp() {
  dragBQ = null; dragBHandle = ''; dragBStart = null
  window.removeEventListener('pointermove', onBlueMove)
  window.removeEventListener('pointerup', onBlueUp)
}
function confirmCrop(q) {
  // 直接用页面上已显示的 <img>（必然已加载）同步裁剪；截取后红框保留，供继续微调/重截，用「取消」关闭
  const imgEl = pageImg.value
  if (!imgEl || !imgEl.complete || !imgEl.naturalWidth) {
    ElMessage.warning('图片尚未加载完成，请稍后再试')
    return
  }
  const nw = imgEl.naturalWidth, nh = imgEl.naturalHeight
  const sx = q.cropRect.x / 100 * nw, sy = q.cropRect.y / 100 * nh
  const sw = q.cropRect.w / 100 * nw, sh = q.cropRect.h / 100 * nh
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(sw)); c.height = Math.max(1, Math.round(sh))
  c.getContext('2d').drawImage(imgEl, sx, sy, sw, sh, 0, 0, c.width, c.height)
  q.diagram = c.toDataURL('image/png')
  ElMessage.success('配图已截取（红框保留，可继续微调，或点「取消」关闭）')
}

// ===== 解析图 =====
function onAnalysisImg(q, f) {
  if (!f?.raw) return
  const r = new FileReader()
  r.onload = () => { q.analysisImage = r.result }
  r.readAsDataURL(f.raw)
}

// ===== 题干编辑 =====
function startEdit(q) {
  q._editText = q.text
  q.editing = true
}
async function saveEdit(q) {
  q._textHtml = await renderMarkdown(q.text)
  q.editing = false
  ElMessage.success('已保存')
}
function cancelEdit(q) {
  q.text = q._editText || ''
  q.editing = false
}

// ===== 批量选择 =====
function toggleSelectAll(v) { allQuestions.value.forEach(q => { q.selected = v }) }

// 取消某题的识别：从当前页删除该题（同时移除左侧对应的蓝框/红框/配图）
function removeQuestion(q) {
  const pi = currentPage.value
  const page = pages.value[pi]
  if (!page) return
  pages.value[pi].questions = page.questions.filter(x => x.id !== q.id)
  pages.value = [...pages.value]
}

function stripBase64Images(text) {
  return (text || '').replace(/!\[[^\]]*\]\((data:image\/[^)]+)\)/gi, '[图片]').replace(/\n{3,}/g, '\n\n').trim()
}

// ===== 提交入库 =====
async function submitBatch() {
  const selected = allQuestions.value.filter(q => q.selected)
  if (!selected.length) { ElMessage.warning('请先勾选要添加的题目'); return }
  try { await ElMessageBox.confirm(`确认将 ${selected.length} 道题添加到题库？`, '批量入库', { confirmButtonText: '确认添加', cancelButtonText: '取消', type: 'info' }) } catch (e) { return }
  submitting.value = true
  let ok = 0, fail = 0
  for (const q of selected) {
    try {
      const firstKp = kps.value.find(k => q.kpIds.includes(k.id))
      await uploadTeacherQuestion({
        subject: 'math',
        type: uploadType.value,
        questionType: q.questionType,
        shared: shared.value,
        title: stripBase64Images(q.text),
        difficulty: 'MEDIUM',
        gradeLevel: firstKp?.gradeLevel || '',
        knowledgePointIds: q.kpIds.join(','),
        originalImageUrl: '',
        diagramImageUrl: q.diagram,
        solution: stripBase64Images(q.analysis),
        teacherAnalysis: stripBase64Images(q.analysis),
        teacherAnalysisImage: q.analysisImage || '',
        diagramStatus: q.diagram ? 'MANUAL' : 'NONE',
      })
      ok++
    } catch (e) { fail++ }
  }
  submitting.value = false
  if (ok) ElMessage.success(`成功入库 ${ok} 题${fail ? '，失败 ' + fail + ' 题' : ''}`)
  else ElMessage.error('全部入库失败，请检查网络或后端服务')
}

function resetAll() {
  pages.value = []
  currentPage.value = 0
  processedCount.value = 0
  totalPages.value = 0
  selectAll.value = false
}
</script>

<style scoped>
.bu-page { max-width: 1400px; margin: 0 auto; padding: 16px 20px 40px; }
.bu-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.bu-header h2 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
.bu-header p { font-size: 13px; color: var(--text-muted); }
.bu-header-title { display: flex; align-items: center; gap: 8px; }
.bu-back { padding: 0; font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.bu-top-controls { display: flex; align-items: center; gap: 16px; }
.bu-shared { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }

.bu-upload { max-width: 700px; margin: 40px auto; }
.bu-upload-icon { font-size: 48px; color: var(--color-primary); margin: 8px 0; }
.bu-upload-text { font-size: 14px; color: var(--text-primary); }
.bu-upload-text em { color: var(--color-primary); font-style: normal; }
.bu-upload-tip { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.bu-processing { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 40px; color: var(--color-primary); font-size: 14px; }

.bu-layout { display: flex; gap: 16px; align-items: stretch; }
.bu-preview { flex: 1; min-width: 0; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); padding: 12px; }
.bu-preview-toolbar { display: flex; align-items: center; margin-bottom: 10px; }
.bu-page-info { font-size: 13px; color: var(--text-secondary); }
.bu-page-wrap { position: relative; display: inline-block; background: #f5f6f8; border-radius: 8px; overflow: auto; max-width: 100%; }
.bu-page-img { display: block; max-width: 100%; height: auto; }

/* 蓝框：题目区域（可拖拽/缩放） */
.qbox { position: absolute; border: 2px solid #3B82F6; box-sizing: border-box; cursor: move; touch-action: none; }
.qbox-label { position: absolute; top: -14px; left: -2px; background: #3B82F6; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 3px; line-height: 1.4; pointer-events: none; }
.qbox-tools { position: absolute; top: 2px; right: 2px; display: flex; gap: 2px; pointer-events: auto; }
.bq-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid #3B82F6; border-radius: 2px; touch-action: none; }
.bh-nw { left: -6px; top: -6px; cursor: nwse-resize; } .bh-n { left: 50%; top: -6px; margin-left: -5px; cursor: ns-resize; } .bh-ne { right: -6px; top: -6px; cursor: nesw-resize; }
.bh-e { right: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; } .bh-se { right: -6px; bottom: -6px; cursor: nwse-resize; } .bh-s { left: 50%; bottom: -6px; margin-left: -5px; cursor: ns-resize; }
.bh-sw { left: -6px; bottom: -6px; cursor: nesw-resize; } .bh-w { left: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; }

/* 红框：配图截取 */
.crop-red { position: absolute; border: 2px solid #EF4444; background: rgba(239,68,68,.08); box-sizing: border-box; cursor: move; touch-action: none; }
.crop-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid #EF4444; border-radius: 2px; touch-action: none; }
.ch-nw { left: -6px; top: -6px; cursor: nwse-resize; } .ch-n { left: 50%; top: -6px; margin-left: -5px; cursor: ns-resize; } .ch-ne { right: -6px; top: -6px; cursor: nesw-resize; }
.ch-e { right: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; } .ch-se { right: -6px; bottom: -6px; cursor: nwse-resize; } .ch-s { left: 50%; bottom: -6px; margin-left: -5px; cursor: ns-resize; }
.ch-sw { left: -6px; bottom: -6px; cursor: nesw-resize; } .ch-w { left: -6px; top: 50%; margin-top: -5px; cursor: ew-resize; }

/* 右：题目列表 */
.bu-list { width: 380px; flex-shrink: 0; background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); display: flex; flex-direction: column; }
.bu-list-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--color-border-light); font-size: 13px; font-weight: 700; }
.bu-list-scroll { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.bu-list-foot { padding: 12px 14px; border-top: 1px solid var(--color-border-light); }

.qcard { border: 1px solid var(--color-border); border-radius: 10px; padding: 10px; background: #fff; transition: all .15s; }
.qcard.selected { border-color: var(--color-primary); background: var(--color-primary-bg); }
.qcard-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.qcard-idx { font-size: 12px; font-weight: 700; color: var(--text-primary); }
.qcard-type { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.qcard-del { margin-left: 8px; font-size: 14px; line-height: 1; color: #999; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
.qcard-del:hover { color: #EF4444; background: #FEE2E2; }
.qcard-preview-wrap { margin: 2px 0 4px; }
.qcard-preview { font-size: 13px; line-height: 1.7; color: var(--text-primary); word-break: break-word; max-height: 180px; overflow-y: auto; }
.qcard-body { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.qcard-diagram { position: relative; }
.qcard-diagram img { max-width: 120px; max-height: 90px; border-radius: 6px; border: 1px solid #eee; cursor: pointer; }
.qcard-diagram-del { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: #EF4444; color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.kp-chip, .analysis-chip { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 14px; font-size: 12px; cursor: pointer; border: 1px solid var(--color-border); color: var(--text-secondary); background: rgba(255,255,255,.6); backdrop-filter: blur(2px); }
.kp-chip:hover, .analysis-chip:hover { border-color: var(--color-primary-light); color: var(--color-primary); }
.kp-chip.filled { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }
.analysis-chip.done { border-color: #10B981; color: #10B981; background: #ECFDF5; }
</style>
