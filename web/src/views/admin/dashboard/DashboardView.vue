<template>
  <div class="page-container">
    <div class="page-header"><div><h2>🖥️ 管理概览</h2><p>系统运行状态 · 数据总览</p></div></div>
    <el-row :gutter="20" class="mb-lg">
      <el-col :span="12" v-for="s in stats" :key="s.label"><el-card shadow="hover" class="stat-card"><div class="stat-num" :style="{color:s.color}">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></el-card></el-col>
    </el-row>
    <div class="rt-head">📈 实时数据 <span class="rt-tip">每 30s 自动刷新</span></div>
    <el-row :gutter="20" class="mb-lg">
      <el-col :xs="24" :sm="12" :md="4" v-for="r in realtimeStats" :key="r.label"><el-card shadow="hover" class="stat-card"><div class="stat-num" :style="{color:r.color}">{{ r.value }}</div><div class="stat-label">{{ r.label }}</div></el-card></el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12"><el-card><template #header><span class="card-title">📋 快捷入口</span></template>
        <div class="action-grid">
          <div class="action-item" v-for="a in actions" :key="a.text" @click="$router.push(a.path)"><div class="action-icon" :style="{background:a.bg}"><el-icon :size="20"><component :is="a.icon"/></el-icon></div><span>{{ a.text }}</span></div>
        </div>
      </el-card></el-col>
    </el-row>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getAdminStats, getAdminRealtimeStats } from '@/api/common/admin'
const data = ref({})
const realtime = ref({})
let rtTimer = null
onMounted(async () => {
  try { data.value = await getAdminStats() } catch {}
  await loadRealtime()
  rtTimer = setInterval(loadRealtime, 30000)
})
async function loadRealtime() { try { realtime.value = await getAdminRealtimeStats() } catch {} }
onBeforeUnmount(() => { if (rtTimer) clearInterval(rtTimer) })
const stats = computed(() => [
  { label:'老师总数', value: data.value?.teacherCount ?? 0, color:'#6366F1' },
  { label:'学生总数', value: data.value?.studentCount ?? 0, color:'#67C23A' }
])
const realtimeStats = computed(() => [
  { label:'当前在线人数', value: realtime.value?.onlineCount ?? 0, color:'#409EFF' },
  { label:'试卷分析使用中', value: realtime.value?.examAnalysisActive ?? 0, color:'#E6A23C' },
  { label:'AI动图使用中', value: realtime.value?.aiAnimationActive ?? 0, color:'#8B5CF6' },
  { label:'错题分析使用中', value: realtime.value?.wrongAnalysisActive ?? 0, color:'#F56C6C' },
  { label:'资源总下载量', value: realtime.value?.resourceDownloadTotal ?? 0, color:'#67C23A' }
])
const actions = [
  { text:'学生管理', icon:'User', path:'/admin/students', bg:'#EEF2FF' },
  { text:'老师管理', icon:'Avatar', path:'/admin/teachers', bg:'#ECFDF5' },
  { text:'系统设置', icon:'SetUp', path:'/admin/settings', bg:'#FEF2F2' }
]
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.stat-card{text-align:center;padding:8px 0}.stat-num{font-size:32px;font-weight:700;line-height:1.3}.stat-label{font-size:13px;color:var(--text-muted);margin-top:4px}.card-title{font-weight:600}.rt-head{font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-primary)}.rt-tip{font-size:12px;font-weight:400;color:var(--text-muted);margin-left:8px}.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.action-item{display:flex;align-items:center;gap:12px;padding:16px;border-radius:var(--radius-sm);border:1px solid var(--color-border-light);cursor:pointer;transition:all var(--transition);font-size:14px}.action-item:hover{background:var(--color-bg-alt);border-color:var(--color-primary-light)}.action-icon{width:40px;height:40px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--color-primary)}
</style>
