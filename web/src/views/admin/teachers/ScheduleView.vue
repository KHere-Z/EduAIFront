<template>
  <div class="page-container">
    <div class="page-header"><div><h2>📅 排课查看</h2><p>按老师+月份查看排课</p></div>
      <div style="display:flex;gap:10px">
        <el-select v-model="filters.teacherId" placeholder="选择老师" clearable @change="load" style="width:180px"><el-option v-for="t in teacherOptions" :key="t.userId" :label="t.realName" :value="t.userId"/></el-select>
        <el-select v-model="filters.month" placeholder="月份" @change="load" style="width:120px"><el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m"/></el-select>
      </div>
    </div>
    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6" v-for="s in summary" :key="s.label"><el-card shadow="hover" class="stat-card"><div class="stat-num" :style="{color:s.color}">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></el-card></el-col>
    </el-row>
    <el-card>
      <el-table :data="schedules" stripe size="small" v-loading="loading">
        <el-table-column prop="classDate" label="日期" width="110"/>
        <el-table-column label="时间" width="100"><template #default="{row}">{{ row.startTime }}:00-{{ row.endTime }}:00</template></el-table-column>
        <el-table-column prop="studentName" label="学生" width="90"/>
        <el-table-column prop="subject" label="科目" width="80"/>
        <el-table-column prop="teacherName" label="老师" width="90"/>
      </el-table>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminTeachers, getAdminSchedules } from '@/api/common/admin'
const loading = ref(false); const teacherOptions = ref([])
const filters = reactive({ teacherId: null, month: new Date().getMonth()+1, year: 2026 })
const schedules = ref([]); const summary = ref([{label:'本月排课',value:0,color:'#6366F1'},{label:'老师数',value:0,color:'#67C23A'},{label:'学生数',value:0,color:'#E6A23C'},{label:'今日',value:0,color:'#F56C6C'}])
onMounted(async () => { try { const r = await getAdminTeachers({ pageSize:100 }); teacherOptions.value = r.list||[] } catch {}; await load() })
async function load() {
  loading.value = true
  try {
    const r = await getAdminSchedules({ teacherId: filters.teacherId, year: filters.year, month: filters.month, pageSize: 200 })
    schedules.value = r.list||[]; summary.value[0].value = r.total||0
  } catch {}
  loading.value = false
}
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.stat-card{text-align:center;padding:6px 0}.stat-num{font-size:30px;font-weight:700;line-height:1.3}.stat-label{font-size:13px;color:var(--text-muted);margin-top:2px}
</style>
