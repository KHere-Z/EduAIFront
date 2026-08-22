<template>
  <div class="rup">
    <!-- ① 目录定位 -->
    <el-card class="rup-card" shadow="never">
      <template #header><span class="rup-title">① 目录定位</span></template>

      <!-- 学科（可选，管理员端显示） -->
      <div class="rup-level" v-if="selectableSubject">
        <span class="rup-label">学科</span>
        <el-select v-model="subject" style="width: 300px" @change="onSubjectChange">
          <el-option v-for="s in subjects" :key="s.value" :label="`${s.icon} ${s.label}`" :value="s.value" />
        </el-select>
      </div>

      <!-- 学段（小学/初中/高中） -->
      <div class="rup-level">
        <span class="rup-label">学段</span>
        <el-radio-group v-model="stage" @change="onStageChange">
          <el-radio-button value="primary">小学</el-radio-button>
          <el-radio-button value="junior">初中</el-radio-button>
          <el-radio-button value="senior">高中</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 教材（版本） -->
      <div class="rup-level">
        <span class="rup-label">教材</span>
        <el-select v-model="version" placeholder="选择教材" style="width: 300px" @change="onVersionChange" filterable>
          <el-option v-for="v in versionOptions" :key="v.value" :label="v.label" :value="v.value" />
        </el-select>
      </div>

      <!-- 年级 -->
      <div class="rup-level" v-if="version">
        <span class="rup-label">年级</span>
        <template v-if="!addingTextbook">
          <el-select v-model="textbookId" placeholder="选择年级" style="width: 300px" @change="onTextbookChange" filterable>
            <el-option v-for="g in gradeOptions" :key="g.id" :label="g.label" :value="g.id" />
          </el-select>
          <el-button v-if="allowAdd" size="small" @click="startAdd('textbook')">＋ 新增教材</el-button>
        </template>
        <template v-else>
          <el-input v-model="newTextbookName" placeholder="教材名，如：七年级上册" style="width: 300px" @keyup.enter="confirmAddTextbook" />
          <el-button size="small" type="primary" :loading="saving" @click="confirmAddTextbook">确定</el-button>
          <el-button size="small" @click="cancelAdd('textbook')">取消</el-button>
        </template>
      </div>

      <!-- 章节 -->
      <div class="rup-level" v-if="textbookId">
        <span class="rup-label">章节</span>
        <template v-if="!addingChapter">
          <el-select v-model="chapterId" placeholder="选择章节" style="width: 300px" @change="onChapterChange" filterable>
            <el-option v-for="c in chapters" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button v-if="allowAdd" size="small" @click="startAdd('chapter')">＋ 新增章节</el-button>
        </template>
        <template v-else>
          <el-input v-model="newChapterName" placeholder="章节名，如：第1章 有理数" style="width: 300px" @keyup.enter="confirmAddChapter" />
          <el-button size="small" type="primary" :loading="saving" @click="confirmAddChapter">确定</el-button>
          <el-button size="small" @click="cancelAdd('chapter')">取消</el-button>
        </template>
      </div>

      <!-- 小节 -->
      <div class="rup-level" v-if="chapterId">
        <span class="rup-label">小节</span>
        <template v-if="!addingSection">
          <el-select v-model="sectionId" placeholder="选择小节" style="width: 300px" @change="onSectionChange" filterable>
            <el-option v-for="s in sections" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button v-if="allowAdd" size="small" @click="startAdd('section')">＋ 新增小节</el-button>
        </template>
        <template v-else>
          <el-input v-model="newSectionName" placeholder="小节名，如：1.1 正数和负数" style="width: 300px" @keyup.enter="confirmAddSection" />
          <el-button size="small" type="primary" :loading="saving" @click="confirmAddSection">确定</el-button>
          <el-button size="small" @click="cancelAdd('section')">取消</el-button>
        </template>
      </div>

      <el-empty v-if="!textbookId" description="先选择学段、教材与年级，再定位章节与小节" :image-size="60" />
    </el-card>

    <!-- ② 上传 -->
    <el-card class="rup-card" shadow="never" v-if="sectionId">
      <template #header>
        <span class="rup-title">② 上传文件到「{{ sectionName }}」</span>
        <span class="rup-loc">{{ locText }}</span>
      </template>

      <div class="rup-row">
        <span class="rup-label">类型</span>
        <el-radio-group v-model="resType">
          <el-radio-button value="课件">课件</el-radio-button>
          <el-radio-button value="学案">学案</el-radio-button>
          <el-radio-button value="作业">作业</el-radio-button>
          <el-radio-button value="试卷">试卷</el-radio-button>
        </el-radio-group>
        <span class="rup-label" style="margin-left:16px">年份</span>
        <el-select v-model="resYear" style="width: 120px" filterable allow-create>
          <el-option v-for="y in years" :key="y" :label="y + ' 年'" :value="y" />
        </el-select>
      </div>

      <div class="rup-row">
        <span class="rup-label">定价</span>
        <template v-if="priceMode === 'fixed'">
          <el-tag type="warning" size="large">统一定价 {{ fixedPrice }} 资源点</el-tag>
        </template>
        <template v-else>
          <el-radio-group v-model="price">
            <el-radio-button v-for="t in priceTiers" :key="t.price" :value="t.price">{{ t.label }} {{ t.price }}</el-radio-button>
          </el-radio-group>
          <span class="rup-price-tip">资源点收入的 50% 将计入你的个人账户</span>
        </template>
      </div>

      <div class="rup-row">
        <span class="rup-label">共享</span>
        <el-switch v-model="shared" />
        <span style="font-size:12px;color:var(--text-muted)">{{ shared ? '所有用户可见' : '仅自己与学生可见' }}</span>
      </div>

      <el-upload
        class="rup-upload"
        drag
        multiple
        :auto-upload="false"
        v-model:file-list="fileList"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或<em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF / Word / PPT / Excel / 压缩包，可多选批量上传</div>
        </template>
      </el-upload>

      <el-button class="rup-submit" type="primary" :loading="uploading" :disabled="!fileList.length" @click="doUpload">
        上传 {{ fileList.length }} 个文件
      </el-button>
    </el-card>

    <!-- ③ 已上传资源 -->
    <el-card class="rup-card" shadow="never" v-if="sectionId">
      <template #header><span class="rup-title">③ 本小节已上传资源（{{ resList.length }}）</span></template>
      <el-table :data="resList" size="small" v-if="resList.length">
        <el-table-column prop="fileName" label="文件名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }"><el-tag size="small" :type="tagType(row.type)">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="year" label="年份" width="80">
          <template #default="{ row }">{{ row.year || '-' }}</template>
        </el-table-column>
        <el-table-column label="共享" width="80" align="center">
          <template #default="{ row }"><el-tag size="small" :type="isShared(row) ? 'success' : 'info'">{{ isShared(row) ? '共享' : '私有' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="资源点" width="90" align="center">
          <template #default="{ row }"><span style="color:#6366F1;font-weight:600">{{ row.price ?? 0 }}</span></template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ fmtSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="onRemoveResource(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无资源" :image-size="60" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listTextbooks, createTextbook, listChapters, createChapter, listSections, createSection, listResources, addResources, removeResource } from '@/utils/resourceService'

