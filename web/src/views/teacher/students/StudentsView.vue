<template>
  <div class="page-container">
    <div class="page-header">
      <div><h2>👥 学生信息管理</h2><p>管理学员档案 · 课时追踪 · 排课日历</p></div>
      <el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon>添加学生</el-button>
    </div>

    <!-- 统计 -->
    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-num blue">{{ students.length }}</div><div class="stat-label">学员总数</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-num green">{{ totalHours }}</div><div class="stat-label">剩余总课时</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-num orange">{{ todaySessions.length }}</div><div class="stat-label">今日课时</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-num red">{{ newThisMonth }}</div><div class="stat-label">本月新增</div></el-card></el-col>
    </el-row>

    <div class="mb-lg filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索姓名/学校..." :prefix-icon="Search" style="width:220px" clearable />
      <el-select v-model="filterSubject" placeholder="科目筛选" clearable style="width:130px"><el-option v-for="s in subjectList" :key="s" :label="s" :value="s" /></el-select>
      <el-select v-model="filterGrade" placeholder="年级筛选" clearable style="width:130px"><el-option v-for="g in grades" :key="g" :label="g" :value="g" /></el-select>
    </div>

    <el-card class="mb-lg">
      <el-table :data="filteredStudents" stripe size="small" v-loading="loading">
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="name" label="姓名" width="85" />
        <el-table-column prop="gender" label="性别" width="55" align="center" />
        <el-table-column prop="contact" label="联系方式" width="125" />
        <el-table-column label="剩余课时" width="100" align="center">
          <template #default="{row}">
            <span class="hours-val" :class="{zero:row.hoursLeft===0}">{{ row.hoursLeft }}</span>
          </template>
        </el-table-column>
        <el-table-column label="报名科目" min-width="180">
          <template #default="{row}">
            <el-tag v-for="e in (row.enrollments||[])" :key="e.subject" :type="subjectTags[e.subject]" size="small" class="subject-tag">{{ e.subject }} <span class="tag-note">{{ (e.sessions||[]).length }}次课</span></el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="75" align="center" />
        <el-table-column prop="school" label="学校" min-width="130" show-overflow-tooltip />
        <el-table-column prop="regDate" label="报名时间" width="110" align="center" />
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{row,$index}">
            <el-button size="small" text type="primary" @click="editStudent(row,$index)">编辑</el-button>
            <el-button size="small" text type="danger" @click="deleteStudent(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 排课日历 -->
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-head">
              <span class="card-title">📅 排课日历</span>
              <div class="month-nav">
                <el-button size="small" text @click="prevMonth"><el-icon><ArrowLeft /></el-icon></el-button>
                <strong>{{ calendarYear }}年 {{ calendarMonth + 1 }}月</strong>
                <el-button size="small" text @click="nextMonth"><el-icon><ArrowRight /></el-icon></el-button>
              </div>
            </div>
          </template>
          <div class="calendar-grid">
            <div class="cal-header" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</div>
            <div v-for="(cell,i) in calendarCells" :key="i" class="cal-cell" :class="cell.cls" @click="cell.hasClass && selectDate(cell.date)">
              <span class="cal-day">{{ cell.day }}</span>
              <span v-if="cell.hasClass" class="cal-dot" />
            </div>
          </div>
          <div class="cal-legend"><span class="dot future"></span>待上课 <span class="dot past"></span>已结课/已完成</div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span class="card-title">{{ selectedDate ? selectedDate + ' 课程安排' : '📋 选择日期查看' }}</span></template>
          <div v-if="selectedSessions.length">
            <div v-for="s in selectedSessions" :key="s.id" class="schedule-item" :class="{completed: isSessionCompleted(s.id)}">
              <div class="sched-row">
                <div class="sched-left">
                  <div class="sched-time">🕐 {{ s.session.start }}:00 - {{ s.session.end }}:00</div>
                  <div class="sched-info">
                    <el-tag :type="subjectTags[s.enr.subject]" size="small">{{ s.enr.subject }}</el-tag>
                    <strong>{{ s.student.name }}</strong>
                    <span class="sched-grade">{{ s.student.grade }} · {{ s.student.school }}</span>
                  </div>
                </div>
                <div class="sched-actions">
                  <el-button size="small" circle :type="isSessionCompleted(s.id) ? 'primary' : ''" :icon="Check" @click="toggleSessionComplete(s.id)" />
                  <el-button size="small" circle icon="Edit" @click="openReschedule(s)" />
                </div>
              </div>
              <div v-if="isSessionCompleted(s.id)" class="completed-badge">✅ 已完成</div>
            </div>
          </div>
          <el-empty v-else description="该日期无课程安排" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="editingId ? '编辑学生' : '添加学生'" width="760px" destroy-on-close>
      <el-form :model="form" label-width="80px" label-position="right">
        <!-- 选择学生（从数据库调取） -->
        <el-form-item label="选择学生">
          <el-select v-model="selectedStudentId" filterable remote :remote-method="searchAllStudents" placeholder="输入姓名搜索..." style="width:100%" @change="onStudentSelect" clearable>
            <el-option v-for="s in allStudentList" :key="s.id" :label="`${s.name} · ${s.grade} · ${s.school||''}`" :value="s.id" />
          </el-select>
        </el-form-item>

        <!-- 学生信息（选择后自动回填，只读） -->
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="姓名"><el-input :model-value="form.name" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="性别"><el-input :model-value="form.gender" disabled /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="联系方式"><el-input :model-value="form.contact" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="剩余课时"><el-input-number v-model="form.hoursLeft" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="年级"><el-input :model-value="form.grade" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="学校"><el-input :model-value="form.school" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item label="报名时间"><el-date-picker v-model="form.regDate" type="date" style="width:100%" value-format="YYYY-MM-DD" /></el-form-item>

        <el-divider content-position="left">报名科目 & 排课</el-divider>
        <div v-for="(enr, ei) in form.enrollments" :key="ei" class="enroll-block">
          <div class="enroll-head">
            <el-select v-model="enr.subject" placeholder="科目" style="width:110px"><el-option v-for="s in subjectList" :key="s" :label="s" :value="s" /></el-select>
            <el-button size="small" type="danger" text @click="removeEnrollment(ei)" v-if="form.enrollments.length > 1">删除科目</el-button>
          </div>
          <div class="mini-cal">
            <div class="cal-nav"><el-button size="small" text @click="fmPrev"><el-icon><ArrowLeft /></el-icon></el-button><span>{{ fmy }}年 {{ fmm+1 }}月</span><el-button size="small" text @click="fmNext"><el-icon><ArrowRight /></el-icon></el-button></div>
            <div class="cal-grid">
              <div class="ch" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</div>
              <div v-for="(c,ci) in enrollmentCalendar(ei)" :key="ci" class="cc" :class="c.cls" @click="c.cur && togglePendingDate(ei, c.date)">{{ c.day }}</div>
            </div>
          </div>
          <div class="pending-area">
            <div class="pending-dates">
              <template v-if="enr._pending?.length">
                <el-tag v-for="d in enr._pending" :key="d" size="small" effect="plain" closable @close="togglePendingDate(ei, d)" style="margin:2px">{{ d }}</el-tag>
              </template>
              <span v-else class="hint">👆 点击日历日期选中</span>
            </div>
            <div class="pending-action" v-if="enr._pending?.length">
              <el-time-select v-model="enr._timeStart" start="08:00" step="01:00" end="21:00" placeholder="开始" style="width:80px" />
              <span>—</span>
              <el-time-select v-model="enr._timeEnd" start="08:00" step="01:00" end="21:00" placeholder="结束" style="width:80px" />
              <el-button size="small" type="primary" @click="confirmPendingBatch(ei)">确认</el-button>
            </div>
          </div>
          <div v-for="(batch, bi) in (enr.batches||[])" :key="bi" class="batch-row">
            <span class="batch-dot" :style="{background:batchColors[bi%6]}"></span>
            <span class="batch-time">{{ batch.start }}:00-{{ batch.end }}:00</span>
            <el-tag v-for="d in batch.dates" :key="d" size="small" :color="batchColorsLight[bi%6]" effect="plain" closable @close="removeBatchDate(ei,bi,d)" style="margin:1px;color:#333">{{ d }}</el-tag>
            <el-button size="small" type="danger" text @click="removeBatch(ei,bi)">×</el-button>
          </div>
        </div>
        <el-button size="small" type="primary" dashed @click="addEnrollment" style="margin-top:6px"><el-icon><Plus /></el-icon>添加科目</el-button>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 调课弹窗 -->
    <el-dialog v-model="showReschedule" title="调课" width="400px">
      <el-form label-width="80px">
        <el-form-item label="上课日期"><el-date-picker v-model="rescheduleForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="上课时间"><div style="display:flex;gap:6px;align-items:center"><el-time-select v-model="rescheduleForm.start" start="08:00" step="01:00" end="21:00" style="width:100%" /> <span>—</span> <el-time-select v-model="rescheduleForm.end" start="08:00" step="01:00" end="21:00" style="width:100%" /></div></el-form-item>
      </el-form>
      <template #footer><el-button @click="showReschedule=false">取消</el-button><el-button type="primary" @click="confirmReschedule">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Plus, ArrowLeft, ArrowRight, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStudents, createStudent, updateStudent, deleteStudent as delStudent, adjustHours as apiAdjustHours } from '@/api/common/students'

