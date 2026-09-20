<template><div class="page-container"><div class="page-header"><div><h2>📅 课程表</h2><p>高亮日期为上课日 · 点击查看详情 · 可申请调课</p></div></div><el-row :gutter="20"><el-col :xs="24" :sm="14"><el-card><template #header><div style="display:flex;justify-content:space-between"><span class="card-title">{{ y }}年{{ m+1 }}月</span><div><el-button size="small" text @click="pm"><el-icon><ArrowLeft/></el-icon></el-button><el-button size="small" text @click="nm"><el-icon><ArrowRight/></el-icon></el-button></div></div></template><div class="cal"><div class="ch" v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</div><div v-for="(c,i) in cells" :key="i" class="cc" :class="c.cls" @click="c.has&&sel(c.date)"><span class="cd">{{ c.day }}</span><span v-if="c.has" class="dot"/></div></div></el-card></el-col><el-col :xs="24" :sm="10"><el-card><template #header><span class="card-title">{{ sd||'选择日期' }}</span></template><div v-if="day.length"><div v-for="c in day" :key="c.sessionId" class="di"><div class="dt">🕐 {{ c.startTime }}-{{ c.endTime }}</div><el-tag size="small">{{ c.subject }}</el-tag> <strong>{{ c.teacherName }}</strong><el-button size="small" type="warning" style="margin-left:8px" @click="reschedule(c)">申请调课</el-button></div></div><el-empty v-else description="无课程" :image-size="80"/></el-card></el-col></el-row><el-dialog v-model="showR" title="申请调课" width="380px"><el-form label-width="80px" label-position="top"><el-form-item label="原上课时间"><div class="old-time">{{ rt?.start }} — {{ rt?.end }}</div></el-form-item><el-form-item label="新日期"><el-date-picker v-model="rd" type="date" value-format="YYYY-MM-DD" style="width:100%"/></el-form-item><el-form-item label="新时间段"><div class="time-row"><el-time-select v-model="rs" start="08:00" step="00:15" end="21:00" placeholder="开始" style="width:100%"/><span class="time-dash">—</span><el-time-select v-model="re" start="08:00" step="00:15" end="21:00" placeholder="结束" style="width:100%"/></div></el-form-item><el-form-item label="调课原因"><el-input v-model="rr" type="textarea" :rows="2" placeholder="请简单说明原因"/></el-form-item></el-form><template #footer><el-button @click="showR=false">取消</el-button><el-button type="primary" @click="submitR">提交申请</el-button></template></el-dialog></div></template>
<script setup>import { ref,computed,onMounted } from 'vue';import { ElMessage } from 'element-plus';import { ArrowLeft,ArrowRight } from '@element-plus/icons-vue';import { getSchedule, submitReschedule } from '@/api/common/student';import { localDate } from '@/utils/date'
const _now=new Date();const y=ref(_now.getFullYear());const m=ref(_now.getMonth());const sd=ref('');const showR=ref(false);const rt=ref(null);const rd=ref('');const rs=ref('14');const re=ref('16');const rr=ref('')
const rawSchedules=ref([])
// 取数跟着表头走：月份一变就重取。原来只在 onMounted 取一次固定的 {year:2026,month:7}，
// 箭头只改标题，课程永远停在初始那个月。
let reqId=0
async function loadMonth(){
  const id=++reqId
  try{const r=await getSchedule({year:y.value,month:m.value+1});if(id!==reqId)return;rawSchedules.value=r.schedules||[]}
  catch{if(id===reqId)rawSchedules.value=[]}   // 连点箭头时丢弃过期响应，别让旧月份盖掉新月份
}
function monthMove(delta){
  const d=new Date(y.value,m.value+delta,1)   // 借 Date 处理跨年：1月再往前是上一年12月
  y.value=d.getFullYear();m.value=d.getMonth();sd.value='';loadMonth()
}
function pm(){monthMove(-1)};function nm(){monthMove(1)}
onMounted(loadMonth)
const today=localDate()
const cells=computed(()=>{const yy=y.value;const mm=m.value;const fd=new Date(yy,mm,1).getDay();const dim=new Date(yy,mm+1,0).getDate();const cs=[];const pds=new Date(yy,mm,0).getDate()
for(let i=fd-1;i>=0;i--)cs.push({day:pds-i,cur:false,has:false,cls:{}})
for(let d=1;d<=dim;d++){const ds=`${yy}-${String(mm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const has=rawSchedules.value.some(x=>x.classDate===ds);cs.push({day:d,cur:true,has,date:ds,cls:{ct:ds===today,cf:has&&ds>=today,cp:has&&ds<today,ca:ds===sd.value}})}
for(let d=1;cs.length<42;d++)cs.push({day:d,cur:false,has:false,cls:{}});return cs})
const day=computed(()=>sd.value?rawSchedules.value.filter(x=>x.classDate===sd.value):[])
function sel(d){sd.value=d}
function reschedule(c){rt.value=c;rd.value=sd.value;rs.value=c.startTime;re.value=c.endTime;rr.value='';showR.value=true}
async function submitR(){
  try {
    await submitReschedule({sessionId:rt.value?.sessionId,requestedDate:rd.value,requestedStart:rs.value,requestedEnd:re.value,reason:rr.value})
    ElMessage.success('已提交');showR.value=false
  } catch(e) { ElMessage.error(e.message||'失败') }
}
</script>
<style scoped>.card-title{font-weight:600}.cal{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}.ch{padding:8px 0;font-size:12px;color:var(--text-muted);font-weight:600}.cc{padding:6px 0;min-height:44px;border-radius:var(--radius-sm);position:relative;font-size:13px}.cc:hover{background:var(--color-bg-alt)}.cc.cf{cursor:pointer}.cc.cf .cd{color:#EF4444;font-weight:700}.cc.cp .cd{color:#10B981}.cc.ct .cd{background:var(--color-primary);color:#fff;border-radius:50%;display:inline-block;width:26px;height:26px;line-height:26px}.cc.ca{box-shadow:0 0 0 2px var(--color-primary) inset}.dot{display:block;width:5px;height:5px;border-radius:50%;margin:2px auto 0;background:#EF4444}.di{padding:12px;border-radius:var(--radius-sm);border:1px solid var(--color-border-light);margin-bottom:8px}.dt{color:var(--color-primary);font-size:13px;margin-bottom:4px}.old-time{font-size:16px;font-weight:700;color:var(--color-primary);padding:4px 0}.time-row{display:flex;align-items:center;gap:8px}.time-dash{color:#999;flex-shrink:0}</style>
