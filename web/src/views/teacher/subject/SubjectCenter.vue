<template>
  <div class="sc-page">
    <div class="sc-hero">
      <div class="sch-emoji">{{ icon }}</div>
      <h2>{{ label }} 学科中心</h2>
      <p>{{ active ? '选一个功能开始使用' : '暂未开发，敬请期待' }}</p>
    </div>

    <div class="sc-grid" v-if="active">
      <div v-for="f in features" :key="f.path" class="sc-card" @click="$router.push(f.path)">
        <div class="scc-icon" :style="{background:f.bg,color:f.color}">{{ f.icon }}</div>
        <div class="scc-body">
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
        <div class="scc-action" :style="{color:f.color}">{{ f.action }} →</div>
      </div>
    </div>

    <el-empty v-else description="暂未开发" :image-size="120"/>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const subject = computed(() => route.params.subject || 'math')

const icons = { math:'📐', chinese:'📝', english:'📖', physics:'⚛️', chemistry:'🧪', biology:'🧬', history:'📜', politics:'⚖️', geography:'🌍' }
const labels = { math:'数学', chinese:'语文', english:'英语', physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'政治', geography:'地理' }
const icon = computed(() => icons[subject.value] || '📚')
const label = computed(() => labels[subject.value] || subject.value)
const active = computed(() => subject.value === 'math')

const features = [
  {
    title:'AI 错题分析', icon:'🔬',
    desc:'拍照上传学生错题，AI 自动识别题目、分析错因、生成举一反三练习题',
    action:'进入分析', color:'#6366F1', bg:'#EEF2FF',
    path:`/teacher/subject/math/wrong-analysis`
  },
  {
    title:'AI 试卷分析', icon:'📄',
    desc:'上传学生试卷，AI 诊断扣分点、分析薄弱知识点、给出提分建议',
    action:'进入分析', color:'#F59E0B', bg:'#FFF7ED',
    path:`/teacher/subject/math/exam-analysis`
  },
  {
    title:'AI 动态图解', icon:'🎬',
    desc:'将几何动点题、函数图像题转为动态演示，帮助可视化教学',
    action:'进入演示', color:'#10B981', bg:'#ECFDF5',
    path:`/teacher/subject/math/ai-animation`
  },
  {
    title:'学习资源管理', icon:'📚',
    desc:'上传讲义、课件、试卷等资源，设定智学点价格，供学生下载学习',
    action:'进入管理', color:'#8B5CF6', bg:'#F5F3FF',
    path:`/teacher/subject/math/resources`
  },
]
</script>

<style scoped>
.sc-page{max-width:800px;margin:0 auto;padding:24px 14px 40px}
.sc-hero{text-align:center;padding:24px 12px}
.sch-emoji{font-size:56px;animation:bounce 2s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.sc-hero h2{font-size:24px;font-weight:800;margin:8px 0 4px}
.sc-hero p{font-size:13px;color:var(--text-muted)}
.sc-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:680px;margin:0 auto}
.sc-card{background:#fff;padding:24px;border-radius:16px;cursor:pointer;transition:all .2s;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border-light);display:flex;gap:16px;align-items:flex-start}
.sc-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08);border-color:var(--color-primary-light)}
.scc-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.scc-body{flex:1;min-width:0}.scc-body h3{font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px}.scc-body p{font-size:13px;color:var(--text-muted);line-height:1.6}
.scc-action{font-size:13px;font-weight:600;flex-shrink:0;margin-top:14px;white-space:nowrap}
</style>