const subjectTags = { '英语':'success', '语文':'warning', '数学':'danger', '物理':'info', '化学':'', '生物':'success', '历史':'warning', '政治':'danger', '地理':'info' }
const subjectList = ['英语','语文','数学','物理','化学','生物','历史','政治','地理']
const grades = ['一年级','二年级','三年级','四年级','五年级','六年级','初一','初二','初三','高一','高二','高三']
const batchColors = ['#EF4444','#3B82F6','#F59E0B','#10B981','#8B5CF6','#EC4899']
const batchColorsLight = ['#FEE2E2','#DBEAFE','#FEF3C7','#D1FAE5','#EDE9FE','#FCE7F3']
const fmy = ref(2026); const fmm = ref(6)
function fmPrev() { if (fmm.value === 0) { fmy.value--; fmm.value = 11 } else fmm.value-- }
function fmNext() { if (fmm.value === 11) { fmy.value++; fmm.value = 0 } else fmm.value++ }

const newEnrollment = () => ({ subject:'英语', batches:[], _pending:[], _timeStart:'14', _timeEnd:'16' })
const form = reactive({ name:'', gender:'男', contact:'', hoursLeft:20, grade:'初一', school:'', regDate:'', enrollments:[newEnrollment()] })

// 学生选择器（从数据库调取所有学生）
const selectedStudentId = ref(null)
const allStudentList = ref([])
async function searchAllStudents(query) {
  if (!query || query.length < 1) { allStudentList.value = []; return }
  try {
    const res = await getStudents({ page: 1, pageSize: 50, keyword: query })
    allStudentList.value = (res.list || []).filter(s => s.id)
  } catch { allStudentList.value = [] }
}
function onStudentSelect(id) {
  if (!id) return
  const s = allStudentList.value.find(x => x.id === id)
  if (s) {
    form.name = s.name || ''; form.gender = s.gender || '男'; form.contact = s.contact || ''
    form.grade = s.grade || ''; form.school = s.school || ''; form.regDate = s.regDate || ''
    if (s.hoursLeft !== undefined) form.hoursLeft = s.hoursLeft
  }
}

