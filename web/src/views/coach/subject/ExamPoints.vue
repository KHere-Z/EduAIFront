<template>
  <div>
    <el-row :gutter="16" class="mb-lg">
      <el-col :span="4"><el-select v-model="filterFreq" placeholder="考频" clearable><el-option label="高频" value="high"/><el-option label="中频" value="mid"/><el-option label="低频" value="low"/></el-select></el-col>
      <el-col :span="4"><el-select v-model="filterYear" placeholder="年份" clearable><el-option v-for="y in [2025,2024,2023,2022,2021]" :key="y" :label="y" :value="y"/></el-select></el-col>
    </el-row>

    <el-table :data="points" stripe>
      <el-table-column prop="id" label="#" width="60"/>
      <el-table-column prop="name" label="考点名称" min-width="180"/>
      <el-table-column label="出现频次" width="120"><template #default="{row}"><el-tag :type="row.freqTag" size="small">{{ row.frequency }}</el-tag></template></el-table-column>
      <el-table-column prop="weight" label="分值占比" width="100"/>
      <el-table-column prop="level" label="难度星级" width="100"><template #default="{row}">{{ '⭐'.repeat(row.stars) }}</template></el-table-column>
      <el-table-column prop="years" label="出现年份" min-width="150"/>
      <el-table-column label="操作" width="100"><template #default><el-button size="small" text type="primary">真题</el-button></template></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const filterFreq = ref(''); const filterYear = ref('')
const points = ref([
  { id:1, name:'勾股定理及其应用', frequency:'近5年8次', freqTag:'danger', weight:'12-15分', stars:4, years:'2021-2025' },
  { id:2, name:'二次函数图像与性质', frequency:'近5年7次', freqTag:'danger', weight:'10-14分', stars:5, years:'2021-2025' },
  { id:3, name:'相似三角形的判定', frequency:'近5年5次', freqTag:'warning', weight:'8-10分', stars:3, years:'2022-2025' },
  { id:4, name:'数据的收集与整理', frequency:'近5年3次', freqTag:'info', weight:'4-6分', stars:2, years:'2023-2025' }
])
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
</style>
