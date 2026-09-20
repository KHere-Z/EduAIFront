<template>
  <div class="dash">
    <div class="welcome">
      <div class="w-emoji">🌟</div>
      <h1>Hi, {{ auth.user?.realName || '同学' }}!</h1>
      <p>今天也要加油学习哦～</p>
      <div class="streak-wrap" @click="showCheckin = true">
        <div class="streak-btn" :class="{bounce: justChecked}">
          <span class="streak-fire">🔥</span><span class="streak-num">{{ streak }}</span><span class="streak-label">连续打卡</span>
        </div>
        <span class="streak-hint" v-if="!checkedToday">👆 点我打卡</span>
        <span class="streak-hint done" v-else>✅ 今日已打卡</span>
      </div>
    </div>

    <el-dialog v-model="showCheckin" title="🔥 学习打卡" width="380px">
      <div class="cal-top"><el-button size="small" text @click="calMonth--;calMonth<0&&(calYear--,calMonth=11)"><el-icon><ArrowLeft/></el-icon></el-button><strong>{{ calYear }}年{{ calMonth+1 }}月</strong><el-button size="small" text @click="calMonth++;calMonth>11&&(calYear++,calMonth=0)"><el-icon><ArrowRight/></el-icon></el-button></div>
      <div class="mini-cal"><div class="mch" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</div><div v-for="(c,i) in calCells" :key="i" class="mcc" :class="{mct:c.isToday,mok:c.checked,mot:c.isToday&&!c.checked}">{{ c.day }}<span v-if="c.checked" class="mdot">✓</span></div></div>
      <div class="checkin-info"><p>本月打卡 <strong>{{ monthChecked }}</strong> 天 · 累计 <strong>{{ totalDays }}</strong> 天</p><p class="milestone" v-if="streak%7===0&&streak>0">🎆 连续{{ streak }}天里程碑！</p></div>
      <template #footer><el-button v-if="!checkedToday" type="primary" size="large" class="checkin-btn" @click="doCheckinHandler">📝 今日打卡</el-button><el-tag v-else type="success" size="large">✅ 今日已打卡</el-tag></template>
    </el-dialog>

    <div class="fireworks" v-if="showFireworks"><div class="fw" v-for="i in 30" :key="i" :style="{left:rand()+'%',top:rand()+'%',animationDelay:Math.random()*2+'s',background:fwColors[i%5]}"></div></div>

    <h3 class="sec-title">📚 我的学科</h3>
    <div class="subject-grid" v-if="subjects.length">
      <div class="s-card" v-for="s in subjects" :key="s.value" @click="$router.push('/student/subject/'+s.value)" :style="{background:s.bg}">
        <span class="sc-emoji">{{ s.icon }}</span>
        <span class="sc-label">{{ s.label }}</span>
      </div>
    </div>
    <el-empty v-else-if="teacherState==='linked'" description="暂无报名科目" :image-size="80" style="margin:20px 0" />
    <div v-else class="guide-card">
      <p class="gc-title">{{ teacherState==='pending' ? '关联请求已发送，等待老师确认' : '还没有关联老师' }}</p>
      <p class="gc-sub" v-if="teacherState==='pending'">老师确认后，你的学科和课程会自动出现在这里。</p>
      <p class="gc-sub" v-else>学生端不能自助报名。把下面的 UID 发给老师，让老师添加你；也可以在「个人中心 → 添加老师」里用老师的 UID 发起申请。</p>
      <p class="gc-uid">我的 UID：<strong>{{ uidDisplay }}</strong><el-button size="small" text type="primary" @click="copyUid">📋 复制</el-button><el-button size="small" type="primary" plain @click="$router.push('/student/profile')">去个人中心</el-button></p>
    </div>

    <h3 class="sec-title">📅 今日课程</h3>
    <div v-if="todayClasses.length" class="class-list">
      <div class="class-item" v-for="c in todayClasses" :key="c.id">
        <div class="ci-left"><span class="ci-time">{{ c.startTime||c.start }}:00-{{ c.endTime||c.end }}:00</span><el-tag size="small">{{ c.subject }}</el-tag></div>
        <span class="ci-teacher">{{ c.teacherName||c.teacher }}</span>
      </div>
    </div>
    <div v-else-if="teacherState==='linked'" class="empty-class">🎉 今天没有课，自由安排时间吧～</div>
    <div v-else class="empty-class guide">
      {{ teacherState==='pending' ? '关联请求已发送，老师确认后课程会出现在这里' : '还没有关联老师，关联后课程会出现在这里' }}
      <el-button size="small" text type="primary" @click="$router.push('/student/profile')">去关联</el-button>
    </div>
    <div class="schedule-link" @click="$router.push('/student/schedule')">📅 查看完整课表 →</div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'; import { useAuthStore } from '@/store/auth'; import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getStreak, doCheckin as apiCheckin, getSchedule } from '@/api/common/student'