// ===== 从后端加载数据 =====
const students = ref([])
const loading = ref(false); const saving = ref(false)
const searchKeyword = ref(''); const filterSubject = ref(''); const filterGrade = ref('')
const showForm = ref(false); const editingId = ref(null)

async function loadStudents() {
  loading.value = true
  try {
    const res = await getStudents({ page: 1, pageSize: 200 })
    students.value = (res.list || []).map(s => ({
      ...s,
      enrollments: (s.enrollments || []).map(e => ({
        ...e,
        sessions: (e.sessions || []).map(s => ({
          ...s,
          date: s.classDate || s.date, start: s.startTime || s.start, end: s.endTime || s.end
        }))
      }))
    }))
  } catch (e) {
    console.error('加载学生列表失败', e)
  } finally { loading.value = false }
}

onMounted(loadStudents)

// ===== 派生数据 =====
const allSessions = computed(() => {
  const out = []
  for (const s of students.value)
    for (const e of (s.enrollments || []))
      for (const ses of (e.sessions || []))
        out.push({ student:s, enr:e, session:ses, id: s.id+'-'+e.subject+'-'+ses.date })
  return out
})

const filteredStudents = computed(() => students.value.filter(s => {
  const ms = !searchKeyword.value || s.name?.includes(searchKeyword.value) || s.school?.includes(searchKeyword.value) || s.contact?.includes(searchKeyword.value)
  const msub = !filterSubject.value || (s.enrollments||[]).some(e => e.subject === filterSubject.value)
  const mg = !filterGrade.value || s.grade === filterGrade.value
  return ms && msub && mg
}))
const totalHours = computed(() => students.value.reduce((s,r) => s + (r.hoursLeft||0), 0))
const today = new Date().toISOString().slice(0,10)
const todaySessions = computed(() => allSessions.value.filter(x => x.session.date === today))
const newThisMonth = computed(() => students.value.filter(s => s.regDate >= '2026-06-01').length)

