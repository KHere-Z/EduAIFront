<template>
  <div class="sc-page">
    <div class="sc-hero">
      <h2>🏆 我的成绩</h2>
      <p>各学科考试成绩追踪</p>
    </div>

    <!-- 学科卡片 -->
    <div class="sc-grid" v-if="subjectCards.length">
      <div v-for="s in subjectCards" :key="s.subject" class="sc-card" @click="goSubject(s.subject)">
        <div class="scc-top">
          <span class="scc-emoji">{{ s.icon }}</span>
          <div class="scc-info">
            <span class="scc-name">{{ s.name }}</span>
            <span class="scc-count">{{ s.total }} 次考试</span>
          </div>
        </div>
        <div class="scc-bottom">
          <div class="scc-stat">
            <span class="sccs-label">最近</span>
            <span class="sccs-value" :style="{color:scoreColor(s.latest)}">{{ s.latest || '-' }}</span>
          </div>
          <div class="scc-stat">
            <span class="sccs-label">最高</span>
            <span class="sccs-value green">{{ s.max || '-' }}</span>
          </div>
          <div class="scc-stat">
            <span class="sccs-label">均分</span>
            <span class="sccs-value">{{ s.avg || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无考试成绩" :image-size="100"/>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" :title="subjMap[currentSubject]||'学科成绩'" width="760px" destroy-on-close>
      <div v-if="chartData.length > 1" class="scd-chart">
        <h4>📈 成绩趋势</h4>
        <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="scd-svg">
          <line v-for="i in 5" :key="'g'+i" :x1="50" :y1="20+(i-1)*(chartH-60)/4" :x2="chartW-10" :y2="20+(i-1)*(chartH-60)/4" stroke="#eee" stroke-width="0.5"/>
          <text v-for="i in 5" :key="'y'+i" :x="44" :y="24+(i-1)*(chartH-60)/4" text-anchor="end" font-size="10" fill="#999">{{ Math.round(yMax-(i-1)*yStep) }}</text>
          <text v-for="(d,i) in chartData" :key="'x'+i" :x="xPos(i)" :y="chartH-4" text-anchor="middle" font-size="9" fill="#999">{{ d.label }}</text>
          <polyline :points="linePoints" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linejoin="round"/>
          <circle v-for="(d,i) in chartData" :key="'c'+i" :cx="xPos(i)" :cy="yPos(d.score)" r="4" fill="#fff" stroke="#6366F1" stroke-width="2"/>
          <text v-for="(d,i) in chartData" :key="'t'+i" :x="xPos(i)" :y="yPos(d.score)-10" text-anchor="middle" font-size="10" fill="#6366F1" font-weight="600">{{ d.score }}</text>
        </svg>
      </div>
      <div class="scd-list" v-if="subjectExams.length">
        <div v-for="e in subjectExams" :key="e.id" class="scd-item">
          <div class="scdi-left">
            <span class="scdi-type">{{ e.examType||'考试' }}</span>
            <span class="scdi-date">{{ e.createdAt?.slice(0,10) }}</span>
          </div>
          <span class="scdi-score" :style="{color:scoreColor(e.score)}">{{ e.score||'-' }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无记录" :image-size="80"/>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/request'

const router = useRouter()
const exams = ref([])
const showDetail = ref(false)
const currentSubject = ref('')
const subjMap = {math:'数学',chinese:'语文',english:'英语',physics:'物理',chemistry:'化学',biology:'生物',history:'历史',politics:'政治',geography:'地理'}
const icons = {math:'📐',chinese:'📝',english:'📖',physics:'⚛️',chemistry:'🧪',biology:'🧬',history:'📜',politics:'⚖️',geography:'🌍'}

const subjectCards = computed(() => {
  const map = {}
  exams.value.forEach(e => {
    const s = e.subject
    if (!map[s]) map[s] = []
    if (e.score != null && !isNaN(+e.score)) map[s].push(+e.score)
  })
  return Object.entries(map).map(([s, scores]) => ({
    subject:s, name:subjMap[s]||s, icon:icons[s]||'📚',
    total:scores.length, latest:scores[scores.length-1],
    max:Math.max(...scores), avg:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)
  }))
})

const subjectExams = computed(() => exams.value.filter(e=>e.subject===currentSubject.value).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')))

// 图表
const chartData = computed(() => subjectExams.value.filter(e=>e.score!=null&&!isNaN(+e.score)).map(e=>({
  label:(e.examType||'')+'\n'+(e.createdAt||'').slice(5),
  score:+e.score
})))
const chartW=520,chartH=240
const yMax=computed(()=>Math.max(100,Math.ceil((Math.max(...chartData.value.map(d=>d.score),0)+10)/10)*10))
const yStep=computed(()=>Math.round(yMax.value/4))
const xPos=(i)=>chartData.value.length>1?50+(i/(chartData.value.length-1))*(chartW-60):chartW/2
const yPos=(s)=>20+(1-s/yMax.value)*(chartH-60)
const linePoints=computed(()=>chartData.value.map((d,i)=>`${xPos(i)},${yPos(d.score)}`).join(' '))

function scoreColor(s) { const v=+s; return v>=90?'#10B981':v>=60?'#F59E0B':'#EF4444' }

function goSubject(s) { currentSubject.value=s; showDetail.value=true }

onMounted(async () => {
  try { const r = await http.get('/student/exam-papers'); exams.value = r?.list||r||[] } catch {}
})
</script>

<style scoped>
.sc-page{max-width:720px;margin:0 auto;padding:20px 14px 40px}
.sc-hero{margin-bottom:20px}.sc-hero h2{font-size:20px;font-weight:800;margin-bottom:2px}.sc-hero p{font-size:13px;color:var(--text-muted)}

.sc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.sc-card{padding:20px 18px;border-radius:14px;background:#fff;cursor:pointer;transition:all .2s;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border-light)}
.sc-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08);border-color:var(--color-primary-light)}
.scc-top{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.scc-emoji{font-size:28px}.scc-name{font-size:15px;font-weight:700;display:block;color:var(--text-primary)}.scc-count{font-size:11px;color:var(--text-muted)}
.scc-bottom{display:flex;gap:16px}.scc-stat{text-align:center;flex:1}.sccs-label{font-size:11px;color:var(--text-muted);display:block}.sccs-value{font-size:20px;font-weight:700}.sccs-value.green{color:#10B981}

/* 图表 */
.scd-chart{background:#fff;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid var(--color-border-light)}
.scd-chart h4{font-size:14px;font-weight:700;margin-bottom:8px;color:var(--text-primary)}
.scd-svg{width:100%;height:auto;max-height:260px}
.scd-list{display:flex;flex-direction:column;gap:6px}
.scd-item{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;background:var(--color-bg);border:1px solid var(--color-border-light)}
.scdi-type{font-size:14px;color:var(--text-primary);font-weight:500}.scdi-date{font-size:11px;color:var(--text-muted);margin-left:10px}
.scdi-score{font-size:22px;font-weight:700}

/* 移动端：学科卡改 2 列，弹窗内容收窄 */
@media (max-width: 640px) {
  .sc-grid{grid-template-columns:1fr 1fr;gap:10px}
  .sc-card{padding:16px 12px}
  .scc-bottom{gap:8px}
  .sccs-value{font-size:17px}
}
</style>
