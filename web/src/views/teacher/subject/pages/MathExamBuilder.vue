<template>
  <div class="eb-page">
    <div class="eb-topbar">
      <el-button text @click="$router.back()">← 返回</el-button>
      <h2>📝 出卷</h2>
      <div style="display:flex;gap:8px;align-items:center">
        <el-select v-model="currentPreset" placeholder="试卷结构" size="small" style="width:160px" @change="applyPreset">
          <el-option v-for="p in presets" :key="p.name" :label="p.name" :value="p.name"/>
        </el-select>
        <el-button size="small" @click="openStruct">⚙️ 定制</el-button>
        <el-button size="small" type="primary" @click="printExam">📥 导出PDF</el-button>
      </div>
    </div>

    <div class="eb-layout">
      <!-- 左侧题库 -->
      <div class="eb-left">
        <div class="ebl-filter">
          <el-input v-model="qSearch" placeholder="搜索" size="small" clearable/>
          <el-select v-model="qGradeFilter" placeholder="年级" size="small" clearable>
            <el-option v-for="g in grades" :key="g" :label="g" :value="g"/>
          </el-select>
          <el-select v-model="qKpFilter" placeholder="知识点" size="small" clearable>
            <el-option v-for="k in kps" :key="k.id" :label="k.name" :value="k.id"/>
          </el-select>
          <el-select v-model="qTypeFilter" placeholder="来源" size="small" clearable>
            <el-option label="新题" value="NEW"/><el-option label="错题" value="WRONG"/>
          </el-select>
          <el-select v-model="qQuestionType" placeholder="题型" size="small" clearable>
            <el-option label="选择题" value="选择题"/><el-option label="填空题" value="填空题"/><el-option label="计算题" value="计算题"/><el-option label="解答题" value="解答题"/>
          </el-select>
        </div>
        <div class="ebl-list">
          <div v-for="q in filteredQuestions" :key="q.id" class="ebl-item" :class="{used: usedQids.has(q.id)}" @click="addToPaper(q)">
            <div class="ebli-title" v-html="q._titleHtml||q.title"/>
            <div class="ebli-meta">
              <el-tag size="small" :type="q.type==='NEW'?'success':'danger'">{{ q.type==='NEW'?'新题':'错题' }}</el-tag>
              <span>{{ q.gradeLevel }}</span>
            </div>
          </div>
          <el-empty v-if="!filteredQuestions.length" description="无题目" :image-size="60"/>
        </div>
      </div>

      <!-- 右侧试卷 -->
      <div class="eb-right">
        <!-- 页码切换（多页时显示） -->
        <div class="eb-pager" v-if="pages.length > 1">
          <el-button size="small" :disabled="focusPi === 0" @click="prevPage">‹ 上一页</el-button>
          <span class="eb-page-ind">第 {{ focusPi + 1 }} / {{ pages.length }} 页</span>
          <el-button size="small" :disabled="focusPi === pages.length - 1" @click="nextPage">下一页 ›</el-button>
          <el-button size="small" text type="danger" @click="delPage(focusPi)">🗑 删除本页</el-button>
        </div>
        <div class="eb-page-sheet" ref="pageSheet">
          <template v-if="focusPi === 0">
            <div class="eps-header" contenteditable @input="e => pages[0].title = e.target.innerText">{{ pages[0].title || '数学试卷' }}</div>
            <div class="eps-meta">
              <span>姓名：________</span><span>班级：________</span><span>得分：________</span>
            </div>
            <div v-for="(section, si) in pages[0].sections" :key="si" class="eps-section" :class="{focused: focusSi===si}" @click.stop="focusSi=si">
              <div class="epss-head" contenteditable @input="e => pages[0].sections[si].title = e.target.innerText">
                {{ section.title }}
                <span class="epss-count" v-if="section.max">({{ section.questions.length }}/{{ section.max }})</span>
                <span class="epss-full" v-if="section.max && section.questions.length >= section.max">已满</span>
              </div>
              <div class="epss-questions">
                <div v-for="(q, qi) in section.questions" :key="qi" class="epss-q">
                  <span class="epss-q-num">{{ qi + 1 }}.</span>
                  <div class="epss-q-main">
                    <span class="epss-q-text" contenteditable @input="e => pages[0].sections[si].questions[qi].title = e.target.innerText" v-html="q._titleHtml||q.title"/>
                    <img v-if="q.diagramImageUrl" :src="imgUrl(q.diagramImageUrl)" class="epss-q-img"/>
                  </div>
                  <el-button size="small" text type="danger" class="epss-q-del" @click="removeQuestion(0, si, qi)">✕</el-button>
                </div>
                <div class="epss-empty" v-if="!section.questions.length">点击左侧题目添加到此处</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="(item, idx) in flatQuestions" :key="idx" class="epss-q">
              <span class="epss-q-num">{{ idx + 1 }}.</span>
              <div class="epss-q-main">
                <span class="epss-q-text" contenteditable @input="e => pages[focusPi].sections[item.si].questions[item.qi].title = e.target.innerText" v-html="item.q._titleHtml||item.q.title"/>
                <img v-if="item.q.diagramImageUrl" :src="imgUrl(item.q.diagramImageUrl)" class="epss-q-img"/>
              </div>
              <el-button size="small" text type="danger" class="epss-q-del" @click="removeQuestion(focusPi, item.si, item.qi)">✕</el-button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 定制结构弹窗 -->
    <el-dialog v-model="showStructDialog" title="⚙️ 定制试卷结构" width="480px" destroy-on-close>
      <el-form label-width="80px" size="small">
        <el-form-item label="名称"><el-input v-model="structForm.name" placeholder="如：标准两面"/></el-form-item>
        <div v-for="(sec, i) in structForm.sections" :key="i" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <el-input v-model="sec.title" placeholder="板块名" style="width:140px"/>
          <span style="font-size:12px;color:#999">题数</span>
          <el-input-number v-model="sec.max" :min="1" :max="50" size="small" style="width:80px"/>
          <el-button size="small" text type="danger" @click="removeStructSection(i)" :disabled="structForm.sections.length<=1">✕</el-button>
        </div>
        <el-button size="small" text type="primary" @click="addStructSection">+ 添加板块</el-button>
      </el-form>
      <template #footer>
        <el-button @click="showStructDialog=false">取消</el-button>
        <el-button type="primary" @click="saveStructPreset">💾 保存并应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getKnowledgePoints } from '@/api/common/knowledge'