async function adjustHours(row, delta) {
  row.hoursLeft = Math.max(0, (row.hoursLeft||0) + delta)
  try { await apiAdjustHours(row.id, delta) } catch { /* 容错 */ }
}

// ===== 表单 CRUD =====
function openAdd() {
  editingId.value = null; selectedStudentId.value = null; allStudentList.value = []
  Object.assign(form, { name:'', gender:'男', contact:'', hoursLeft:20, grade:'初一', school:'', regDate:'', enrollments:[newEnrollment()] })
  showForm.value = true
}
function editStudent(row) {
  editingId.value = row.id
  form.name = row.name || ''; form.gender = row.gender || '男'; form.contact = row.contact || ''
  form.hoursLeft = row.hoursLeft || 0; form.grade = row.grade || ''; form.school = row.school || ''; form.regDate = row.regDate || ''
  form.enrollments = (row.enrollments||[]).map(e => {
    const enr = newEnrollment(); enr.subject = e.subject
    enr.batches = sessionsToBatches(e); enr._pending = []; enr._timeStart = '14'; enr._timeEnd = '16'
    return enr
  })
  if (!form.enrollments.length) form.enrollments = [newEnrollment()]
  showForm.value = true
}
function addEnrollment() { form.enrollments.push(newEnrollment()) }
function removeEnrollment(idx) { form.enrollments.splice(idx, 1) }

function enrollmentCalendar(ei) {
  const enr = form.enrollments[ei]; if (!enr) return []
  const y = fmy.value; const m = fmm.value
  const fd = new Date(y,m,1).getDay(); const dim = new Date(y,m+1,0).getDate()
  const cells = []; const prevDays = new Date(y,m,0).getDate()
  for (let i = fd-1; i>=0; i--) cells.push({ day: prevDays-i, cur:false, cls:'cm-other' })
  const pending = new Set(enr._pending || [])
  const batchDates = {}; (enr.batches||[]).forEach((b,bi) => b.dates.forEach(d => batchDates[d]=bi))
  for (let d=1; d<=dim; d++) {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    let cls = 'cm-off'
    if (pending.has(ds)) cls = 'cm-pending'
    else if (batchDates[ds] !== undefined) cls = 'cm-batch'+(batchDates[ds]%6)
    cells.push({ day:d, cur:true, cls, date:ds })
  }
  for (let d=1; cells.length<42; d++) cells.push({ day:d, cur:false, cls:'cm-other' })
  return cells
}
function togglePendingDate(ei, dateStr) {
  const enr = form.enrollments[ei]; if (!enr._pending) enr._pending = []
  const idx = enr._pending.indexOf(dateStr); idx >= 0 ? enr._pending.splice(idx,1) : enr._pending.push(dateStr)
}
function confirmPendingBatch(ei) {
  const enr = form.enrollments[ei]; if (!enr._pending?.length) return
  enr.batches.push({ dates:[...enr._pending], start:enr._timeStart, end:enr._timeEnd })
  enr._pending = []; enr._timeStart = '14'; enr._timeEnd = '16'
}
function removeBatchDate(ei, bi, date) {
  const batch = form.enrollments[ei].batches[bi]; batch.dates = batch.dates.filter(d => d !== date)
  if (!batch.dates.length) form.enrollments[ei].batches.splice(bi,1)
}
function removeBatch(ei, bi) { form.enrollments[ei].batches.splice(bi,1) }
function batchesToSessions(enr) {
  const sessions = []
  for (const b of (enr.batches||[])) for (const d of b.dates) sessions.push({ date:d, start:b.start, end:b.end })
  return sessions
}
function sessionsToBatches(enr) {
  const map = {}
  for (const s of (enr.sessions||[])) { const k = s.start+'-'+s.end; if(!map[k]) map[k]={dates:[],start:s.start,end:s.end}; map[k].dates.push(s.date) }
  return Object.values(map)
}

