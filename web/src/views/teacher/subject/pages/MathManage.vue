<template>
  <div class="page-container">
    <div class="page-header"><div><h2>📐 数学学科管理</h2><p>知识点 · 题库 · 配图 · 老师解析</p></div></div>
    <el-tabs v-model="tab">
      <el-tab-pane label="📖 知识点管理" name="kp">
        <div class="mb-lg filter-bar">
          <el-button type="primary" @click="openKpForm()"><el-icon><Plus /></el-icon>新增知识点</el-button>
          <el-select v-model="kpGradeFilter" placeholder="年级筛选" clearable style="width:160px"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select>
        </div>
        <el-table :data="pagedKps" stripe size="small">
          <el-table-column prop="name" label="知识点" min-width="200"/><el-table-column prop="gradeLevel" label="年级·学期" width="140" align="center"/>
          <el-table-column label="操作" width="120" align="center"><template #default="{row}"><el-button size="small" text type="primary" @click="openKpForm(row)">编辑</el-button><el-button size="small" text type="danger" @click="delKp(row)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="mt-lg" style="text-align:right"><el-pagination v-model:current-page="kpPage" :page-size="15" :total="filteredKps.length" layout="total, prev, pager, next" background/></div>
      </el-tab-pane>

      <el-tab-pane label="📋 题库管理" name="questions">
        <div class="mb-lg filter-bar">
          <el-input v-model="qSearch" placeholder="搜索题目..." :prefix-icon="Search" style="width:180px" clearable/>
          <el-select v-model="qGradeFilter" placeholder="年级·学期" clearable style="width:160px" @change="qKpFilter=null"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select>
          <el-select v-model="qKpFilter" placeholder="知识点" clearable style="width:140px" :disabled="!qGradeFilter"><el-option v-for="k in filteredKpsForGrade" :key="k.id" :label="k.name" :value="k.id"/></el-select>
          <el-select v-model="qTypeFilter" placeholder="类型" clearable style="width:90px"><el-option label="错题" value="WRONG"/><el-option label="新题" value="NEW"/></el-select>
          <el-select v-model="qStudentFilter" placeholder="学生(仅错题)" clearable style="width:130px" v-if="qTypeFilter==='WRONG'"><el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/></el-select>
          <el-date-picker v-model="qDateFilter" type="date" placeholder="上传日期" clearable style="width:140px" value-format="YYYY-MM-DD"/>
        </div>
        <el-table :data="pagedQuestions" stripe size="small">
          <el-table-column prop="title" label="题目" min-width="220" show-overflow-tooltip/>
          <el-table-column label="知识点" width="180"><template #default="{row}"><el-tag v-for="kp in (row.kpNames||[])" :key="kp" size="small" effect="plain" style="margin:1px">{{ kp }}</el-tag></template></el-table-column>
          <el-table-column label="配图" width="70" align="center"><template #default="{row}"><el-tag :type="row.diagramStatus==='NONE'?'info':row.diagramStatus==='AUTO'?'warning':'success'" size="small">{{ row.diagramStatus==='NONE'?'无':row.diagramStatus==='AUTO'?'AI':'手' }}</el-tag></template></el-table-column>
          <el-table-column label="老师解析" width="80" align="center"><template #default="{row}"><el-tag :type="row.teacherAnalysis?'success':'info'" size="small">{{ row.teacherAnalysis?'已添加':'未添加' }}</el-tag></template></el-table-column>
          <el-table-column label="类型" width="70" align="center"><template #default="{row}"><el-tag :type="row.type==='NEW'?'success':'danger'" size="small">{{ row.type==='NEW'?'新题':'错题' }}</el-tag></template></el-table-column>
          <el-table-column label="学生" width="80" align="center"><template #default="{row}"><span style="font-size:12px;color:#999">{{ row.studentName||'共享' }}</span></template></el-table-column>
          <el-table-column label="日期" width="100" align="center" prop="createdAt"/>
          <el-table-column label="操作" width="160" align="center"><template #default="{row}"><el-button size="small" text type="primary" @click="viewQuestion(row)">详情</el-button><el-button size="small" text type="warning" @click="openDraw(row)">画图</el-button></template></el-table-column>
        </el-table>
        <div class="mt-lg" style="text-align:right"><el-pagination v-model:current-page="qPage" :page-size="15" :total="filteredQuestions.length" layout="total, prev, pager, next" background/></div>
      </el-tab-pane>
      <el-tab-pane label="📤 上传题目" name="upload">
        <div v-if="!uploadResult && !upAnalyzing" class="upload-section" style="max-width:500px">
          <el-form label-width="80px">
            <el-form-item label="题目类型"><el-radio-group v-model="upType"><el-radio value="NEW">新题（全校共享）</el-radio><el-radio value="WRONG">错题</el-radio></el-radio-group></el-form-item>
            <el-form-item label="选择学生" v-if="upType==='WRONG'"><el-select v-model="upStudentId" placeholder="选择学生" style="width:100%"><el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/></el-select></el-form-item>
            <el-form-item label="上传图片"><div class="up-zone" @click="triggerUp"><input ref="upInput" type="file" accept="image/*" @change="handleUpFile" hidden/><div class="up-icon"><el-icon :size="36"><Camera/></el-icon></div><p>点击上传题目图片</p></div></el-form-item>
          </el-form>
          <div v-if="upPreview"><img :src="upPreview" class="up-preview"/></div>
          <el-button v-if="upPreview" type="primary" size="large" @click="startUpAnalysis"><el-icon><MagicStick/></el-icon> 开始AI分析</el-button>
        </div>
        <div v-if="upAnalyzing" class="analyzing"><div class="az-spinner"><span class="spinner-dot"/><span class="spinner-dot"/><span class="spinner-dot"/></div><p>AI正在分析中...</p></div>
        <div v-if="uploadResult" class="mt-lg">
          <el-tag type="success" size="large">✅ 分析完成·已自动保存到题库</el-tag>
          <el-card class="mt-lg"><el-descriptions :column="1" border size="small"><el-descriptions-item label="题目">{{ uploadResult.title }}</el-descriptions-item><el-descriptions-item label="知识点"><el-tag v-for="kp in uploadResult.kpNames" :key="kp" size="small" style="margin:1px">{{ kp }}</el-tag></el-descriptions-item><el-descriptions-item label="年级">{{ uploadResult.gradeLevel }}</el-descriptions-item><el-descriptions-item label="难度"><el-tag :type="uploadResult.difficulty==='EASY'?'success':'warning'" size="small">{{ uploadResult.difficulty==='EASY'?'简单':'中等' }}</el-tag></el-descriptions-item></el-descriptions></el-card>
          <el-button class="mt-lg" type="primary" @click="resetUp">继续上传</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showKpForm" :title="editingKp?'编辑知识点':'新增知识点'" width="450px">
      <el-form :model="kpForm" label-width="80px"><el-form-item label="名称"><el-input v-model="kpForm.name"/></el-form-item><el-form-item label="年级"><el-select v-model="kpForm.gradeLevel" style="width:100%"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select></el-form-item></el-form>
      <template #footer><el-button @click="showKpForm=false">取消</el-button><el-button type="primary" @click="saveKp">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="showQDetail" title="题目详情" width="820px">
      <div v-if="currentQ" class="q-detail"><el-row :gutter="20"><el-col :span="12"><h4>📷 原上传图片</h4><div class="img-box"><img v-if="currentQ.originalImageUrl" :src="currentQ.originalImageUrl" class="detail-img"/><el-empty v-else description="无原图" :image-size="80"/></div><h4 class="mt-lg">🖼 配图</h4><div class="img-box"><img v-if="currentQ.diagramImageUrl" :src="currentQ.diagramImageUrl" class="detail-img"/><el-empty v-else description="无配图" :image-size="60"/></div><div class="mt-sm"><el-button size="small" type="primary" @click="openDraw(currentQ)">🎨 画图配图</el-button><el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" @change="uploadDiagram" style="display:inline;margin-left:8px"><el-button size="small">📁 上传配图</el-button></el-upload></div></el-col><el-col :span="12"><h4>📝 AI 识别</h4><div class="text-box">{{ currentQ.title }}</div><h4 class="mt-lg">🏷 知识点</h4><el-select v-model="currentQ.kpIds" multiple placeholder="选择" style="width:100%"><el-option v-for="k in kps" :key="k.id" :label="k.name" :value="k.id"/></el-select><h4 class="mt-lg">👨‍🏫 老师解析</h4><el-input v-model="currentQ.teacherAnalysis" type="textarea" :rows="3" placeholder="输入文字解析..."/><div style="margin-top:6px"><span style="font-size:13px;color:#888">解析配图：</span><el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/png,image/jpeg" @change="uploadAnalysisImage" style="display:inline;margin-left:8px"><el-button size="small">📁 上传图片</el-button></el-upload><span v-if="currentQ.teacherAnalysisImage" style="margin-left:8px;font-size:12px;color:#4CAF50">✅ 已上传</span></div><h4 class="mt-lg" v-if="currentQ.solution">📝 AI解答</h4><pre class="d-solution" v-if="currentQ.solution">{{ currentQ.solution }}</pre><el-button type="primary" size="small" class="mt-lg" @click="saveQDetail">保存修改</el-button></el-col></el-row></div>
    </el-dialog>

    <!-- 画板弹窗 -->
    <el-dialog v-model="showDraw" title="🎨 画图配图" width="750px" :close-on-click-modal="false">
      <div class="draw-toolbar">
        <el-button size="small" :type="drawColor==='#333'?'primary':''" @click="drawColor='#333'" circle style="background:#333"/>
        <el-button size="small" :type="drawColor==='#EF4444'?'primary':''" @click="drawColor='#EF4444'" circle style="background:#EF4444"/>
        <el-button size="small" :type="drawColor==='#3B82F6'?'primary':''" @click="drawColor='#3B82F6'" circle style="background:#3B82F6"/>
        <el-button size="small" :type="drawColor==='#10B981'?'primary':''" @click="drawColor='#10B981'" circle style="background:#10B981"/>
        <el-s.studentIder v-model="drawWidth" :min="1" :max="8" style="width:120px"/>
        <el-button size="small" @click="clearCanvas">🗑 清空</el-button>
        <el-button size="small" @click="undoLast">↩ 撤销</el-button>
        <span style="margin-left:auto;font-size:12px;color:#999">在此画图配图</span>
      </div>
      <canvas ref="canvas" class="draw-canvas" @mousedown="startDraw" @mousemove="doDraw" @mouseup="stopDraw" @mouseleave="stopDraw" width="700" height="400"/>
      <template #footer><el-button @click="showDraw=false">取消</el-button><el-button type="primary" @click="confirmDraw">✅ 确认保存配图</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { Search, Plus, Camera, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKnowledgePoints, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint } from '@/api/common/knowledge'
