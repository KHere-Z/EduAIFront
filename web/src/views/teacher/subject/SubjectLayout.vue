<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>{{ subjectMeta.icon }} {{ subjectMeta.label }} · 学科中心</h2>
        <p>错题管理 · 知识体系 · AI 分析</p>
      </div>
    </div>

    <!-- 学科切换 -->
    <div class="subject-bar">
      <button
        v-for="s in subjects" :key="s.value"
        :class="['subject-tab', { active: currentSubject === s.value }]"
        @click="switchSubject(s.value)"
      >{{ s.icon }} {{ s.label }}</button>
    </div>

    <!-- 功能导航 -->
    <div class="feature-bar">
      <router-link
        v-for="f in features" :key="f.path"
        :to="`/teacher/subject/${currentSubject}/${f.path}`"
        class="feature-tab"
        active-class="active"
      >
        <el-icon :size="16"><component :is="f.icon" /></el-icon>
        {{ f.label }}
      </router-link>
    </div>

    <!-- 功能内容 -->
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentSubject = computed(() => route.params.subject)

const subjectMetaMap = {
  chinese:  { label:'语文', icon:'📝' }, math:     { label:'数学', icon:'📐' },
  english:  { label:'英语', icon:'📖' }, physics:  { label:'物理', icon:'⚛️' },
  chemistry:{ label:'化学', icon:'🧪' }, biology:  { label:'生物', icon:'🧬' },
  history:  { label:'历史', icon:'📜' }, politics: { label:'政治', icon:'⚖️' },
  geography:{ label:'地理', icon:'🌍' }
}
const subjectMeta = computed(() => subjectMetaMap[currentSubject.value] || { label:'未知', icon:'📚' })

const subjects = Object.entries(subjectMetaMap).map(([value, meta]) => ({ value, ...meta }))

const features = [
  { path:'wrong-questions',  label:'错题整理', icon:'Edit' },
  { path:'wrong-analysis',   label:'错题分析', icon:'Search' },
  { path:'knowledge-points', label:'知识点',   icon:'Collection' },
  { path:'exam-points',      label:'考点整理', icon:'Star' },
  { path:'solution-models',  label:'解题模型', icon:'Grid' },
  { path:'question-bank',    label:'题库',     icon:'Files' },
  { path:'ai-feedback',      label:'AI课堂反馈', icon:'MagicStick' },
  { path:'ai-analysis',      label:'AI综合分析', icon:'TrendCharts' },
  { path:'score-statistics', label:'成绩统计', icon:'DataAnalysis' }
]

function switchSubject(subject) {
  router.push(`/teacher/subject/${subject}/wrong-questions`)
}
</script>

<style scoped>
.subject-bar { display: flex; gap: 6px; margin-bottom: var(--space-lg); flex-wrap: wrap; }
.subject-tab {
  padding: 6px 14px; border: 1px solid var(--color-border); border-radius: 20px;
  background: #fff; font-size: 13px; cursor: pointer; transition: all var(--transition);
  color: var(--text-secondary); font-family: inherit;
}
.subject-tab:hover { border-color: var(--color-primary-light); color: var(--color-primary); }
.subject-tab.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.feature-bar { display: flex; gap: 2px; margin-bottom: var(--space-lg); background: var(--color-bg-alt); padding: 4px; border-radius: var(--radius-sm); }
.feature-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; font-size: 13px; color: var(--text-secondary);
  border-radius: var(--radius-sm); text-decoration: none; transition: all var(--transition);
  white-space: nowrap;
}
.feature-tab:hover { color: var(--color-primary); background: #fff; }
.feature-tab.active { background: #fff; color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm); }
</style>
