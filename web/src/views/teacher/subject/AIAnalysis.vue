<template>
  <div>
    <el-row :gutter="8" class="mb-lg">
      <el-col :span="4"><el-select v-model="student" placeholder="选择学生"><el-option v-for="s in students" :key="s" :label="s" :value="s"/></el-select></el-col>
      <el-col :span="3"><el-select v-model="period" placeholder="时间范围"><el-option label="本学期" value="semester"/><el-option label="本月" value="month"/><el-option label="本周" value="week"/></el-select></el-col>
      <el-col :span="2"><el-button type="primary" @click="generate">生成报告</el-button></el-col>
    </el-row>

    <el-row :gutter="20" v-if="report">
      <el-col :span="12">
        <el-card><template #header><span class="card-title">🎯 能力雷达图</span></template><div class="radar-placeholder">雷达图区域 · 接入 ECharts 渲染</div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header><span class="card-title">📈 学情趋势</span></template><div class="radar-placeholder">趋势图区域 · 接入 ECharts 渲染</div></el-card>
      </el-col>
    </el-row>

    <el-card class="mt-lg" v-if="report">
      <template #header><span class="card-title">🤖 AI 综合诊断</span></template>
      <div class="diagnosis">
        <p>{{ report.diagnosis }}</p>
        <h4 class="mt-lg">冲刺建议</h4>
        <ul><li v-for="s in report.suggestions" :key="s">{{ s }}</li></ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const student = ref(''); const period = ref('semester'); const report = ref(null)
const students = ['张三', '李四', '王五', '赵六']
function generate() {
  report.value = {
    diagnosis: '该生在本学期表现总体良好。数学学科中"二次函数"和"相似三角形"掌握扎实（85%+），但"概率统计"模块薄弱（52%），表现为对条件概率理解不足。英语阅读能力稳定（蓝思值 890L），写作能力需加强。建议：1) 数学重点攻克概率章节 2) 英语增加写作训练频率。',
    suggestions: ['每日1道概率应用题，重点练条件概率', '每周2篇英语写作，侧重议论文', '复习二次函数最值问题(已掌握但易忘)', '考前两周做3套综合模拟卷']
  }
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.mt-lg { margin-top: var(--space-lg); }
.card-title { font-weight: 600; }
.radar-placeholder { height: 260px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); border-radius: var(--radius-md); color: var(--text-muted); font-size: 14px; }
.diagnosis p { color: var(--text-secondary); line-height: 1.9; font-size: 14px; }
.diagnosis h4 { font-size: 15px; margin-bottom: 8px; }
.diagnosis li { color: var(--text-secondary); line-height: 2; font-size: 14px; }
</style>