import { getTeacherQuestions, updateTeacherQuestion, uploadTeacherQuestion } from '@/api/common/questions'
import { getTeacherMathStudents } from '@/api/common/admin'

const tab = ref('kp')
const grades = ['三年级·上学期','三年级·下学期','四年级·上学期','四年级·下学期','五年级·上学期','五年级·下学期','六年级·上学期','六年级·下学期','初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期','高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']
const showKpForm = ref(false); const editingKp = ref(null); const kpGradeFilter = ref(''); const kpPage = ref(1)
const kpForm = reactive({ name:'', gradeLevel:'', subject:'math' })
const kps = ref([])

async function loadKps() { try { const r = await getKnowledgePoints({ subject:'math', pageSize:200 }); kps.value = r.list||[] } catch {} }
async function loadQuestions() { try { const r = await getTeacherQuestions({ subject:'math', pageSize:200 }); questions.value = r.list||[] } catch {} }
onMounted(async () => { loadKps(); loadQuestions(); try { const r = await getTeacherMathStudents(); studentList.value = r || [] } catch {} })
const filteredKps=computed(()=>kps.value.filter(k=>!kpGradeFilter.value||k.gradeLevel===kpGradeFilter.value))
const pagedKps=computed(()=>{const s=(kpPage.value-1)*15;return filteredKps.value.slice(s,s+15)})
function openKpForm(row){ editingKp.value=row||null; kpForm.name=row?.name||''; kpForm.gradeLevel=row?.gradeLevel||''; showKpForm.value=true }
async function saveKp(){ if(!kpForm.name) return ElMessage.warning('请输入名称')
    try { if(editingKp.value){ await updateKnowledgePoint(editingKp.value.id, kpForm); ElMessage.success('已更新') }
    else { await createKnowledgePoint({ subject:"math", name:kpForm.name, gradeLevel:kpForm.gradeLevel }); ElMessage.success('已添加') };   showKpForm.value=false; loadKps() } catch(e) { ElMessage.error(e.message||"保存失败") }
}
async function delKp(row){ await ElMessageBox.confirm("删除","确认",{type:"warning"}); try { await deleteKnowledgePoint(row.id); loadKps(); ElMessage.success("已删除") } catch(e) { ElMessage.error(e.message||"失败") } }