import { localDate } from '@/utils/date'
import http from '@/api/request'
const auth = useAuthStore()
const streak = ref(0); const totalDays = ref(0); const checkedToday = ref(false); const justChecked = ref(false)
const showCheckin = ref(false); const showFireworks = ref(false)
const calYear = ref(new Date().getFullYear()); const calMonth = ref(new Date().getMonth())
const checkinDates = ref([])
const todayClasses = ref([])

// 空态要说人话：学生注册即有档案但无课，不能替他断言「今天没有课」。
// 用「是否已关联老师」区分两种情况——老师的「我的学生」和学生端的「我的老师」是同一个接口。
// 默认 linked：关联信息拿不到时保持中性文案，不凭空喊「还没关联老师」。
const teacherState = ref('linked')
const uidDisplay = computed(() => String(auth.user?.uid || auth.user?.id || '').padStart(8, '0'))
async function copyUid() {
  try { await navigator.clipboard.writeText(uidDisplay.value); ElMessage.success('UID 已复制') }
  catch { ElMessage.warning(`复制失败，请手动记下：${uidDisplay.value}`) }
}
async function loadTeacherState() {
  try {
    // silent：这是首页的装饰性判断，拿不到就不显示引导，不该弹红条
    const r = await http.get('/relations', { params: { type: 'teacher_student' }, silent: true })
    const list = Array.isArray(r) ? r : (Array.isArray(r?.list) ? r.list : [])
    teacherState.value = list.some(x => x.status === 'accepted') ? 'linked' : (list.length ? 'pending' : 'none')
  } catch {}
}