const props = defineProps({
  subject: { type: String, default: 'math' },
  selectableSubject: { type: Boolean, default: false },
  priceMode: { type: String, default: 'tier' }, // 'fixed' | 'tier'
  fixedPrice: { type: Number, default: 200 },
  allowAdd: { type: Boolean, default: false }, // 是否允许新增教材/章节/小节
})

const subjects = [
  { value: 'chinese',  label: '语文', icon: '📝' },
  { value: 'math',     label: '数学', icon: '📐' },
  { value: 'english',  label: '英语', icon: '📖' },
  { value: 'physics',  label: '物理', icon: '⚛️' },
  { value: 'chemistry',label: '化学', icon: '🧪' },
  { value: 'biology',  label: '生物', icon: '🧬' },
  { value: 'history',  label: '历史', icon: '📜' },
  { value: 'politics', label: '政治', icon: '⚖️' },
  { value: 'geography',label: '地理', icon: '🌍' },
]
const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']
const priceTiers = [
  { label: '普通', price: 100 },
  { label: '较好', price: 300 },
  { label: '精品', price: 500 },
]
const versionMap = { suke: '苏科版', renjiao: '人教版', bsd: '北师大版', zj: '浙教版', hk: '沪科版' }

const subject = ref(props.subject)
const stage = ref('junior') // 学段：primary/junior/senior