const qSearch=ref(''); const qKpFilter=ref(null); const qGradeFilter=ref(''); const qTypeFilter=ref(''); const qStudentFilter=ref(null); const qDateFilter=ref(''); const qPage=ref(1)
const showQDetail=ref(false); const currentQ=ref(null)
const filteredKpsForGrade = computed(() => qGradeFilter.value ? kps.value.filter(k => k.gradeLevel === qGradeFilter.value) : kps.value)
const studentList=ref([])
const questions=ref([
  { id:1,type:'NEW',title:'已知二次函数 y=x²-4x+3, 求最小值及对应 x 值。',kpIds:[1,2],kpNames:['二次函数','最值问题'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'NONE',teacherAnalysis:'',teacherAnalysisImage:'',studentName:'',difficulty:'MEDIUM',gradeLevel:'初三·上学期',solution:'配方: y=(x-2)²-1, min=-1(x=2)',createdAt:'2026-07-05' },
  { id:2,type:'WRONG',title:'解一元二次方程 2x²-5x+2=0',kpIds:[3,4],kpNames:['一元二次方程','求根公式'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'AUTO',teacherAnalysis:'注意引导学生区分 a,b,c 的符号',teacherAnalysisImage:'',studentName:'白克林',studentId:1,difficulty:'EASY',gradeLevel:'初三·上学期',solution:'x₁=2, x₂=1/2',createdAt:'2026-07-03' },
  { id:3,type:'NEW',title:'Rt△ABC, AC=6, BC=8, 求 AB 及 sinA。',kpIds:[6,7],kpNames:['勾股定理','三角函数'],originalImageUrl:'',diagramImageUrl:'',diagramStatus:'NONE',teacherAnalysis:'',teacherAnalysisImage:'',studentName:'',difficulty:'EASY',gradeLevel:'初三·下学期',solution:'AB=10, sinA=4/5',createdAt:'2026-07-04' }
])
const filteredQuestions=computed(()=>{
  const list=questions.value.filter(q=>{
    if(qSearch.value&&!q.title.includes(qSearch.value))return false
    if(qKpFilter.value&&!q.kpIds.includes(qKpFilter.value))return false
    if(qGradeFilter.value&&q.gradeLevel!==qGradeFilter.value)return false
    if(qTypeFilter.value&&q.type!==qTypeFilter.value)return false
    if(qTypeFilter.value==='WRONG'&&qStudentFilter.value&&q.studentId!==qStudentFilter.value)return false
    if(qDateFilter.value&&q.createdAt!==qDateFilter.value)return false;return true
  }); return list
})
const pagedQuestions=computed(()=>{
  const start=(qPage.value-1)*15; return filteredQuestions.value.slice(start,start+15)
})
function viewQuestion(q){ currentQ.value={...q}; showQDetail.value=true }
function uploadDiagram(file){ if(!currentQ.value)return; currentQ.value.diagramImageUrl=URL.createObjectURL(file.raw); currentQ.value.diagramStatus='MANUAL'; ElMessage.success('配图已更新') }
function uploadAnalysisImage(file){ if(!currentQ.value)return; currentQ.value.teacherAnalysisImage=URL.createObjectURL(file.raw); ElMessage.success('解析配图已上传') }
function saveQDetail(){ if(currentQ.value){ const q=questions.value.find(x=>x.id===currentQ.value.id); if(q){ Object.assign(q,currentQ.value) } }; ElMessage.success('保存成功'); showQDetail.value=false }

// === 画图功能 ===
const showDraw=ref(false); const canvas=ref(null); const drawColor=ref('#333'); const drawWidth=ref(3)
let drawing=false; let lastX=0; let lastY=0; const drawHistory=ref([])
function openDraw(row){ currentQ.value=row||currentQ.value; showDraw.value=true; nextTick(()=>{loadCanvasImage()}) }
function loadCanvasImage(){
  const c=canvas.value; if(!c)return; const ctx=c.getContext('2d')
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height)
  if(currentQ.value?.diagramImageUrl){ const img=new Image(); img.onload=()=>{ctx.drawImage(img,0,0,c.width,c.height)}; img.src=currentQ.value.diagramImageUrl }
}
function startDraw(e){ drawing=true; const rect=canvas.value.getBoundingClientRect(); lastX=e.clientX-rect.left; lastY=e.clientY-rect.top }
function doDraw(e){ if(!drawing)return; const rect=canvas.value.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; const ctx=canvas.value.getContext('2d'); ctx.strokeStyle=drawColor.value; ctx.lineWidth=drawWidth.value; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); lastX=x; lastY=y }
function stopDraw(){ drawing=false }
function clearCanvas(){ const c=canvas.value; c.getContext('2d').fillStyle='#fff'; c.getContext('2d').fillRect(0,0,c.width,c.height) }
function undoLast(){ /* simple undo - clear */ clearCanvas() }
function confirmDraw(){ if(!currentQ.value||!canvas.value)return; currentQ.value.diagramImageUrl=canvas.value.toDataURL(); currentQ.value.diagramStatus='MANUAL'; ElMessage.success('配图已保存'); showDraw.value=false }