onMounted(async () => {
  try { const r = await getStreak(); streak.value = r.streak||0; totalDays.value = r.totalDays||0; checkedToday.value = r.checkedInToday||false; checkinDates.value = r.checkinDates||[] } catch {}
  const now = new Date()
  try { const s = await getSchedule({year:now.getFullYear(),month:now.getMonth()+1}); todayClasses.value = (s.schedules||[]).filter(x=>x.classDate===today) } catch {}
  loadTeacherState()
})
const today = localDate()
const fwColors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF8E53']
function rand(){ return Math.random()*100 }
const monthChecked = computed(() => checkinDates.value.filter(d=>d.startsWith(`${calYear.value}-${String(calMonth.value+1).padStart(2,'0')}`)).length)
const calCells = computed(() => {
  const y=calYear.value;const m=calMonth.value;const fd=new Date(y,m,1).getDay();const dim=new Date(y,m+1,0).getDate()
  const cs=[];const pds=new Date(y,m,0).getDate()
  for(let i=fd-1;i>=0;i--)cs.push({day:pds-i,isToday:false,checked:false})
  for(let d=1;d<=dim;d++){const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;cs.push({day:d,isToday:ds===today,checked:checkinDates.value.includes(ds)})}
  for(let d=1;cs.length<42;d++)cs.push({day:d,isToday:false,checked:false});return cs
})
async function doCheckinHandler(){if(checkedToday.value)return;try{await apiCheckin();checkedToday.value=true;streak.value++;checkinDates.value.push(today);justChecked.value=true;setTimeout(()=>justChecked.value=false,600);if(streak.value%7===0){showFireworks.value=true;setTimeout(()=>showFireworks.value=false,3000)}}catch(e){ElMessage.error(e.message||'打卡失败')}}
const zh2en = { '语文':'chinese','数学':'math','英语':'english','物理':'physics','化学':'chemistry','生物':'biology','历史':'history','政治':'politics','地理':'geography' }
const icons = { '语文':'📝','数学':'📐','英语':'📖','物理':'⚛️','化学':'🧪','生物':'🧬','历史':'📜','政治':'⚖️','地理':'🌍' }
const colors = ['linear-gradient(135deg,#FFE4E1,#FFCDD2)','linear-gradient(135deg,#FFF0DB,#FFE0B2)','linear-gradient(135deg,#E8F5E9,#C8E6C9)','linear-gradient(135deg,#E3F2FD,#BBDEFB)','linear-gradient(135deg,#F3E5F5,#E1BEE7)','linear-gradient(135deg,#FFF9C4,#FFF176)','linear-gradient(135deg,#F1F8E9,#DCEDC8)','linear-gradient(135deg,#EDE7F6,#D1C4E9)','linear-gradient(135deg,#FFF3E0,#FFCCBC)']
// 原来写作 `subjects || enrolledSubjects`，但 `[]` 是 truthy：学生若被返回 subjects: []（新建档案时
// subjects 就是留空的），enrolledSubjects 永远轮不到，学科宫格会误报「暂无」。
// 改为「非空才优先」，空数组不再遮蔽另一来源。
const enrolled = computed(() => {
  const s = auth.user?.subjects, e = auth.user?.enrolledSubjects
  return (Array.isArray(s) && s.length) ? s : (Array.isArray(e) ? e : [])
})
const subjects = computed(() => enrolled.value.filter(s => zh2en[s]).map((s,i) => ({ value:zh2en[s], label:s, icon:icons[s]||'📚', bg:colors[i%9], progress: Math.floor(Math.random()*40+30) })))
</script>
<style scoped>
.dash { max-width: 560px; margin: 0 auto; padding: 20px 14px 40px; }
.welcome { text-align: center; padding: 24px 12px 16px; }
.w-emoji { font-size: 44px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.welcome h1 { font-size: 24px; font-weight: 800; margin: 6px 0 2px; background: linear-gradient(135deg,#6366F1,#EC4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.welcome p { font-size: 14px; color: #888; margin: 0; }
.streak-wrap{display:inline-block;cursor:pointer;text-align:center}.streak-btn{display:inline-flex;align-items:center;gap:4px;padding:8px 20px;background:linear-gradient(135deg,#FF6B6B,#FF8E53);color:#fff;border-radius:24px;font-weight:700;transition:all .2s;box-shadow:0 4px 16px rgba(255,107,107,.3)}.streak-btn:hover{transform:scale(1.05)}.streak-btn.bounce{animation:pop .6s ease}@keyframes pop{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}.streak-fire{font-size:20px}.streak-num{font-size:22px}.streak-label{font-size:11px;opacity:.9;margin-left:2px}.streak-hint{display:block;font-size:12px;color:#FF6B6B;margin-top:4px;animation:pulse 1.5s infinite}.streak-hint.done{color:#4CAF50;animation:none}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.cal-top{display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:12px}.mini-cal{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:4px}.mch{font-size:11px;color:#999;padding:4px 0}.mcc{padding:8px 0;border-radius:8px;font-size:14px;color:#666;position:relative}.mcc.mct{background:var(--color-primary);color:#fff;font-weight:700;border-radius:50%;width:32px;height:32px;line-height:32px;margin:0 auto;padding:0}.mcc.mok{background:#E8F5E9;color:#4CAF50;font-weight:600}.mcc.mot{background:#FFF3E0;border:2px dashed #FF9800;font-weight:700}.mdot{position:absolute;bottom:1px;right:50%;transform:translateX(50%);font-size:10px;color:#4CAF50}.checkin-info{text-align:center;margin-top:14px}.checkin-info p{margin:4px 0;font-size:14px}.milestone{color:#FF6B6B;font-weight:700;font-size:16px!important}.checkin-btn{width:100%}.fireworks{position:fixed;inset:0;z-index:9999;pointer-events:none}.fw{position:absolute;width:8px;height:8px;border-radius:50%;animation:firework 2s ease-out forwards}@keyframes firework{0%{transform:scale(0);opacity:1}100%{transform:scale(6);opacity:0}}
.sec-title { font-size: 18px; font-weight: 700; margin: 20px 0 12px; }
.subject-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.s-card { padding: 20px 10px; border-radius: 20px; text-align: center; cursor: pointer; transition: all .2s; box-shadow: 0 2px 12px rgba(0,0,0,.04); position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.s-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.sc-emoji { font-size: 32px; }
.sc-label { font-size: 14px; font-weight: 700; color: #333; }
.class-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-radius: 16px; background: rgba(255,255,255,.7); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,.04); margin-bottom: 8px; }
.ci-left { display: flex; align-items: center; gap: 10px; }
.ci-time { font-size: 14px; font-weight: 600; color: var(--color-primary); }
.ci-teacher { font-size: 13px; color: #888; }
.empty-class { text-align: center; padding: 24px; color: #999; font-size: 14px; }
/* 空态分叉：已关联老师→中性文案；未关联/待确认→可执行引导（老师端同款口径） */
.empty-class.guide { color: var(--text-secondary); }
.guide-card { margin: 20px 0; padding: 20px 24px; border-radius: 16px; background: rgba(255,255,255,.6); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,.05); text-align: center; }
.gc-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.gc-sub { font-size: 13px; color: var(--text-muted); line-height: 1.7; max-width: 520px; margin: 0 auto 10px; }
.gc-uid { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; }
.gc-uid strong { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 15px; color: var(--color-primary); letter-spacing: 1px; }
.schedule-link { text-align: center; padding: 12px; margin: 8px 0; border-radius: 16px; background: rgba(255,255,255,.6); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,.05); font-size: 14px; color: var(--color-primary); cursor: pointer; transition: all .2s; font-weight: 500; }
.schedule-link:hover { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
@media (max-width: 480px) { .subject-grid { grid-template-columns: 1fr 1fr 1fr; gap: 8px; } .s-card { padding: 16px 8px; } .sc-emoji { font-size: 26px; } .sc-label { font-size: 12px; } }
</style>
