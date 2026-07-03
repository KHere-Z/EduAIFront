<template>
  <div class="page-container">
    <div class="page-header">
      <div><h2>👋 下午好，{{ auth.user?.realName || '老师' }}</h2><p>今天是 {{ today }}，欢迎使用安文AI教育</p></div>
      <el-button type="primary" size="large" @click="$router.push('/teacher/students')"><el-icon style="margin-right:6px"><User /></el-icon>学生信息</el-button>
    </div>
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="s in statCards" :key="s.label"><el-card shadow="hover" class="stat-card"><div class="stat-icon" :style="{ background: s.bg }"><el-icon :size="20"><component :is="s.icon" /></el-icon></div><div class="stat-value">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></el-card></el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="8"><el-card><template #header><span class="card-title">⚡ 快捷操作</span></template><div class="action-grid"><div v-for="a in actions" :key="a.text" class="action-item" @click="$router.push(a.path)"><div class="action-icon" :style="{ background: a.bg }"><el-icon :size="18"><component :is="a.icon" /></el-icon></div><span class="action-text">{{ a.text }}</span></div></div></el-card></el-col>
      <el-col :span="8"><el-card><template #header><span class="card-title">📚 学科中心</span></template><div class="subject-grid"><div v-for="s in subjects" :key="s.value" class="subject-chip" @click="$router.push(s.value === 'english' ? '/teacher/english/home' : `/teacher/subject/${s.value}/wrong-questions`)">{{ s.icon }} {{ s.label }}</div></div></el-card></el-col>
      <el-col :span="8"><el-card><template #header><span class="card-title">📊 今日概览</span></template><div class="today-item" v-for="t in todayStats" :key="t.label"><span>{{ t.label }}</span><strong>{{ t.value }}</strong></div></el-card></el-col>
    </el-row>
  </div>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { getStudents } from '@/api/common/students'
const auth = useAuthStore()
const studentCount = ref(0); const todaySessionCount = ref(0); const totalHoursLeft = ref(0)
const todayStr = new Date().toISOString().slice(0, 10)
const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' })
async function loadStats() {
  try {
    const res = await getStudents({ page: 1, pageSize: 200 }); const list = res.list || []
    studentCount.value = list.length; totalHoursLeft.value = list.reduce((s,r)=>s+(r.hoursLeft||0),0)
    todaySessionCount.value = list.reduce((c,s)=>c+(s.enrollments||[]).reduce((c2,e)=>c2+(e.sessions||[]).filter(ses=>(ses.date||ses.classDate)===todayStr).length,0),0)
  } catch {}
}
onMounted(loadStats)
const statCards = computed(() => [
  { label:'我的学员', value:studentCount.value, icon:'User', bg:'#EEF2FF' },
  { label:'今日课堂', value:todaySessionCount.value, icon:'Reading', bg:'#ECFDF5' },
  { label:'剩余课时', value:totalHoursLeft.value, icon:'Calendar', bg:'#FFF7ED' },
  { label:'任教学科', value:auth.user?.subjects?.length || 0, icon:'Collection', bg:'#FEF2F2' }
])
const zh2en = { '语文':'chinese','数学':'math','英语':'english','物理':'physics','化学':'chemistry','生物':'biology','历史':'history','政治':'politics','地理':'geography' }
const icons = { '语文':'📝','数学':'📐','英语':'📖','物理':'⚛️','化学':'🧪','生物':'🧬','历史':'📜','政治':'⚖️','地理':'🌍' }
const teacherSubjects = computed(() => auth.user?.subjects || [])
const subjects = computed(() => teacherSubjects.value.filter(s=>zh2en[s]).map(s=>({value:zh2en[s],label:s,icon:icons[s]||'📚'})))
const actions = [
  { text:'学科中心', icon:'Collection', path:'/teacher/dashboard', bg:'#EEF2FF' },
  { text:'学习反馈', icon:'ChatLineSquare', path:'/teacher/feedback', bg:'#F0FDFA' }
]
const todayStats = computed(() => [
  { label:'学员总数', value:studentCount.value+' 人' }, { label:'今日课时', value:todaySessionCount.value+' 节' },
  { label:'总剩余课时', value:totalHoursLeft.value+' 节' }, { label:'任教学科', value:(auth.user?.subjects?.length||0)+' 科' }
])
</script>
<style scoped>
.stat-card{text-align:center;padding:8px 0}.stat-icon{width:44px;height:44px;border-radius:var(--radius-md);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;color:var(--color-primary)}.stat-value{font-size:32px;font-weight:700;line-height:1.2}.stat-label{font-size:13px;color:var(--text-muted);margin-top:4px}.card-title{font-weight:600;font-size:15px}.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.action-item{display:flex;align-items:center;gap:10px;padding:12px;border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition);border:1px solid var(--color-border-light)}.action-item:hover{background:var(--color-bg-alt);border-color:var(--color-primary-light)}.action-icon{width:36px;height:36px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0}.action-text{font-size:13px;font-weight:500;color:var(--text-secondary)}.subject-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.subject-chip{padding:8px 6px;font-size:13px;text-align:center;border-radius:var(--radius-sm);cursor:pointer;background:var(--color-bg-alt);transition:all var(--transition)}.subject-chip:hover{background:var(--color-primary-bg);color:var(--color-primary)}.today-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--color-border-light);font-size:14px;color:var(--text-secondary)}.today-item:last-child{border-bottom:none}.today-item strong{color:var(--text-primary);font-weight:600}
</style>