import { getTeacherQuestions } from '@/api/common/questions'
import { renderMarkdown } from '@/utils/markdown'
import { resolveStaticUrl } from '@/utils/url'

const router = useRouter()

const grades = ['初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期']
const kps = ref([])
const questions = ref([])
const usedQids = ref(new Set())
const focusPi = ref(0); const focusSi = ref(0)
const pageSheet = ref(null)

const qSearch = ref(''); const qGradeFilter = ref(''); const qKpFilter = ref(null); const qTypeFilter = ref(''); const qQuestionType = ref('')

const filteredQuestions = computed(() => questions.value.filter(q => {
  if (qSearch.value && !(q.title||'').includes(qSearch.value)) return false
  if (qGradeFilter.value && q.gradeLevel !== qGradeFilter.value) return false
  if (qKpFilter.value && !(q.knowledgePointIds||'').split(',').includes(String(qKpFilter.value))) return false
  if (qTypeFilter.value && q.type !== qTypeFilter.value) return false
  if (qQuestionType.value && q.questionType !== qQuestionType.value) return false
  return true
}))

// 试卷结构
const pages = ref([{ title: '数学试卷', sections: [
  { title: '一、选择题', max: 8, questions: [] },
  { title: '二、填空题', max: 8, questions: [] },
  { title: '三、解答题', max: 13, questions: [] },
] }])

// 后续页：跨 section 展平成连续编号的题目列表（无分区标题）
const flatQuestions = computed(() => {
  const out = []
  if (focusPi.value === 0) return out
  const page = pages.value[focusPi.value]
  if (!page) return out
  page.sections.forEach((s, si) => s.questions.forEach((q, qi) => out.push({ q, si, qi })))
  return out
})

function addToPaper(q) {
  if (usedQids.value.has(q.id)) return
  const pi = Math.min(focusPi.value, pages.value.length - 1)
  const si = Math.min(focusSi.value, pages.value[pi].sections.length - 1)
  const sec = pages.value[pi].sections[si]
  if (sec.max && sec.questions.length >= sec.max) { ElMessage.warning(`「${sec.title}」已满`); return }
  usedQids.value.add(q.id)
  sec.questions.push({ ...q })
  pages.value = [...pages.value]
  usedQids.value = new Set(usedQids.value)
  nextTick(() => checkOverflow())
}

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return resolveStaticUrl(url)
  return url
}

function removeQuestion(pi, si, qi) {
  const q = pages.value[pi].sections[si].questions[qi]
  if (q.id) usedQids.value.delete(q.id)
  pages.value[pi].sections[si].questions.splice(qi, 1)
  pages.value = [...pages.value]
  usedQids.value = new Set(usedQids.value)
}

function addBlankPage() {
  const src = pages.value[0]
  pages.value.push({ title: '', sections: src.sections.map(s => ({ title: s.title, max: s.max, questions: [] })) })
  pages.value = [...pages.value]
}

