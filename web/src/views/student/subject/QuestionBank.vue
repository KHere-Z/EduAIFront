<template>
  <div class="qb-page" :class="{fullscreen: isFullscreen}">
    <template v-if="!isFullscreen">
      <div class="qb-hero"><div class="qb-emoji">🎯</div><h2>题库挑战</h2><p>错题复习 · 新题挑战 · 专注计时</p></div>
      <div class="qb-tabs">
        <span class="qbt" :class="{active:tab==='wrong'}" @click="tab='wrong'">📝 错题库</span>
        <span class="qbt" :class="{active:tab==='new'}" @click="tab='new'">🆕 待做题</span>
        <el-button type="warning" size="small" @click="enterFullscreen">⏱ 全屏自习模式</el-button>
      </div>
      <div class="qb-filter">
        <span class="qf-label">知识点：</span>
        <span class="kp-chip" v-for="kp in allKps" :key="kp" :class="{active:filterKps.includes(kp)}" @click="toggleKp(kp)">{{ kp }}</span>
      </div>
      <div class="qb-filter">
        <el-select v-model="filterMastery" placeholder="掌握度" clearable style="width:110px"><el-option label="未掌握" value="UNMASTERED"/><el-option label="熟悉中" value="FAMILIAR"/><el-option label="已掌握" value="MASTERED"/></el-select>
        <el-select v-model="filterDiff" placeholder="难度" clearable style="width:90px"><el-option label="简单" value="EASY"/><el-option label="中等" value="MEDIUM"/><el-option label="困难" value="HARD"/></el-select>
        <el-select v-model="filterGrade" placeholder="年级" clearable style="width:150px"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select>
      </div>
      <div class="qb-grid" v-if="filteredQuestions.length">
        <div class="q-card" v-for="(q,qi) in filteredQuestions" :key="q.id">
          <div class="qc-top">
            <el-tag size="small" :type="q.diffTag">{{ q.difficulty }}</el-tag>
            <el-tag size="small" :type="q.masteryTag" style="margin-left:4px">{{ q.masteryLabel }}</el-tag>
            <span v-if="q.errorType" class="qc-error">{{ q.errorType }}</span>
          </div>
          <div class="qc-title" @click="viewQuestion(q)">{{ q.title?.slice(0,60) }}{{ (q.title?.length||0) > 60 ? '...' : '' }}</div>
          <div class="qc-kps"><el-tag v-for="kp in q.kpNames" :key="kp" size="small" type="info" effect="plain" style="margin:1px">{{ kp }}</el-tag></div>
          <div class="qc-meta"><span class="qc-date">{{ q.date }}</span><el-button size="small" text type="primary" @click="viewQuestion(q)">查看解析</el-button></div>
        </div>
      </div>
      <el-empty v-else description="暂无题目" :image-size="100"/>

      <el-dialog v-model="showDetail" title="题目详情" width="600px">
        <div v-if="currentQ">
          <div class="d-header">
            <el-tag size="small" :type="currentQ.diffTag">{{ currentQ.difficulty }}</el-tag>
            <el-tag size="small" :type="currentQ.masteryTag" style="margin-left:6px">{{ currentQ.masteryLabel }}</el-tag>
            <el-tag v-for="kp in currentQ.kpNames" :key="kp" size="small" type="info" effect="plain" style="margin-left:4px">{{ kp }}</el-tag>
          </div>
          <div class="d-title">{{ currentQ.title }}</div>
          <div v-if="currentQ.imageUrl" class="d-image"><img :src="currentQ.imageUrl" style="max-width:100%;border-radius:8px"/></div>
          <el-divider/>
          <div class="d-section" v-if="currentQ.analysis"><h4>🔍 AI 分析</h4><p>{{ currentQ.analysis }}</p></div>
          <div class="d-section" v-if="currentQ.solution"><h4>📝 解答过程</h4><pre class="d-solution">{{ currentQ.solution }}</pre></div>
          <div class="d-section" v-if="currentQ.similarQuestions?.length"><h4>🎯 举一反三</h4><div v-for="(sq,i) in currentQ.similarQuestions" :key="i" class="d-similar">{{ i+1 }}. {{ sq }}</div></div>
          <div class="d-mastery"><span>掌握度：</span><el-radio-group v-model="currentQ.mastery" size="small" @change="updateMastery"><el-radio-button value="UNMASTERED">😰 未掌握</el-radio-button><el-radio-button value="FAMILIAR">🤔 熟悉中</el-radio-button><el-radio-button value="MASTERED">😎 已掌握</el-radio-button></el-radio-group></div>
          <div class="d-next"><el-button @click="goNextQuestion">下一题 →</el-button></div>
        </div>
      </el-dialog>
    </template>

    <template v-if="isFullscreen">
      <div class="fs-top"><span class="fs-timer">{{ elapsed }}</span><span class="fs-progress">{{ fsIdx+1 }}/{{ fsPool.length }}</span><el-button size="small" type="danger" text @click="exitFullscreen">退出 (ESC)</el-button></div>
      <div class="fs-wrap">
        <aside class="fs-sidebar">
          <div class="fs-side-title">📚 知识点</div>
          <div class="fs-kp-item" v-for="kp in fsKpList" :key="kp.name" :class="{active:fsActiveKp===kp.name}" @click="selectFsKp(kp.name)">
            <span class="fsk-name">{{ kp.name }}</span>
            <span class="fsk-count">{{ kp.count }}</span>
          </div>
        </aside>
        <div class="fs-body">
          <div class="fs-card" v-if="fsQuestion">
            <div class="fs-kps"><el-tag v-for="kp in fsQuestion.kpNames" :key="kp" size="small" type="info" effect="plain" style="margin:1px">{{ kp }}</el-tag></div>
            <div class="fs-q">{{ fsQuestion.title }}</div>
            <div class="fs-actions"><el-button size="large" type="success" @click="nextFsQuestion('MASTERED')">✅ 已掌握</el-button><el-button size="large" type="warning" @click="nextFsQuestion('FAMILIAR')">🤔 熟悉中</el-button><el-button size="large" type="danger" @click="nextFsQuestion('UNMASTERED')">😰 未掌握</el-button></div>
            <div class="fs-bottom"><el-button text type="primary" @click="showFsAnswer=!showFsAnswer">💡 查看解析</el-button><el-button text type="primary" @click="fsGoNext">下一题 →</el-button></div>
            <div class="fs-answer" v-if="showFsAnswer && fsQuestion.solution"><pre class="d-solution">{{ fsQuestion.solution }}</pre></div>
          </div>
          <el-empty v-else description="全部完成！🎉" :image-size="120"/>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from "element-plus"