async function save() {
  if (!form.name) return ElMessage.warning('请输入姓名')
  saving.value = true
  const payload = {
    name: form.name, gender: form.gender, contact: form.contact, hoursLeft: form.hoursLeft,
    grade: form.grade, school: form.school, regDate: form.regDate,
    enrollments: form.enrollments.map(e => ({
      subject: e.subject,
      sessions: batchesToSessions(e).map(s => ({ classDate: s.date, startTime: s.start, endTime: s.end }))
    }))
  }
  try {
    if (editingId.value) { await updateStudent(editingId.value, payload); ElMessage.success('已更新') }
    else { await createStudent(payload); ElMessage.success('已添加') }
    showForm.value = false
    await loadStudents()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally { saving.value = false }
}

async function deleteStudent(row) {
  await ElMessageBox.confirm('确定删除该学生？', '确认', { type: 'warning' })
  try { await delStudent(row.id); ElMessage.success('已删除'); await loadStudents() }
  catch (e) { ElMessage.error(e.message || '删除失败') }
}

// ===== 主日历 =====
// 已完成课程追踪
const completedSessions = ref(new Set())

function isSessionCompleted(sessionId) { return completedSessions.value.has(sessionId) }
function toggleSessionComplete(sessionId) {
  if (completedSessions.value.has(sessionId)) { completedSessions.value.delete(sessionId) }
  else { completedSessions.value.add(sessionId) }
  // trigger reactivity
  completedSessions.value = new Set(completedSessions.value)
}

// 调课
const showReschedule = ref(false); const rescheduleTarget = ref(null)
const rescheduleForm = reactive({ date:'', start:'14', end:'16' })
function openReschedule(sessionItem) {
  rescheduleTarget.value = sessionItem
  rescheduleForm.date = sessionItem.session.date
  rescheduleForm.start = sessionItem.session.start
  rescheduleForm.end = sessionItem.session.end
  showReschedule.value = true
}
function confirmReschedule() {
  if (!rescheduleTarget.value || !rescheduleForm.date) return
  const s = rescheduleTarget.value
  s.session.date = rescheduleForm.date
  s.session.start = rescheduleForm.start
  s.session.end = rescheduleForm.end
  showReschedule.value = false
}

const calendarYear = ref(2026); const calendarMonth = ref(6); const selectedDate = ref('')
function prevMonth() { if (calendarMonth.value===0){calendarYear.value--;calendarMonth.value=11}else calendarMonth.value-- }
function nextMonth() { if (calendarMonth.value===11){calendarYear.value++;calendarMonth.value=0}else calendarMonth.value++ }
const calendarCells = computed(() => {
  const y=calendarYear.value; const m=calendarMonth.value
  const fd=new Date(y,m,1).getDay(); const dim=new Date(y,m+1,0).getDate()
  const cells=[]; const todayStr=new Date().toISOString().slice(0,10)
  const prevDays=new Date(y,m,0).getDate()
  for(let i=fd-1;i>=0;i--) cells.push({day:prevDays-i,isCurrentMonth:false,hasClass:false,date:'',cls:{}})
  for(let d=1;d<=dim;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const daySessions = allSessions.value.filter(x=>x.session.date===ds)
    const has=daySessions.length > 0
    const allDone=has && daySessions.every(x=>completedSessions.value.has(x.id))
    const allFutureDone=allDone && ds >= todayStr
    const isPast=ds<todayStr
    cells.push({day:d,isCurrentMonth:true,isToday:ds===todayStr,hasClass:has,isPast:isPast||allFutureDone,date:ds,
      cls:{'cal-today':ds===todayStr,'cal-future':has&&!isPast&&!allFutureDone,'cal-past':has&&(isPast||allFutureDone),'cal-active':ds===selectedDate.value}})
  }
  for(let d=1;cells.length<42;d++) cells.push({day:d,isCurrentMonth:false,hasClass:false,date:'',cls:{}})
  return cells
})
function selectDate(d){selectedDate.value=d}
const selectedSessions=computed(()=>selectedDate.value?allSessions.value.filter(x=>x.session.date===selectedDate.value):[])
</script>

<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.filter-bar{display:flex;gap:10px;align-items:center}
.stat-card{text-align:center;padding:6px 0}.stat-num{font-size:30px;font-weight:700;line-height:1.3}
.stat-num.blue{color:#6366F1}.stat-num.green{color:#67C23A}.stat-num.orange{color:#E6A23C}.stat-num.red{color:#F56C6C}
.stat-label{font-size:13px;color:var(--text-muted);margin-top:2px}
.hours-cell{display:inline-flex;align-items:center;gap:0}
.hours-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:16px;font-weight:600;user-select:none;background:var(--color-bg-alt);color:var(--text-secondary);transition:all var(--transition)}
.hours-btn:hover{background:var(--color-primary-bg);color:var(--color-primary)}.hours-btn.disabled{opacity:.3;cursor:not-allowed}
.hours-val{font-weight:700;font-size:16px;min-width:36px;text-align:center;color:var(--color-success)}.hours-val.zero{color:var(--color-danger)}
.subject-tag{margin:1px 2px}.tag-note{font-size:11px;opacity:.7}
.enroll-block{border:1px solid var(--color-border-light);border-radius:var(--radius-sm);padding:14px;margin-bottom:12px}
.enroll-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.mini-cal{margin-bottom:10px}.cal-nav{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;font-size:13px}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px}
.ch{font-size:11px;color:var(--text-muted);padding:2px 0}
.cc{font-size:12px;padding:4px 0;border-radius:4px;cursor:default;transition:all .15s}
.cc.cm-other{color:#ddd}.cc.cm-off{cursor:pointer}.cc.cm-off:hover{background:var(--color-bg-alt)}
.cc.cm-pending{background:#FEF3C7;color:#D97706;font-weight:600;cursor:pointer}
.cc.cm-batch0{background:#FEE2E2;color:#DC2626;font-weight:600}.cc.cm-batch1{background:#DBEAFE;color:#2563EB;font-weight:600}
.cc.cm-batch2{background:#FEF3C7;color:#D97706;font-weight:600}.cc.cm-batch3{background:#D1FAE5;color:#059669;font-weight:600}
.cc.cm-batch4{background:#EDE9FE;color:#7C3AED;font-weight:600}.cc.cm-batch5{background:#FCE7F3;color:#DB2777;font-weight:600}
.pending-area{margin:10px 0}.pending-dates{margin-bottom:6px}
.pending-action{display:flex;align-items:center;gap:6px}.hint{color:var(--text-muted);font-size:12px}
.batch-row{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap;font-size:13px}
.batch-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.batch-time{font-weight:600;min-width:80px}
.card-head{display:flex;justify-content:space-between;align-items:center}.card-title{font-weight:600;font-size:15px}
.month-nav{display:flex;align-items:center;gap:4px}
.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
.cal-header{padding:8px 0;font-size:12px;color:var(--text-muted);font-weight:600}
.cal-cell{padding:4px 0;min-height:48px;cursor:default;border-radius:var(--radius-sm);position:relative;transition:all var(--transition);font-size:13px}
.cal-cell:hover{background:var(--color-bg-alt)}.cal-cell.cal-other{color:var(--text-muted);opacity:.4}
.cal-cell.cal-today{font-weight:700}.cal-cell.cal-today .cal-day{background:var(--color-primary);color:#fff;border-radius:50%;display:inline-block;width:28px;height:28px;line-height:28px}
.cal-cell.cal-active{box-shadow:0 0 0 2px var(--color-primary) inset}.cal-cell.cal-future{cursor:pointer}
.cal-cell.cal-future .cal-day{color:#EF4444;font-weight:700}.cal-cell.cal-past .cal-day{color:#10B981}
.cal-dot{display:block;width:5px;height:5px;border-radius:50%;margin:2px auto 0}.cal-future .cal-dot{background:#EF4444}.cal-past .cal-dot{background:#10B981}
.cal-legend{display:flex;gap:16px;margin-top:12px;font-size:12px;color:var(--text-muted);align-items:center}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}.dot.future{background:#EF4444}.dot.past{background:#10B981}
.schedule-item{padding:14px;border-radius:var(--radius-sm);border:1px solid var(--color-border-light);margin-bottom:10px;transition:all var(--transition)}
.schedule-item:hover{border-color:var(--color-primary-light)}.schedule-item.completed{background:#EFF6FF;border-color:#93C5FD}
.sched-row{display:flex;justify-content:space-between;align-items:flex-start}
.sched-left{flex:1}.sched-actions{display:flex;gap:4px;flex-shrink:0;margin-left:12px}
.sched-time{font-size:13px;color:var(--color-primary);margin-bottom:6px;font-weight:500}.schedule-item.completed .sched-time{color:#2563EB}
.sched-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.sched-info strong{font-size:15px}.sched-grade{font-size:12px;color:var(--text-muted)}
.completed-badge{font-size:12px;color:#2563EB;margin-top:6px;font-weight:600}
</style>