const textbooks = ref([])
const version = ref('') // 教材版本 key
const chapters = ref([])
const sections = ref([])
const textbookId = ref('') // 年级选择后对应的教材 id
const chapterId = ref('')
const sectionId = ref('')

const addingTextbook = ref(false)
const addingChapter = ref(false)
const addingSection = ref(false)
const newTextbookName = ref('')
const newChapterName = ref('')
const newSectionName = ref('')
const saving = ref(false)

const resType = ref('课件')
const resYear = ref('2026')
const shared = ref(true)
const price = ref(props.priceMode === 'fixed' ? props.fixedPrice : 100)
const fileList = ref([])
const uploading = ref(false)
const resList = ref([])

const versionOptions = computed(() => {
  const keys = [...new Set(textbooks.value.map(t => t.version).filter(Boolean))]
  return keys.map(k => ({ value: k, label: versionMap[k] || k }))
})
const gradeOptions = computed(() => {
  if (!version.value) return []
  return textbooks.value.filter(t => t.version === version.value).map(t => ({ id: t.id, label: t.grade || t.name }))
})

const subjectLabel = computed(() => subjects.find(s => s.value === subject.value)?.label || subject.value)
const textbookName = computed(() => textbooks.value.find(t => t.id === textbookId.value)?.name || '')
const chapterName = computed(() => chapters.value.find(c => c.id === chapterId.value)?.name || '')
const sectionName = computed(() => sections.value.find(s => s.id === sectionId.value)?.name || '')
const locText = computed(() => `${subjectLabel.value} / ${textbookName.value} / ${chapterName.value} / ${sectionName.value}`)

function fmtSize(n) {
  if (!n && n !== 0) return '-'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}
function tagType(t) {
  return { 课件: 'primary', 学案: 'success', 作业: 'warning', 试卷: 'danger' }[t] || 'info'
}
function isShared(row) {
  const v = row.shared
  return v === true || v === 'true' || v === 1 || v === '1'
}

async function loadTextbooks() {
  const all = (await listTextbooks(subject.value)) || []
  textbooks.value = all.filter(t => t.stage === stage.value)
}
async function loadChapters() { chapters.value = textbookId.value ? await listChapters(textbookId.value) : [] }
async function loadSections() { sections.value = chapterId.value ? await listSections(chapterId.value) : [] }
async function loadResList() { resList.value = sectionId.value ? await listResources(sectionId.value) : [] }

function resetAll() {
  version.value = ''
  textbookId.value = ''
  chapterId.value = ''
  sectionId.value = ''
  chapters.value = []
  sections.value = []
  resList.value = []
  fileList.value = []
  cancelAdd('textbook'); cancelAdd('chapter'); cancelAdd('section')
}
function onSubjectChange() { resetAll(); loadTextbooks() }
function onStageChange() { resetAll(); loadTextbooks() }
function onVersionChange() {
  textbookId.value = ''
  chapterId.value = ''
  sectionId.value = ''
  chapters.value = []
  sections.value = []
  resList.value = []
  fileList.value = []
  cancelAdd('textbook')
}
function onTextbookChange() {
  chapterId.value = ''
  sectionId.value = ''
  sections.value = []
  resList.value = []
  loadChapters()
}
function onChapterChange() { sectionId.value = ''; resList.value = []; loadSections() }
function onSectionChange() { loadResList() }