import { getStudentWrongQuestions, getStudentNewQuestions } from "@/api/common/questions"
const tab = ref('wrong'); const filterKps = ref([]); const filterMastery = ref(''); const filterDiff = ref(''); const filterGrade = ref('')
const showDetail = ref(false); const currentQ = ref(null); const isFullscreen = ref(false); const fsQuestion = ref(null); const showFsAnswer = ref(false)
let fsIdx = 0; const fsPool = ref([]); const fsActiveKp = ref(''); const fsKpList = ref([])
onMounted(async () => { try { const wr = await getStudentWrongQuestions({ subject:"math", pageSize:200 }); const nw = await getStudentNewQuestions({ subject:"math", pageSize:200 }); const diffMap={EASY:{label:"简单",tag:"success"},MEDIUM:{label:"中等",tag:"warning"},HARD:{label:"困难",tag:"danger"}}; const mastMap={UNMASTERED:{label:"未掌握",tag:"danger"},FAMILIAR:{label:"熟悉中",tag:"warning"},MASTERED:{label:"已掌握",tag:"success"}}; const mapper = q => ({...q,kpNames:(q.knowledgePointNames||"").split(",").filter(Boolean),diffTag:diffMap[q.difficulty]?.tag||"info",masteryTag:mastMap[q.mastery]?.tag||"info",masteryLabel:mastMap[q.mastery]?.label||"未掌握",date:q.createdAt?.slice(0,10)||""}); questions.value = [...(wr.list||[]).map(q=>mapper({...q,type:"WRONG"})), ...(nw.list||[]).map(q=>mapper({...q,type:"NEW"}))] } catch {} })
const elapsed = ref('00:00'); let timer = null; let seconds = 0
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()
const studentGrade = computed(() => auth.user?.grade || '初三')
const grades = computed(() => {
  const g = studentGrade.value
  const all = ['初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期','高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']
  if (g === '初三') return all.filter(x => x.includes('初三'))
  if (g === '高三') return all.filter(x => x.includes('高三'))
  if (g === '高一') return all.filter(x => x.includes('高一'))
  if (g === '高二') return all.filter(x => x.includes('高二'))
  if (g === '初二') return all.filter(x => x.includes('初二'))
  return all.filter(x => x.includes(g) || (g==='初一' && x.includes('初一')))
})
const masteryMap = { UNMASTERED:{label:'未掌握',tag:'danger'}, FAMILIAR:{label:'熟悉中',tag:'warning'}, MASTERED:{label:'已掌握',tag:'success'} }
const questions = ref([
  { id:1, type:'WRONG', title:'已知二次函数 y=x²-4x+3, 求该函数的最小值及对应的 x 值。', knowledgePoints:['二次函数','最值问题'], gradeLevel:'初三·上学期', mastery:'FAMILIAR', masteryTag:'warning', masteryLabel:'熟悉中', difficulty:'MEDIUM', diffTag:'warning', errorType:'计算失误', date:'2026-07-03',
    analysis:'学生在配方过程中符号处理有误。x²-4x+3 = (x-2)²-1，当x=2时取最小值-1。',
    solution:'1. 配方: y=x²-4x+3=(x²-4x+4)-1=(x-2)²-1\n2. a=1>0,开口向上,有最小值\n3. 顶点(2,-1), min=-1 (x=2)',
    similarQuestions:['求 y=-x²+6x-5 的最大值','已知 y=a(x-h)²+k 过点(1,0)和(3,0),求h'] },
  { id:2, type:'WRONG', title:'解一元二次方程 2x²-5x+2=0', knowledgePoints:['一元二次方程','求根公式'], gradeLevel:'初三·上学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'EASY', diffTag:'success', errorType:'概念混淆', date:'2026-07-01',
    analysis:'混淆了求根公式中 a,b,c 的符号。x=(-b±√(b²-4ac))/2a。',
    solution:'a=2, b=-5, c=2\nΔ=(-5)²-4×2×2=25-16=9\nx=(5±3)/4\nx₁=2, x₂=1/2',
    similarQuestions:['解方程 x²-3x-10=0','解方程 3x²+4x-4=0'] },
  { id:3, type:'NEW', title:'在 Rt△ABC 中, ∠C=90°, AC=6, BC=8, 求 AB 的长及 sinA 的值。', knowledgePoints:['勾股定理','三角函数'], gradeLevel:'初三·下学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'EASY', diffTag:'success', date:'2026-07-02',
    solution:'AB=√(6²+8²)=10\nsinA=BC/AB=8/10=4/5' },
  { id:4, type:'NEW', title:'已知反比例函数 y=k/x 过点(2,-3), 求 k 的值及函数图像所在的象限。', knowledgePoints:['反比例函数'], gradeLevel:'初三·下学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'MEDIUM', diffTag:'warning', date:'2026-07-02',
    solution:'-3=k/2 → k=-6\nk<0, 图像在第二、四象限' },
  { id:5, type:'WRONG', title:'若关于 x 的方程 x²+(m-1)x+m²-1=0 有两个不相等的实数根, 求 m 的取值范围。', knowledgePoints:['一元二次方程','判别式','不等式'], gradeLevel:'初三·上学期', mastery:'FAMILIAR', masteryTag:'warning', masteryLabel:'熟悉中', difficulty:'HARD', diffTag:'danger', errorType:'审题不清', date:'2026-06-28',
    analysis:'判别式展开时出错。Δ=(m-1)²-4(m²-1)=m²-2m+1-4m²+4=-3m²-2m+5>0',
    solution:'Δ=(m-1)²-4(m²-1)=-3m²-2m+5>0\n→ 3m²+2m-5<0 → (3m+5)(m-1)<0\n→ -5/3<m<1',
    similarQuestions:['已知 x²+2kx+k²-4=0 有两个不等实根,求k'] }
])

