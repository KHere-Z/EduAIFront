<template>
  <div>
    <el-row :gutter="8" class="mb-lg">
      <el-col :span="4"><el-select v-model="exam" placeholder="选择考试"><el-option label="期末模拟一" value="mock1"/><el-option label="期中考试" value="midterm"/><el-option label="月考三" value="monthly3"/></el-select></el-col>
      <el-col :span="3"><el-select v-model="scope" placeholder="范围"><el-option label="班级" value="class"/><el-option label="年级" value="grade"/></el-select></el-col>
    </el-row>

    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6" v-for="s in summary" :key="s.label">
        <el-card><div class="stat-card"><div class="stat-value">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></div></el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card><template #header><span class="card-title">📊 分数分布</span></template><div class="chart-placeholder">柱状图 · 接入 ECharts</div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header><span class="card-title">📋 成绩明细</span></template>
          <el-table :data="details" stripe size="small">
            <el-table-column prop="rank" label="排名" width="60"/>
            <el-table-column prop="name" label="姓名" width="80"/>
            <el-table-column prop="score" label="分数" width="70"/>
            <el-table-column label="趋势" width="100"><template #default="{row}"><span :style="{color:row.trend>0?'#10B981':'#EF4444'}">{{ row.trend > 0 ? '↑' : '↓' }} {{ Math.abs(row.trend) }}</span></template></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const exam = ref('mock1'); const scope = ref('class')
const summary = ref([
  { label:'平均分', value:'78.5' }, { label:'最高分', value:'98' },
  { label:'最低分', value:'52' }, { label:'标准差', value:'12.3' }
])
const details = ref([
  { rank:1, name:'王小明', score:98, trend:5 },
  { rank:2, name:'李小华', score:95, trend:-2 },
  { rank:3, name:'张小红', score:91, trend:8 },
  { rank:4, name:'陈小刚', score:87, trend:3 },
  { rank:5, name:'刘小丽', score:82, trend:-1 }
])
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 32px; font-weight: 700; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.card-title { font-weight: 600; }
.chart-placeholder { height: 300px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); border-radius: var(--radius-md); color: var(--text-muted); font-size: 14px; }
</style>