function startAdd(level) {
  if (level === 'textbook') { addingTextbook.value = true; newTextbookName.value = '' }
  if (level === 'chapter') { addingChapter.value = true; newChapterName.value = '' }
  if (level === 'section') { addingSection.value = true; newSectionName.value = '' }
}
function cancelAdd(level) {
  if (level === 'textbook') addingTextbook.value = false
  if (level === 'chapter') addingChapter.value = false
  if (level === 'section') addingSection.value = false
}

async function confirmAddTextbook() {
  const name = newTextbookName.value.trim()
  if (!name) return ElMessage.warning('请输入教材名')
  if (!version.value) return ElMessage.warning('请先选择教材版本')
  saving.value = true
  try {
    const t = await createTextbook({ subject: subject.value, stage: stage.value, version: version.value, name })
    await loadTextbooks()
    textbookId.value = t.id
    chapterId.value = ''; sectionId.value = ''; resList.value = []
    addingTextbook.value = false
    ElMessage.success('教材已新增')
  } catch (e) { ElMessage.error(e.message || '新增失败') } finally { saving.value = false }
}
async function confirmAddChapter() {
  const name = newChapterName.value.trim()
  if (!name) return ElMessage.warning('请输入章节名')
  if (!textbookId.value) return ElMessage.warning('请先选择教材')
  saving.value = true
  try {
    const c = await createChapter(textbookId.value, { name })
    await loadChapters()
    chapterId.value = c.id
    sectionId.value = ''; resList.value = []
    addingChapter.value = false
    ElMessage.success('章节已新增')
  } catch (e) { ElMessage.error(e.message || '新增失败') } finally { saving.value = false }
}
async function confirmAddSection() {
  const name = newSectionName.value.trim()
  if (!name) return ElMessage.warning('请输入小节名')
  if (!chapterId.value) return ElMessage.warning('请先选择章节')
  saving.value = true
  try {
    const s = await createSection(chapterId.value, { name })
    await loadSections()
    sectionId.value = s.id
    resList.value = []
    addingSection.value = false
    ElMessage.success('小节已新增')
  } catch (e) { ElMessage.error(e.message || '新增失败') } finally { saving.value = false }
}

async function doUpload() {
  const files = fileList.value.map(f => f.raw).filter(Boolean)
  if (!files.length) return
  uploading.value = true
  try {
    await addResources(sectionId.value, subject.value, resType.value, resYear.value, price.value, shared.value, files)
    ElMessage.success(`已上传 ${files.length} 个文件`)
    fileList.value = []
    await loadResList()
  } catch (e) { ElMessage.error(e.message || '上传失败') } finally { uploading.value = false }
}

async function onRemoveResource(row) {
  await ElMessageBox.confirm(`确定删除「${row.fileName}」？`, '提示', { type: 'warning' })
  try {
    await removeResource(row.id)
    ElMessage.success('已删除')
    loadResList()
  } catch (e) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
}

onMounted(loadTextbooks)
</script>

<style scoped>
.rup-card { margin-bottom: 16px; border: 1px solid var(--color-border); border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.03) }
.rup-title { font-size: 14px; font-weight: 700; color: var(--text-primary) }
.rup-loc { float: right; font-size: 12px; color: var(--text-muted) }

.rup-level { display: flex; align-items: center; gap: 10px; padding: 10px 0 }
.rup-level + .rup-level { border-top: 1px dashed var(--color-border-light) }
.rup-label { width: 48px; font-size: 13px; color: var(--text-secondary); flex-shrink: 0 }

.rup-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px }
.rup-price-tip { font-size: 12px; color: var(--text-muted); }
.rup-upload :deep(.el-upload-dragger) { padding: 28px 0 }
.rup-submit { margin-top: 14px }
</style>