// === 上传题目 ===
const upType=ref('NEW'); const upStudentId=ref(null); const upPreview=ref(''); const upAnalyzing=ref(false); const uploadResult=ref(null); const upInput=ref(null)
function triggerUp(){ upInput.value?.click() }
function handleUpFile(e){ const f=e.target.files[0]; if(!f)return; upPreview.value=URL.createObjectURL(f) }
async function startUpAnalysis(){
  if(upType.value==='WRONG'&&!upStudentId.value)return ElMessage.warning('请选择学生')
  upAnalyzing.value=true; await new Promise(r=>setTimeout(r,2000))
  const pk=Math.floor(Math.random()*kps.value.length); const kp=kps.value.slice(pk,pk+2).map(k=>k.id)
  uploadResult.value={
    title:'AI识别: '+(upType.value==='WRONG'?'(错题)':'(新题)')+' 已知二次函数 y=-x²+4x-3, 求对称轴和最大值。',
    kpIds:kp, kpNames:kps.value.filter(k=>kp.includes(k.id)).map(k=>k.name),
    gradeLevel:'初三·上学期', difficulty:'MEDIUM', type:upType.value, studentId:upStudentId.value,
    studentName:studentList.value.find(s=>s.studentId===upStudentId.value)?.name||'', diagramStatus:'NONE'
  }
  upAnalyzing.value=false
  // 自动保存到questions
  questions.value.unshift({ id:Date.now(), ...uploadResult.value, createdAt:new Date().toISOString().slice(0,10), teacherAnalysis:'', teacherAnalysisImage:'', diagramImageUrl:'', originalImageUrl:upPreview.value, solution:'对称轴x=2, max=-1', kpNames:uploadResult.value.kpNames })
}
function resetUp(){ uploadResult.value=null; upPreview.value=''; upStudentId.value=null }
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.mt-lg{margin-top:var(--space-lg)}.mt-sm{margin-top:8px}.filter-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.q-detail h4{font-size:14px;margin-bottom:6px}.img-box{background:var(--color-bg-alt);border-radius:8px;min-height:100px;display:flex;align-items:center;justify-content:center;overflow:hidden}.detail-img{max-width:100%;max-height:260px;object-fit:contain}
.text-box{background:#F8FAFC;padding:12px;border-radius:8px;font-size:14px;line-height:1.8;color:#555}.d-solution{background:#F0FDF4;padding:12px;border-radius:8px;font-size:13px;line-height:1.8;white-space:pre-wrap;font-family:monospace}
.draw-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}.draw-canvas{border:2px solid var(--color-border);border-radius:12px;cursor:crosshair;width:100%;max-width:700px;display:block}
.up-zone{border:2px dashed #ccc;border-radius:16px;padding:40px;text-align:center;cursor:pointer;transition:all .2s}.up-zone:hover{border-color:var(--color-primary);background:rgba(99,102,241,.04)}.up-icon{color:var(--color-primary);margin-bottom:8px}.up-zone p{font-size:14px;color:#888}.up-preview{max-width:300px;max-height:300px;border-radius:12px;margin-top:12px}
.analyzing{text-align:center;padding:40px}.az-spinner{display:flex;gap:8px;justify-content:center;margin-bottom:12px}.spinner-dot{width:10px;height:10px;border-radius:50%;background:var(--color-primary);animation:dotPulse 1.4s infinite}.spinner-dot:nth-child(2){animation-delay:.2s}.spinner-dot:nth-child(3){animation-delay:.4s}@keyframes dotPulse{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}
</style>
