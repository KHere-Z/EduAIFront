<template>
  <div class="page-container">
    <div class="page-header"><div><h2>🖥️ 管理概览</h2><p>系统运行状态 · 数据总览</p></div></div>
    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6" v-for="s in stats" :key="s.label"><el-card shadow="hover" class="stat-card"><div class="stat-num" :style="{color:s.color}">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></el-card></el-col>
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
import { ref, computed, onMounted } from 'vue'
import { getAdminStats } from '@/api/common/admin'
const data = ref({})
onMounted(async () => { try { data.value = await getAdminStats() } catch {} })
const stats = computed(() => [
  { label:'老师总数', value: data.value?.teacherCount ?? 0, color:'#6366F1' },
  { label:'学生总数', value: data.value?.studentCount ?? 0, color:'#67C23A' },
  { label:'总课时',   value: data.value?.totalHours ?? 0,   color:'#E6A23C' },
  { label:'排课记录', value: data.value?.sessionCount ?? 0, color:'#F56C6C' }
])
const actions = [
  { text:'学生管理', icon:'User', path:'/admin/students', bg:'#EEF2FF' },
  { text:'老师管理', icon:'Avatar', path:'/admin/teachers', bg:'#ECFDF5' },
  { text:'排课查看', icon:'Calendar', path:'/admin/schedules', bg:'#FFF7ED' },
  { text:'系统设置', icon:'SetUp', path:'/admin/settings', bg:'#FEF2F2' }
]
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.stat-card{text-align:center;padding:8px 0}.stat-num{font-size:32px;font-weight:700;line-height:1.3}.stat-label{font-size:13px;color:var(--text-muted);margin-top:4px}.card-title{font-weight:600}.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.action-item{display:flex;align-items:center;gap:12px;padding:16px;border-radius:var(--radius-sm);border:1px solid var(--color-border-light);cursor:pointer;transition:all var(--transition);font-size:14px}.action-item:hover{background:var(--color-bg-alt);border-color:var(--color-primary-light)}.action-icon{width:40px;height:40px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--color-primary)}
</style>