const allKps = computed(() => [...new Set(questions.value.flatMap(q=>q.kpNames||[]))].sort())
function toggleKp(kp) { const i=filterKps.value.indexOf(kp); i>=0?filterKps.value.splice(i,1):filterKps.value.push(kp) }

const filteredQuestions = computed(() => questions.value.filter(q => {
  if (tab.value === 'wrong' && q.type !== 'WRONG') return false
  if (tab.value === 'new' && q.type !== 'NEW') return false
  const qKps = q.knowledgePoints || [q.knowledgePoint]
  if (filterKps.value.length && !filterKps.value.some(kp=>qKps.includes(kp))) return false
  if (filterMastery.value && q.mastery !== filterMastery.value) return false
  if (filterDiff.value && q.difficulty !== filterDiff.value) return false
  if (filterGrade.value && q.gradeLevel !== filterGrade.value) return false
  return true
}))

const filteredList = computed(() => filteredQuestions.value)
function viewQuestion(q) {
  currentQ.value = { ...q }; showDetail.value = true
  // 记录当前题目在列表中的位置
  currentQ.value._idx = filteredList.value.findIndex(x=>x.id===q.id)
}
function goNextQuestion() {
  const idx = currentQ.value?._idx; const list = filteredList.value
  if (idx >= 0 && idx < list.length - 1) { viewQuestion(list[idx + 1]) }
  else { ElMessage.info('已经是最后一题了'); showDetail.value = false }
}

