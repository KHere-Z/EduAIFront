<template>
  <div class="wa-page">
    <div class="wa-hero">
      <div class="wa-emoji">📸</div>
      <h2>AI 错题分析</h2>
      <p>拍照或截图上传错题 → AI 智能识别 · 知识点解析 · 举一反三</p>
    </div>

    <!-- 上传区 -->
    <div class="upload-zone" v-if="!analyzing && !currentResult" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" @change="handleFile" hidden />
      <div class="uz-icon"><el-icon :size="48"><Camera /></el-icon></div>
      <h3>点击上传错题图片</h3>
      <p>支持 JPG / PNG · 单张 ≤ 10MB · 也可拖拽到此处</p>
    </div>

    <!-- 上传的图片预览 + 开始分析 -->
    <div class="preview-section" v-if="previewUrl && !analyzing && !currentResult">
      <img :src="previewUrl" class="preview-img" />
      <el-button type="primary" size="large" class="analyze-btn" @click="startAnalysis">
        <el-icon><MagicStick /></el-icon> 开始 AI 分析
      </el-button>
      <el-button size="large" @click="resetUpload">重新上传</el-button>
    </div>

    <!-- 分析中 -->
    <div class="analyzing" v-if="analyzing">
      <div class="az-spinner"><span class="spinner-dot"></span><span class="spinner-dot"></span><span class="spinner-dot"></span></div>
      <p>AI 正在分析中...</p>
      <span class="az-hint">识别题目 · 定位知识点 · 生成解析</span>
    </div>

    <!-- 分析结果 -->
    <div class="result-card" v-if="currentResult">
      <div class="rc-header">
        <el-tag type="success" size="large">✅ 分析完成</el-tag>
        <span class="rc-date">{{ currentResult.date }}</span>
      </div>
      <div class="rc-body">
        <div class="rc-preview">
          <img :src="currentResult.image" class="rc-img" />
          <el-tag :type="currentResult.diffTag">{{ currentResult.difficulty }}</el-tag>
        </div>
        <div class="rc-detail">
          <div class="rd-row"><span class="rd-label">📚 知识点</span><span class="rd-value">{{ currentResult.knowledgePoint }}</span></div>
          <div class="rd-row"><span class="rd-label">🔍 错误类型</span><el-tag :type="currentResult.errorTag" size="small">{{ currentResult.errorType }}</el-tag></div>
          <div class="rd-row"><span class="rd-label">💡 错因分析</span></div>
          <div class="rd-text">{{ currentResult.analysis }}</div>
          <div class="rd-row"><span class="rd-label">📝 正确解法</span></div>
          <div class="rd-text solution">{{ currentResult.solution }}</div>
          <div class="rd-row"><span class="rd-label">🎯 举一反三</span></div>
          <div class="similar-list">
            <div v-for="(q,i) in currentResult.similarQuestions" :key="i" class="similar-item" @click="goToQuestion(q)">
              <span class="si-num">{{ i+1 }}</span>
              <span>{{ q }}</span>
              <span class="si-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
      <div class="rc-actions">
        <el-tag type="success" size="large">✅ 已自动保存到错题库</el-tag>
        <el-button @click="resetUpload">分析新题目</el-button>
      </div>
    </div>

    <!-- 历史错题库 -->
    <h3 class="sec-title" v-if="history.length">📋 错题历史</h3>
    <div class="history-grid" v-if="history.length">
      <div class="h-card" v-for="h in history" :key="h.id" @click="viewHistory(h)">
        <img :src="h.image" class="h-thumb" />
        <div class="h-info">
          <span class="h-kp">{{ h.knowledgePoint }}</span>
          <el-tag :type="h.errorTag" size="small">{{ h.errorType }}</el-tag>
        </div>
        <span class="h-date">{{ h.date }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

function goToQuestion(title) {
  // 存到 sessionStorage，题库页读取后进入全屏模式
  sessionStorage.setItem('qb_focus_question', title)
  router.push('/student/subject/math/question-bank')
}

const fileInput = ref(null)
const previewUrl = ref('')
const analyzing = ref(false)
const currentResult = ref(null)
const history = ref([
  { id:1, image:'', knowledgePoint:'二次函数·顶点式', errorType:'概念混淆', errorTag:'danger', difficulty:'中等', diffTag:'warning',
    date:'2026-07-01', analysis:'混淆了顶点式 y=a(x-h)²+k 中 h 的符号。当顶点为(2,3)时，公式中 h=2 代入为 (x-2)，学生错误写成了 (x+2)。',
    solution:'1. 顶点坐标(2,3) → h=2, k=3\n2. 代入顶点式: y=a(x-2)²+3\n3. 再代入点(0,-1): -1=a(0-2)²+3 → -1=4a+3 → a=-1\n4. 解析式: y=-(x-2)²+3',
    similarQuestions:['已知顶点(3,-1)且过点(1,3)，求二次函数解析式','把 y=x²-6x+8 化为顶点式','已知 y=2(x+1)²-5，写出顶点坐标和对称轴'] },
  { id:2, image:'', knowledgePoint:'一元二次方程·判别式', errorType:'计算失误', errorTag:'warning', difficulty:'简单', diffTag:'success',
    date:'2026-06-28', analysis:'在计算 b²-4ac 时符号出错。对于方程 2x²-3x+1=0，a=2, b=-3, c=1，判别式=(-3)²-4×2×1=9-8=1。学生将 b 的值误算为正数。',
    solution:'判别式 Δ=b²-4ac=(-3)²-4×2×1=9-8=1>0\n∴ 方程有两个不等实根\nx=(-b±√Δ)/2a=(3±1)/4\nx₁=1, x₂=1/2',
    similarQuestions:['解方程 x²-5x+6=0','判断 3x²+2x+4=0 的根的情况','已知 x²+kx+4=0 有两个相等实根，求 k'] }
])

function triggerUpload() { fileInput.value?.click() }
function handleFile(e) {
  const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return ElMessage.warning('请上传图片文件')
  previewUrl.value = URL.createObjectURL(file)
}
function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) { const fake = { target: { files: [file] } }; handleFile(fake) }
}
function resetUpload() { previewUrl.value = ''; currentResult.value = null }
async function startAnalysis() {
  analyzing.value = true
  // 模拟 AI 分析延迟
  await new Promise(r => setTimeout(r, 2500))
  // 生成模拟分析结果
  const kps = ['二次函数·顶点式','一元二次方程·判别式','相似三角形·判定','勾股定理·应用','概率·古典概型']
  const errors = [{type:'概念混淆',tag:'danger'},{type:'计算失误',tag:'warning'},{type:'审题不清',tag:'info'}]
  const diffs = [{label:'简单',tag:'success'},{label:'中等',tag:'warning'},{label:'困难',tag:'danger'}]
  const pick = arr => arr[Math.floor(Math.random()*arr.length)]
  const kp = pick(kps); const er = pick(errors); const df = pick(diffs)
  currentResult.value = {
    image: previewUrl.value || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="%23f0f0f0" width="200" height="120"/><text x="100" y="65" text-anchor="middle" fill="%23999" font-size="12">题目图片</text></svg>',
    knowledgePoint: kp, errorType: er.type, errorTag: er.tag,
    difficulty: df.label, diffTag: df.tag,
    date: new Date().toLocaleDateString('zh-CN'),
    analysis: '根据题目分析，该生对' + kp + '的理解存在偏差，主要表现为' + er.type + '。建议重点复习相关知识点的基础概念和典型例题。',
    solution: '1. 仔细审题，明确已知条件\n2. 选用正确的公式/定理\n3. 分步计算，注意符号\n4. 验证答案的合理性',
    similarQuestions: ['变式题1：改变条件后重新求解','变式题2：逆向思维，已知结果求条件','综合题：结合其他知识点考察']
  }
  analyzing.value = false
  autoSaveToBank()
}
function autoSaveToBank() {
  history.value.unshift({ ...currentResult.value, id: Date.now() })
}
function viewHistory(h) { currentResult.value = h; window.scrollTo({top:0,behavior:'smooth'}) }
</script>
<style scoped>
.wa-page { max-width: 720px; margin: 0 auto; padding: 20px 14px 40px; }
.wa-hero { text-align: center; padding: 16px 0; }
.wa-emoji { font-size: 48px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.wa-hero h2 { font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
.wa-hero p { font-size: 13px; color: #999; }
/* 上传区 */
.upload-zone { border: 2px dashed #ccc; border-radius: 24px; padding: 48px 20px; text-align: center; cursor: pointer; transition: all .2s; background: rgba(255,255,255,.5); }
.upload-zone:hover { border-color: var(--color-primary); background: rgba(99,102,241,.04); }
.uz-icon { color: var(--color-primary); margin-bottom: 12px; }
.upload-zone h3 { font-size: 16px; color: #555; margin-bottom: 6px; }
.upload-zone p { font-size: 13px; color: #999; }
/* 预览 */
.preview-section { text-align: center; }
.preview-img { max-width: 100%; max-height: 300px; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,.08); margin-bottom: 16px; }
.analyze-btn { margin-right: 10px; }
/* 分析中动画 */
.analyzing { text-align: center; padding: 48px; }
.az-spinner { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
.spinner-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); animation: dotPulse 1.4s infinite ease-in-out; }
.spinner-dot:nth-child(2) { animation-delay: .2s; }
.spinner-dot:nth-child(3) { animation-delay: .4s; }
@keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.5} 40%{transform:scale(1);opacity:1} }
.analyzing p { font-size: 16px; font-weight: 600; color: #555; }
.az-hint { font-size: 13px; color: #999; }
/* 结果卡片 */
.result-card { background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 2px 16px rgba(0,0,0,.06); margin-top: 20px; }
.rc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rc-date { font-size: 13px; color: #999; }
.rc-body { display: flex; gap: 20px; }
.rc-preview { flex-shrink: 0; text-align: center; }
.rc-img { width: 160px; height: 120px; object-fit: cover; border-radius: 12px; background: #f5f5f5; margin-bottom: 8px; display: block; }
.rc-detail { flex: 1; }
.rd-row { margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.rd-label { font-weight: 600; font-size: 14px; }
.rd-value { font-size: 14px; color: #555; }
.rd-text { background: #F8FAFC; padding: 12px; border-radius: 10px; font-size: 14px; color: #555; line-height: 1.8; margin-bottom: 12px; }
.rd-text.solution { background: #F0FDF4; }
.similar-list { }
.similar-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555; cursor: pointer; transition: all .15s; align-items: center; }
.similar-item:hover { color: var(--color-primary); background: var(--color-primary-bg); margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 6px; }
.si-arrow { margin-left: auto; opacity: 0; transition: opacity .15s; color: var(--color-primary); }
.similar-item:hover .si-arrow { opacity: 1; }
.si-num { width: 22px; height: 22px; background: var(--color-primary-bg); color: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.rc-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: center; }
/* 历史 */
.sec-title { font-size: 18px; font-weight: 700; margin: 28px 0 14px; }
.history-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.h-card { background: #fff; border-radius: 14px; padding: 10px; cursor: pointer; box-shadow: 0 1px 8px rgba(0,0,0,.04); transition: all .2s; }
.h-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
.h-thumb { width: 100%; height: 80px; object-fit: cover; border-radius: 8px; background: #f5f5f5; margin-bottom: 8px; }
.h-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.h-kp { font-size: 12px; font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.h-date { font-size: 11px; color: #999; }
@media (max-width: 640px) {
  .rc-body { flex-direction: column; }
  .rc-img { width: 100%; height: 180px; }
  .history-grid { grid-template-columns: 1fr 1fr; }
}
</style>
