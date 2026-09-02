<template>
  <div class="sf-page">
    <router-link :to="`/student/subject/${subject}`" class="back-link">← 返回学科中心</router-link>
    <div class="sf-hero"><h2>📊 近期反馈</h2><p>老师评语 · 学习报告 · 阶段总结</p></div>

    <div class="sf-filter" v-if="feedbacks.length">
      <el-radio-group v-model="filterSubject" size="small">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button v-for="s in availableSubjects" :key="s" :label="s">{{ s }}</el-radio-button>
      </el-radio-group>
    </div>

    <div class="sf-list" v-if="filteredFeedbacks.length">
      <div v-for="fb in filteredFeedbacks" :key="fb.id" class="sf-card">
        <div class="sfc-head">
          <div class="sfc-teacher">
            <span class="sfct-avatar">{{ (fb.teacherName||'老')[0] }}</span>
            <div>
              <div class="sfct-name">{{ fb.teacherName||'老师' }}</div>
              <div class="sfct-date">{{ fb.createdAt?.slice(0,10) }}</div>
            </div>
          </div>
          <div class="sfc-tags">
            <el-tag size="small" effect="plain">{{ fb.subject }}</el-tag>
            <el-tag v-if="fb.period" size="small" type="info" effect="plain">{{ fb.period }}</el-tag>
          </div>
        </div>
        <div class="sfc-body">{{ fb.content }}</div>
      </div>
    </div>

    <el-empty v-else :description="subjectLabel + '暂无反馈'" :image-size="100"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getStudentFeedbacks } from '@/api/common/admin'

const route = useRoute()
const subject = computed(() => route.params.subject || 'math')
const filterSubject = ref('')

const subjectMap = { math:'数学', chinese:'语文', english:'英语', physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'政治', geography:'地理' }
const subjectLabel = computed(() => subjectMap[subject.value]||'数学')

const feedbacks = ref([])

async function loadFeedbacks() {
  try {
    feedbacks.value = await getStudentFeedbacks({ subject: subjectLabel.value })
  } catch { feedbacks.value = [] }
}

const availableSubjects = computed(() => [...new Set(feedbacks.value.map(f => f.subject))])

const filteredFeedbacks = computed(() => {
  return feedbacks.value
    .filter(f => !filterSubject.value || f.subject === filterSubject.value)
    .sort((a,b) => b.id - a.id)
})

onMounted(loadFeedbacks)
</script>

<style scoped>
.sf-page{max-width:680px;margin:0 auto;padding:20px 14px 40px}
.sf-hero{margin-bottom:20px}.sf-hero h2{font-size:20px;font-weight:800;margin-bottom:2px}.sf-hero p{font-size:13px;color:var(--text-muted)}
.sf-filter{margin-bottom:16px}

.sf-list{display:flex;flex-direction:column;gap:12px}
.sf-card{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.sfc-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.sfc-teacher{display:flex;align-items:center;gap:10px}
.sfct-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0}
.sfct-name{font-size:14px;font-weight:600;color:var(--text-primary)}
.sfct-date{font-size:12px;color:var(--text-muted)}
.sfc-tags{display:flex;gap:6px;flex-shrink:0}

.sfc-body{font-size:14px;line-height:1.9;color:var(--text-secondary);white-space:pre-wrap}

/* 移动端：学科筛选按钮横向滚动，卡片标题标签换行 */
@media (max-width: 640px) {
  .sf-filter{overflow-x:auto;padding-bottom:4px}
  .sf-filter .el-radio-group{flex-wrap:nowrap;white-space:nowrap}
  .sfc-head{flex-direction:column;gap:8px}
}
</style>