// 从错题分析跳转过来 → 自动进入全屏模式聚焦该题
onMounted(() => {
  const focusTitle = sessionStorage.getItem('qb_focus_question')
  if (focusTitle) {
    sessionStorage.removeItem('qb_focus_question')
    const q = questions.value.find(x => x.title.includes(focusTitle.slice(0,20)))
    if (q) { tab.value = 'wrong'; enterFullscreen(); selectFsKp(q.knowledgePoints?.[0] || q.knowledgePoint); fsPool.value = [q]; fsIdx = 0; fsQuestion.value = q }
  }
})
function updateMastery() { ElMessage.success('掌握度已更新') }

function enterFullscreen() {
  isFullscreen.value = true; seconds = 0; elapsed.value = '00:00'; fsIdx = 0; showFsAnswer.value = false
  timer = setInterval(() => { seconds++; const m=Math.floor(seconds/60).toString().padStart(2,'0'); const s=(seconds%60).toString().padStart(2,'0'); elapsed.value=`${m}:${s}` }, 1000)
  // 构建知识点侧边栏列表（含题目数）
  const pool = filteredQuestions.value
  const kpMap = {}
  pool.forEach(q => { q.kpNames.forEach(kp => { if(!kpMap[kp]) kpMap[kp]=0; kpMap[kp]++ }) })
  fsKpList.value = Object.entries(kpMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)
  fsPool.value = pool; fsActiveKp.value = ''
  fsQuestion.value = pool.length ? pool[0] : null
  document.addEventListener('keydown', onKeyDown)
}
function selectFsKp(kpName) {
  fsActiveKp.value = kpName; fsIdx = 0; showFsAnswer.value = false
  fsPool.value = filteredQuestions.value.filter(q => q.kpNames.includes(kpName))
  fsQuestion.value = fsPool.value.length ? fsPool.value[0] : null
}
function exitFullscreen() { isFullscreen.value = false; clearInterval(timer); document.removeEventListener('keydown', onKeyDown) }
function onKeyDown(e) { if (e.key === 'Escape') exitFullscreen() }
function nextFsQuestion(mastery) {
  if (mastery && fsQuestion.value) { fsQuestion.value.mastery = mastery; fsQuestion.value.masteryTag = masteryMap[mastery].tag; fsQuestion.value.masteryLabel = masteryMap[mastery].label }
  fsGoNext()
}
function fsGoNext() {
  showFsAnswer.value = false; fsIdx++
  const pool = fsActiveKp.value ? fsPool.value : filteredQuestions.value
  fsQuestion.value = fsIdx < pool.length ? pool[fsIdx] : null
  if (!fsQuestion.value) exitFullscreen()
}
</script>
<style scoped>
.qb-page { max-width: 720px; margin: 0 auto; padding: 20px 14px 40px; }
.qb-hero { text-align: center; padding: 16px 0; }
.qb-emoji { font-size: 44px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.qb-hero h2 { font-size: 22px; font-weight: 800; margin: 6px 0 2px; }
.qb-hero p { font-size: 13px; color: #999; }
.qb-tabs { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.qbt { padding: 8px 18px; border-radius: 20px; font-size: 14px; cursor: pointer; background: rgba(255,255,255,.6); color: #666; transition: all .2s; font-weight: 500; }
.qbt:hover { background: #fff; }
.qbt.active { background: var(--color-primary); color: #fff; font-weight: 700; }
.qb-filter { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
.qf-label { font-size: 13px; color: #888; flex-shrink: 0; }
.kp-chip { padding: 4px 12px; border-radius: 14px; font-size: 12px; background: rgba(255,255,255,.6); border: 1px solid #e0e0e0; cursor: pointer; transition: all .15s; color: #666; }
.kp-chip:hover { border-color: var(--color-primary-light); color: var(--color-primary); }
.kp-chip.active { background: var(--color-primary-bg); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }
.qc-kps { margin-bottom: 8px; }
.qc-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #999; }
.d-next { text-align: center; margin-top: 16px; }
.qb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.q-card { background: #fff; border-radius: 14px; padding: 14px; cursor: pointer; transition: all .2s; box-shadow: 0 1px 8px rgba(0,0,0,.04); }
.q-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
.qc-top { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.qc-error { font-size: 11px; color: #EF4444; background: #FEF2F2; padding: 1px 8px; border-radius: 10px; }
.qc-title { font-size: 14px; color: #333; line-height: 1.6; margin-bottom: 10px; }
.qc-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.d-header { margin-bottom: 12px; }
.d-title { font-size: 16px; font-weight: 600; line-height: 1.8; margin-bottom: 12px; }
.d-image { margin-bottom: 12px; }
.d-section { margin-bottom: 14px; }
.d-section h4 { font-size: 14px; margin-bottom: 6px; }
.d-section p, .d-section pre { font-size: 14px; color: #555; line-height: 1.8; }
.d-solution { background: #F0FDF4; padding: 12px; border-radius: 10px; font-family: monospace; white-space: pre-wrap; }
.d-similar { padding: 6px 0; font-size: 13px; color: #555; }
.d-mastery { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.qb-page.fullscreen { max-width: 100%; min-height: 100vh; background: linear-gradient(160deg,#F0F4FF,#FCE4EC,#FFF8E1); display: flex; flex-direction: column; }
.fs-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: rgba(255,255,255,.75); backdrop-filter: blur(12px); }
.fs-timer { font-size: 28px; font-weight: 700; font-family: monospace; color: var(--color-primary); }
.fs-label { font-size: 14px; color: #888; }
.fs-wrap { flex: 1; display: flex; overflow: hidden; }
.fs-sidebar { width: 180px; background: rgba(255,255,255,.7); padding: 16px 12px; overflow-y: auto; flex-shrink: 0; }
.fs-side-title { font-size: 14px; font-weight: 700; color: #555; margin-bottom: 10px; }
.fs-kp-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 10px; cursor: pointer; font-size: 13px; color: #666; transition: all .15s; margin-bottom: 2px; }
.fs-kp-item:hover { background: var(--color-primary-bg); color: var(--color-primary); }
.fs-kp-item.active { background: var(--color-primary-bg); color: var(--color-primary); font-weight: 700; }
.fsk-count { font-size: 11px; background: #eee; padding: 2px 8px; border-radius: 10px; color: #999; }
.fs-kp-item.active .fsk-count { background: var(--color-primary); color: #fff; }
.fs-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; overflow-y: auto; }
.fs-card { max-width: 600px; width: 100%; text-align: center; background: rgba(255,255,255,.7); padding: 48px 32px; border-radius: 28px; box-shadow: 0 8px 32px rgba(0,0,0,.06); }
.fs-kps { margin-bottom: 12px; }
.fs-q { font-size: 20px; line-height: 2; margin-bottom: 32px; color: #333; }
.fs-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.fs-bottom { display: flex; gap: 16px; justify-content: center; margin-top: 12px; }
.fs-answer { margin-top: 20px; text-align: left; background: rgba(255,255,255,.8); padding: 16px; border-radius: 16px; }
.fs-answer pre { color: #555; font-size: 14px; line-height: 1.8; white-space: pre-wrap; font-family: monospace; }
.fs-progress { font-size: 14px; color: #888; }
@media (max-width: 480px) { .qb-grid { grid-template-columns: 1fr; } }
</style>
