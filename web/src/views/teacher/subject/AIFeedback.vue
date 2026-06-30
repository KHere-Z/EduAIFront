<template>
  <div>
    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6">
        <el-card><div class="stat-card"><div class="stat-value" style="color:var(--color-success)">87%</div><div class="stat-label">知识点覆盖率</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card><div class="stat-card"><div class="stat-value" style="color:var(--color-primary)">76%</div><div class="stat-label">学生参与度</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card><div class="stat-card"><div class="stat-value" style="color:var(--color-warning)">3</div><div class="stat-label">薄弱点预警</div></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card><div class="stat-card"><div class="stat-value">A</div><div class="stat-label">课堂评级</div></div></el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header><span class="card-title">🤖 AI 课堂反馈报告</span></template>
      <div class="feedback-item" v-for="(item, i) in feedbacks" :key="i">
        <el-icon :color="item.color"><component :is="item.icon" /></el-icon>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.content }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const feedbacks = ref([
  { icon:'Warning', color:'#F59E0B', title:'薄弱点：二次函数', content:'班级60%学生对"二次函数最值问题"回答错误，建议下节课用10分钟专题巩固。' },
  { icon:'SuccessFilled', color:'#10B981', title:'掌握良好：勾股定理', content:'92%正确率，应用类题目表现优秀。可适当提高难度，引入空间几何中的勾股应用。' },
  { icon:'InfoFilled', color:'#6366F1', title:'教学建议', content:'本次课堂互动频率偏低，建议增加小组讨论环节。可引入真实场景问题提升参与度。' }
])
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 32px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.card-title { font-weight: 600; }
.feedback-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--color-border-light); align-items: flex-start; }
.feedback-item:last-child { border-bottom: none; }
.feedback-item strong { display: block; font-size: 15px; margin-bottom: 4px; }
.feedback-item p { color: var(--text-secondary); font-size: 14px; line-height: 1.7; }
</style>
