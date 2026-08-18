<template>
  <div class="kp-page">
    <router-link to="/student/subject/math" class="back-link">← 返回学科中心</router-link>
    <div class="kp-hero"><div class="kp-emoji">📖</div><h2>知识点整理</h2><p>当前阶段：{{ studentGrade }} · {{ stageGrades.length>1?'全阶段总复习(共'+semesters.length+'学期)':'按学期整理' }}</p></div>

    <div class="kp-filter"><el-select v-model="filterSemester" placeholder="学期" clearable style="width:160px"><el-option v-for="s in semesters" :key="s" :label="s" :value="s"/></el-select></div>

    <div class="kp-list" v-if="groupedKps.length">
      <div class="kp-group" v-for="g in filteredGroups" :key="g.semester">
        <div class="kp-group-header" @click="toggleSemester(g.semester)">
          <span class="kpg-toggle" :class="{ open: !collapsed.has(g.semester) }">▸</span>
          <span>{{ g.semester }}</span>
          <span class="kp-count">{{ g.items.length }}个知识点</span>
        </div>
        <div class="kp-items" v-show="!collapsed.has(g.semester)">
          <div class="kp-item" v-for="kp in g.items" :key="kp.id" @click="viewKp(kp)">
            <span class="kpi-num">{{ kp.id }}</span>
            <div class="kpi-info"><span class="kpi-name">{{ kp.name }}</span></div>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无知识点数据" :image-size="100"/>

  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { getKnowledgePoints } from '@/api/common/knowledge'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const auth = useAuthStore()
const router = useRouter()
const subject = computed(() => route.params.subject || 'math')
const studentGrade = computed(() => auth.user?.grade || '初三')

// 毕业年级：展示全阶段知识点
const stageGrades = computed(() => {
  const g = studentGrade.value
  if (g === '初三') return ['初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期']
  if (g === '高三') return ['高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']
  if (g === '六年级') return ['六年级·上学期','六年级·下学期']
  // 非毕业年级：展示当前年级上下学期
  if (g) return [`${g}·上学期`,`${g}·下学期`]
  // 未知年级：默认初一上学期
  return ['初一·上学期']
})

const semesters = computed(() => {
  return semesterOrder.filter(s => stageGrades.value.includes(s))
})

const filterSemester = ref('')
const kps = ref([])
const collapsed = ref(new Set())

function toggleSemester(semester) {
  if (collapsed.value.has(semester)) {
    collapsed.value.delete(semester)
  } else {
    collapsed.value.add(semester)
  }
  // 触发响应式更新
  collapsed.value = new Set(collapsed.value)
}

onMounted(async () => {
  try {
    const r = await getKnowledgePoints({ subject:'math', pageSize:200 })
    kps.value = (r?.list||[]).map(k => ({ ...k, semester: k.gradeLevel }))
    // 默认只展开第一个学期
    const semesters = [...new Set(kps.value.map(k => k.semester))]
    semesters.forEach((s,i) => { if (i > 0) collapsed.value.add(s) })
  } catch (e) {
    console.error('知识点加载失败:', e.message||e)
  }
})

// 学期固定排序
const semesterOrder = ['六年级·上学期','六年级·下学期','初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期','高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']

// 按学期分组
const groupedKps = computed(() => {
  const map = {}
  kps.value.forEach(kp => { const s = kp.semester; if(!map[s]) map[s]=[]; map[s].push(kp) })
  return Object.entries(map)
    .map(([semester,items]) => ({ semester, items }))
    .sort((a,b) => semesterOrder.indexOf(a.semester) - semesterOrder.indexOf(b.semester))
})
const filteredGroups = computed(() => {
  if (!filterSemester.value) return groupedKps.value
  return groupedKps.value.filter(g => g.semester === filterSemester.value)
})

function viewKp(kp) {
  router.push(`/student/subject/${subject.value}/knowledge-points/${kp.id}`)
}


</script>
<style scoped>
.kp-page { max-width: 600px; margin: 0 auto; padding: 20px 14px 40px; }
.kp-hero { text-align: center; padding: 16px 0; }
.kp-emoji { font-size: 44px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.kp-hero h2 { font-size: 22px; font-weight: 800; margin: 6px 0 2px; }
.kp-hero p { font-size: 13px; color: #999; }
.kp-filter { margin-bottom: 16px; }
.kp-group { margin-bottom: 16px; }
.kp-group-header { font-size: 16px; font-weight: 700; color: #333; margin-bottom: 8px; padding: 8px 12px; background: rgba(255,255,255,.6); border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; user-select: none; transition: background .15s; }
.kp-group-header:hover { background: rgba(255,255,255,.85); }
.kpg-toggle { display: inline-block; transition: transform .2s; font-size: 12px; color: #999; }
.kpg-toggle.open { transform: rotate(90deg); }
.kp-count { font-size: 12px; color: #999; font-weight: 400; margin-left: 8px; }
.kp-items { display: flex; flex-direction: column; gap: 4px; }
.kp-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fff; border-radius: 12px; cursor: pointer; transition: all .15s; box-shadow: 0 1px 4px rgba(0,0,0,.03); }
.kp-item:hover { background: var(--color-primary-bg); }
.kpi-num { width: 26px; height: 26px; border-radius: 50%; background: var(--color-primary-bg); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.kpi-info { flex: 1; }
.kpi-name { font-size: 14px; color: #333; font-weight: 500; }
.kpi-arrow { color: #ccc; flex-shrink: 0; }
</style>