function delPage(pi) {
  if (pages.value.length <= 1) return
  pages.value[pi].sections.forEach(s => s.questions.forEach(q => { if (q.id) usedQids.value.delete(q.id) }))
  pages.value.splice(pi, 1)
  pages.value = [...pages.value]
  usedQids.value = new Set(usedQids.value)
  if (focusPi.value >= pages.value.length) focusPi.value = pages.value.length - 1
}

// 预设
const PRESET_KEY = 'exam_builder_presets'
const defaultPresets = [
  { name:'标准两面(8-8-13)', sections:[{title:'一、选择题',max:8},{title:'二、填空题',max:8},{title:'三、解答题',max:13}] },
  { name:'测试卷(10-5-10)', sections:[{title:'一、选择题',max:10},{title:'二、填空题',max:5},{title:'三、解答题',max:10}] },
  { name:'练习卷(6-6-8)', sections:[{title:'一、选择题',max:6},{title:'二、填空题',max:6},{title:'三、解答题',max:8}] },
]
const presets = ref([])
const currentPreset = ref('')
const showStructDialog = ref(false)
const structForm = ref({ name:'', sections:[{title:'一、选择题',max:8},{title:'二、填空题',max:8},{title:'三、解答题',max:13}] })

function loadPresets() {
  try { presets.value = JSON.parse(localStorage.getItem(PRESET_KEY)||'[]') } catch {}
  if (!presets.value.length) presets.value = [...defaultPresets]
}
function savePresets() { localStorage.setItem(PRESET_KEY, JSON.stringify(presets.value)) }

function applyPreset(name) {
  const p = presets.value.find(p => p.name === name)
  if (!p) return
  pages.value = [{ title:'数学试卷', sections: p.sections.map(s => ({ title:s.title, max:s.max, questions:[] })) }]
  focusPi.value = 0; focusSi.value = 0
  pages.value = [...pages.value]
}

function openStruct() {
  structForm.value = JSON.parse(JSON.stringify({ name:'', sections:[{title:'一、选择题',max:8},{title:'二、填空题',max:8},{title:'三、解答题',max:13}] }))
  showStructDialog.value = true
}

function addStructSection() { structForm.value.sections.push({ title:'', max:5 }) }
function removeStructSection(i) { if (structForm.value.sections.length > 1) structForm.value.sections.splice(i, 1) }

function saveStructPreset() {
  if (!structForm.value.name.trim()) { ElMessage.warning('请输入名称'); return }
  const idx = presets.value.findIndex(p => p.name === structForm.value.name.trim())
  const entry = { name: structForm.value.name.trim(), sections: structForm.value.sections.filter(s => s.title.trim()) }
  if (idx >= 0) presets.value[idx] = entry; else presets.value.push(entry)
  savePresets()
  currentPreset.value = entry.name
  applyPreset(entry.name)
  showStructDialog.value = false
}

async function checkOverflow() {
  await nextTick()
  const el = pageSheet.value
  if (!el || el.scrollHeight <= el.clientHeight + 40) return
  const pi = focusPi.value
  const page = pages.value[pi]
  let lastQ = null, lastSi = -1
  for (let si = page.sections.length - 1; si >= 0; si--) {
    if (page.sections[si].questions.length) { lastQ = page.sections[si].questions.pop(); lastSi = si; break }
  }
  if (!lastQ) return
  const src = pages.value[0]
  if (!pages.value[pi + 1]) pages.value.push({ title: '', sections: src.sections.map(s => ({ title: s.title, max: s.max, questions: [] })) })
  pages.value[pi + 1].sections[lastSi].questions.unshift(lastQ)
  pages.value = [...pages.value]
  await nextTick()
  checkOverflow()
}

function prevPage() { if (focusPi.value > 0) focusPi.value-- }
function nextPage() { if (focusPi.value < pages.value.length - 1) focusPi.value++ }

async function printExam() {
  try {
    const { useAuthStore } = await import('@/store/auth')
    const token = useAuthStore().token
    const memRes = await fetch('/api/v1/user/membership', { headers: { 'Authorization': token ? `Bearer ${token}` : '' } })
    const mem = await memRes.json().catch(() => ({}))
    if (!mem?.active) {
      await ElMessageBox.confirm('出卷导出 PDF 为会员专享功能，开通会员后即可使用。是否前往开通？', '会员专享', { confirmButtonText:'去开通', cancelButtonText:'取消', type:'warning' })
        .then(() => router.push('/teacher/recharge'))
      return
    }
    const payload = {
      title: pages.value[0].title || '数学试卷',
      pages: pages.value.map(p => ({
        sections: p.sections.map(s => ({
          title: s.title,
          questions: s.questions.map(q => ({ title: q.title || '', imageUrl: q.diagramImageUrl || '' }))
        }))
      }))
    }
    const res = await fetch('/api/v1/teacher/exam-builder/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('导出失败')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = '数学试卷.pdf'; a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('PDF 导出失败')
  }
}

onMounted(async () => {
  loadPresets()
  if (presets.value.length) { currentPreset.value = presets.value[0].name; applyPreset(presets.value[0].name) }
  try { const r = await getKnowledgePoints({ subject:'math', pageSize:200 }); kps.value = r.list||[] } catch {}
  try { const r = await getTeacherQuestions({ subject:'math', pageSize:200 }); questions.value = (r.list||[]).map(q => ({...q})); for (const q of questions.value) { if (q.title) q._titleHtml = await renderMarkdown(q.title) } } catch {}
})
</script>

<style scoped>
.eb-page{height:100vh;display:flex;flex-direction:column;background:var(--color-bg)}
.eb-topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#fff;border-bottom:1px solid var(--color-border);flex-shrink:0}
.eb-topbar h2{font-size:18px;font-weight:700}
.eb-layout{flex:1;display:flex;overflow:hidden}
.eb-left{width:300px;flex-shrink:0;border-right:1px solid var(--color-border);display:flex;flex-direction:column;background:#fff}
.ebl-filter{padding:10px;display:flex;flex-direction:column;gap:6px;border-bottom:1px solid var(--color-border-light)}
.ebl-list{flex:1;overflow-y:auto;padding:8px}
.ebl-item{padding:10px 12px;border-radius:8px;cursor:pointer;transition:.15s;margin-bottom:4px;border:1px solid transparent}
.ebl-item:hover{background:var(--color-primary-bg);border-color:var(--color-primary-light)}
.ebl-item.used{opacity:.35;pointer-events:none;background:#f5f5f5}
.ebli-title{font-size:13px;line-height:1.6;color:#333;word-break:break-word}
.ebli-title :deep(.katex){font-size:.85em}
.ebli-meta{display:flex;gap:6px;align-items:center;margin-top:4px;font-size:11px;color:#999}
.eb-right{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;align-items:center;gap:20px;background:#e0e0e0}
.eb-pager{display:flex;align-items:center;gap:12px;flex-shrink:0}
.eb-page-ind{font-size:13px;color:#555;min-width:80px;text-align:center}
.eb-page-sheet{width:794px;height:1122px;flex-shrink:0;background:#fff;padding:60px 80px;box-shadow:0 2px 16px rgba(0,0,0,.1);font-family:SimSun,serif;color:#333;overflow:hidden}
.eps-header{text-align:center;font-size:22px;font-weight:700;margin-bottom:8px;outline:none;padding:4px}
.eps-header:focus{background:rgba(99,102,241,.06)}
.eps-meta{display:flex;gap:16px;justify-content:center;font-size:14px;color:#555;align-items:center;margin-bottom:24px}
.page-del{flex-shrink:0;margin-left:auto}
.eps-section{margin-bottom:20px;border-radius:6px;padding:8px;transition:background .15s;cursor:pointer}
.eps-section.focused{background:rgba(99,102,241,.05);box-shadow:0 0 0 2px rgba(99,102,241,.15)}
.epss-head{font-size:15px;font-weight:700;margin-bottom:8px;outline:none;padding:4px}
.epss-head:focus{background:rgba(99,102,241,.06)}
.epss-count{font-size:11px;color:var(--text-muted);font-weight:400}
.epss-full{font-size:11px;color:#EF4444;font-weight:600;margin-left:6px}
.eps-section.full{opacity:.55}
.epss-questions{min-height:40px}
.epss-q{display:flex;align-items:flex-start;gap:4px;margin-bottom:8px;font-size:14px;line-height:1.8;padding:4px;border-radius:4px;position:relative}
.epss-q:hover{background:rgba(99,102,241,.04)}
.epss-q-num{font-weight:600;flex-shrink:0}
.epss-q-main{flex:1;min-width:0}
.epss-q-text{outline:none;min-height:1em}
.epss-q-text:focus{background:rgba(99,102,241,.06);border-radius:4px}
.epss-q-img{max-width:200px;max-height:160px;display:block;margin-top:6px;border-radius:6px;border:1px solid var(--color-border)}
.epss-q-del{visibility:hidden;flex-shrink:0}
.epss-q:hover .epss-q-del{visibility:visible}
.epss-empty{font-size:13px;color:#ccc;text-align:center;padding:12px;border:1px dashed #e0e0e0;border-radius:6px}
</style>
