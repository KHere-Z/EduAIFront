<template>
  <div class="qb-page" :class="{fullscreen: isFullscreen}">
    <template v-if="!isFullscreen">
      <router-link :to="`/student/subject/math`" class="back-link">← 返回学科中心</router-link>

      <!-- ═══ 头部 ═══ -->
      <div class="qb-hero">
        <div class="qbh-left">
          <span class="qbh-icon">🎯</span>
          <div>
            <h2>题库挑战</h2>
            <p>错题复习 · 新题挑战 · 举一反三</p>
          </div>
        </div>
        <div class="qbh-actions">
          <el-button type="warning" plain @click="enterFullscreen">⏱ 开始做题</el-button>
          <el-button type="primary" plain @click="showAnalysis=true">📊 综合分析</el-button>
        </div>
      </div>

      <!-- ═══ 标签页 ═══ -->
      <div class="qb-tabs">
        <button :class="['qbt', {active:tab==='wrong'}]" @click="tab='wrong'">
          <span class="qbt-icon">📝</span><span>错题库</span><span class="qbt-count">{{wrongTotal}}</span>
        </button>
        <button :class="['qbt', {active:tab==='new'}]" @click="tab='new'">
          <span class="qbt-icon">✨</span><span>新题</span><span class="qbt-count">{{newTotal}}</span>
        </button>
      </div>

      <!-- ═══ 筛选栏 ═══ -->
      <div class="qb-filter-bar">
        <div class="qbf-left">
          <el-select v-model="filterMastery" placeholder="掌握度" clearable size="small" class="qbf-select">
            <el-option label="😰 未掌握" value="UNMASTERED"/>
            <el-option label="🤔 熟悉中" value="FAMILIAR"/>
            <el-option label="😎 已掌握" value="MASTERED"/>
          </el-select>
          <el-select v-model="filterDiff" placeholder="难度" clearable size="small" class="qbf-select">
            <el-option label="🟢 简单" value="EASY"/>
            <el-option label="🟡 中等" value="MEDIUM"/>
            <el-option label="🔴 困难" value="HARD"/>
          </el-select>
          <el-select v-model="filterGrade" placeholder="年级" clearable size="small" class="qbf-select">
            <el-option v-for="g in grades" :key="g" :label="g" :value="g"/>
          </el-select>
          <span class="qbf-count">{{ filteredQuestions.length }} 题</span>
        </div>
        <div class="kp-chips">
          <span class="kpc-label">知识点</span>
          <span v-for="kp in allKps" :key="kp" :class="['kpc-chip', {active:filterKps.includes(kp)}]" @click="toggleKp(kp)">{{ kp }}</span>
        </div>
      </div>

      <!-- ═══ 题目列表 ═══ -->
      <div class="qb-grid" v-if="filteredQuestions.length">
        <div class="q-card" v-for="(q,qi) in filteredQuestions" :key="q.id" @click="viewQuestion(q)">
          <div class="qc-left">
            <span :class="['qc-dot', q.mastery==='MASTERED'?'green':q.mastery==='FAMILIAR'?'yellow':'red']"/>
          </div>
          <div class="qc-main">
            <div class="qc-title" v-html="q._titleHtml || q.title"></div>
            <div class="qc-meta">
              <el-tag size="small" :type="q.diffTag" effect="plain">{{ q.difficulty }}</el-tag>
              <el-tag size="small" :type="q.masteryTag" effect="plain">{{ q.masteryLabel }}</el-tag>
              <span v-if="q.errorType" class="qc-error">{{ q.errorType }}</span>
              <span class="qc-date">{{ q.date }}</span>
            </div>
            <div class="qc-kps" v-if="q.kpNames?.length">
              <el-tag v-for="kp in q.kpNames" :key="kp" size="small" type="info" effect="plain">{{ kp }}</el-tag>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无题目" :image-size="100"/>

      <el-dialog v-model="showDetail" title="题目详情" width="680px">
        <div v-if="currentQ" class="result-card">
          <div class="rc-header">
            <div><el-tag size="small" :type="currentQ.diffTag">{{ currentQ.difficulty }}</el-tag><el-tag size="small" :type="currentQ.masteryTag" style="margin-left:6px">{{ currentQ.masteryLabel }}</el-tag><span v-if="currentQ.errorType" class="rc-error-tag">{{ currentQ.errorType }}</span></div>
            <span class="rc-date">{{ currentQ.date }}</span>
          </div>
          <div class="rc-body">
            <div class="rc-detail">
              <div class="rc-title" v-html="currentQ._titleHtml || currentQ.title"></div>
              <div class="rc-kps"><el-tag v-if="!currentQ.kpNames?.length" size="small" type="warning" effect="plain">待老师标识知识点</el-tag><el-tag v-for="kp in currentQ.kpNames" :key="kp" size="small" type="info" effect="plain" style="margin-right:4px">{{ kp }}</el-tag></div>
              <div class="rd-row"><span class="rd-label">🔍 错因分析</span></div>
              <div class="rd-text" v-html="currentQ.analysis || '暂无分析数据，AI 分析后将自动补充'"></div>
              <div class="rd-row"><span class="rd-label">🤖 AI 解答</span></div>
              <div class="rd-text solution" v-html="currentQ.solution || '暂无 AI 解答，分析后将自动补充'"></div>
              <div class="rd-row"><span class="rd-label">👨‍🏫 老师解析</span></div>
              <div class="rd-text" style="background:#FFF8E1" v-html="currentQ._teacherAnalysisHtml || '老师暂未上传解析'"></div>
              <div class="rd-row"><span class="rd-label">🎯 举一反三</span></div>
              <div class="similar-list"><div v-for="(q,i) in (currentQ.similarQuestions||[])" :key="i" class="similar-item" @click="goToSimilar(q)"><span class="si-num">{{ i+1 }}</span><span v-html="q._html"></span><span class="si-arrow">→</span></div><div v-if="!currentQ.similarQuestions?.length" class="rd-text" style="background:#FFF8E1;color:#999">暂无举一反三题目</div></div>
            </div>
            <div class="rc-diagram" @click="zoomDiagram = true">
              <img v-if="currentQ.diagramImageUrl" :src="resolveStaticUrl(currentQ.diagramImageUrl)" class="rc-diagram-img"/>
              <div v-else class="rc-diagram-empty">🖼<br/>暂无配图</div>
              <span v-if="currentQ.diagramImageUrl" class="rc-zoom-hint">🔍 点击放大</span>
              <el-tag size="small" :type="currentQ.diffTag" style="margin-top:8px">{{ currentQ.difficulty }}</el-tag>
            </div>
          </div>
          <el-dialog v-model="zoomDiagram" title="配图预览" width="90%" :append-to-body="true">
            <img v-if="currentQ.diagramImageUrl" :src="resolveStaticUrl(currentQ.diagramImageUrl)" style="width:100%;max-height:80vh;object-fit:contain;border-radius:8px"/>
          </el-dialog>
          <div class="rc-actions"><div class="d-mastery"><span>掌握度：</span><el-radio-group v-model="currentQ.mastery" size="small" @change="updateMastery"><el-radio-button value="UNMASTERED">😰 未掌握</el-radio-button><el-radio-button value="FAMILIAR">🤔 熟悉中</el-radio-button><el-radio-button value="MASTERED">😎 已掌握</el-radio-button></el-radio-group></div><el-button @click="goNextQuestion">下一题 →</el-button></div>
        </div>
      </el-dialog>
    </template>

    <!-- ═══════════ 错题综合分析弹窗 ═══════════ -->
    <el-dialog v-model="showAnalysis" title="📊 错题综合分析报告" width="720px" :close-on-click-modal="false">
      <div v-if="analysisKps.length" class="ana-wrap" id="analysis-report">
        <!-- 概览 -->
        <div class="ana-overview">
          <div class="ana-ov-item"><span class="aov-num">{{ wrongTotal }}</span><span class="aov-label">错题总数</span></div>
          <div class="ana-ov-item"><span class="aov-num">{{ analysisKps.length }}</span><span class="aov-label">涉及知识点</span></div>
          <div class="ana-ov-item"><span class="aov-num">{{ weakKps.length }}</span><span class="aov-label">薄弱知识点</span></div>
          <div class="ana-ov-item"><span class="aov-num">{{ (wrongTotal/(questions.length||1)*100).toFixed(0) }}%</span><span class="aov-label">错题占比</span></div>
        </div>

        <!-- 薄弱知识点 -->
        <div class="ana-section" v-if="weakKps.length">
          <h4>⚠️ 薄弱知识点（需重点加强）</h4>
          <div class="ana-weak-list">
            <div v-for="kp in weakKps" :key="kp.name" class="aw-item">
              <div class="awi-top">
                <span class="awi-name">{{ kp.name }}</span>
                <span class="awi-badge">薄弱</span>
              </div>
              <div class="awi-bar"><span class="awib-fill" :style="{width:kp.weakPercent+'%',background:kp.weakPercent>60?'#EF4444':kp.weakPercent>30?'#F59E0B':'#10B981'}"></span></div>
              <div class="awi-stats">
                <span>错题 {{ kp.total }} 道</span>
                <span class="awi-unmastered">未掌握 {{ kp.unmastered }} 道</span>
                <span>薄弱指数 {{ kp.weakPercent }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 知识点分布表 -->
        <div class="ana-section">
          <h4>📈 知识点错题分布</h4>
          <table class="ana-table">
            <thead><tr><th>知识点</th><th>错题数</th><th>未掌握</th><th>熟悉中</th><th>已掌握</th><th>薄弱指数</th><th>建议</th></tr></thead>
            <tbody>
              <tr v-for="kp in analysisKps" :key="kp.name" :class="{'aw-row':kp.weakPercent>=30}">
                <td><b>{{ kp.name }}</b></td>
                <td>{{ kp.total }}</td>
                <td><span class="at-red">{{ kp.unmastered }}</span></td>
                <td><span class="at-yellow">{{ kp.familiar }}</span></td>
                <td><span class="at-green">{{ kp.mastered }}</span></td>
                <td>
                  <el-progress :percentage="kp.weakPercent" :color="kp.weakPercent>60?'#EF4444':kp.weakPercent>30?'#F59E0B':'#10B981'" :stroke-width="8" style="width:80px"/>
                </td>
                <td class="at-advice">{{ kp.advice }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 掌握度分布 -->
        <div class="ana-section">
          <h4>🎯 整体掌握度分布</h4>
          <div class="ana-mastery-bars">
            <div class="amb-item" v-for="m in masteryDist" :key="m.label">
              <span class="amb-label">{{ m.label }}</span>
              <div class="amb-bar-wrap"><span class="amb-fill" :style="{width:m.percent+'%',background:m.color}"></span></div>
              <span class="amb-count">{{ m.count }}题 ({{ m.percent }}%)</span>
            </div>
          </div>
        </div>

        <div class="ana-footer-text">
          报告生成时间：{{ new Date().toLocaleString() }} · 智学AI教育
        </div>
      </div>
      <el-empty v-else description="暂无错题数据" :image-size="80"/>

      <template #footer>
        <el-button @click="showAnalysis=false">关闭</el-button>
        <el-button type="primary" @click="exportAnalysisPDF" :disabled="!analysisKps.length">📥 导出PDF报告</el-button>
      </template>
    </el-dialog>

    <!-- ═══════════════════════════════════════════ 开始做题 ═══════════════════════════════════════════ -->
    <template v-if="isFullscreen">
      <!-- 顶栏 -->
      <div class="fs-top">
        <span class="fs-timer">{{ elapsed }}</span>
        <div class="fs-progress-bar"><span class="fs-pb-fill" :style="{width:(fsCompletedCount/fsPool.length*100)+'%'}"></span></div>
        <span class="fs-progress">{{ fsCompletedCount }}/{{ fsPool.length }} 已完成</span>
        <div class="fs-top-right">
          <el-button size="small" text type="primary" @click="showFsAnswer=!showFsAnswer">💡 解析</el-button>
          <el-button size="small" type="danger" text @click="exitFullscreen">退出 (ESC)</el-button>
        </div>
      </div>

      <div class="fs-wrap">
        <!-- 知识点侧边栏 -->
        <aside class="fs-sidebar">
          <div class="fs-side-title">📚 知识点</div>
          <div class="fs-kp-item" v-for="kp in fsKpList" :key="kp.name" :class="{active:fsActiveKp===kp.name}" @click="selectFsKp(kp.name)">
            <span class="fsk-name">{{ kp.name }}</span>
            <span class="fsk-count">{{ kp.count }}</span>
          </div>
        </aside>

        <!-- 主区域：题目 + 答题 -->
        <div class="fs-body">
          <div v-if="fsQuestion" class="fs-main">
            <!-- ── 题目区域（上半部分） ── -->
            <div class="fs-question-area">
              <div class="fs-q-left">
                <div class="fs-q-tags">
                  <el-tag v-if="!fsQuestion.kpNames?.length" size="small" type="warning" effect="plain">待老师标识知识点</el-tag>
                  <el-tag v-for="kp in fsQuestion.kpNames" :key="kp" size="small" type="info" effect="plain" style="margin:1px">{{ kp }}</el-tag>
                  <el-tag size="small" :type="fsQuestion.diffTag" style="margin:1px">{{ fsQuestion.difficulty }}</el-tag>
                </div>
                <div class="fs-q-text" v-html="fsQuestion._titleHtml || fsQuestion.title"></div>
              </div>
              <!-- 配图区域 -->
              <div class="fs-q-right" v-if="fsQuestion.diagramImageUrl">
                <img :src="resolveStaticUrl(fsQuestion.diagramImageUrl)" class="fs-q-diagram" @click="zoomFsDiagram = true" />
                <span class="fs-q-zoom-hint">🔍 点击放大</span>
              </div>
            </div>

            <!-- ── 答题区域（下半部分） ── -->
            <div class="fs-answer-area" v-if="!fsSubmitted">
              <!-- 上传答题图片 -->
              <div class="fs-upload-wrap">
                <label class="fs-upload-zone" v-if="!uploadedAnswerImg">
                  <div class="fuz-icon">📷</div>
                  <div class="fuz-text">点击上传答题图片</div>
                  <div class="fuz-hint">支持 JPG、PNG，拍清楚即可</div>
                  <input type="file" accept="image/*" hidden @change="onAnswerImgUpload" />
                </label>
                <div v-else class="fs-upload-preview">
                  <img :src="uploadedAnswerImg" class="fup-img" />
                  <el-button size="small" type="danger" plain @click="uploadedAnswerImg=''; uploadedAnswerFile=null">重新上传</el-button>
                </div>
              </div>

              <!-- 提交按钮 -->
              <div class="fs-submit-row">
                <el-button type="primary" size="large" @click="submitAnswer" :disabled="!canSubmit">
                  ✅ 确认提交 · AI 批改
                </el-button>
              </div>
            </div>

            <!-- ── AI 批改结果 ── -->
            <div class="fs-result-area" v-if="fsSubmitted && fsAiResult">
              <div class="fsr-header">
                <span class="fsr-title">🤖 AI 批改结果</span>
                <el-tag :type="fsAiCorrect ? 'success' : 'danger'" size="small">{{ fsAiCorrect ? '✓ 回答正确' : '✗ 存在错误' }}</el-tag>
              </div>
              <div class="fsr-body" v-html="fsAiResult"></div>
              <div class="fsr-actions">
                <el-button type="warning" plain @click="disputeToTeacher" :disabled="fsSentToTeacher">
                  {{ fsSentToTeacher ? '✓ 已送往老师批改' : '⚖️ 有争议？送老师批改' }}
                </el-button>
              </div>
            </div>

            <!-- ── 上次答题 ── -->
            <div class="fs-last-answer" v-if="lastAnswerText||lastAnswerImage">
              <div class="fsa-title">📋 上次答题 <span style="font-size:12px;color:#999;font-weight:400">（提交后保存）</span></div>
              <div class="text-box" v-html="lastAnswerHtml" v-if="lastAnswerHtml"></div>
              <img v-if="lastAnswerImage" :src="lastAnswerImage" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px"/>
            </div>

            <!-- ── 解析区域（可展开） ── -->
            <div class="fs-answer" v-if="showFsAnswer && fsQuestion.solution">
              <div class="fsa-title">💡 答案解析</div>
              <div class="d-solution" v-html="fsSolutionHtml"></div>
            </div>

            <!-- ── 底部操作栏（原有功能保留） ── -->
            <div class="fs-bottom-bar">
              <div class="fsb-left">
                <span class="fsb-label">掌握度：</span>
                <el-radio-group v-model="fsQuestion.mastery" size="small" @change="updateFsMastery">
                  <el-radio-button value="MASTERED">😎 已掌握</el-radio-button>
                  <el-radio-button value="FAMILIAR">🤔 熟悉中</el-radio-button>
                  <el-radio-button value="UNMASTERED">😰 未掌握</el-radio-button>
                </el-radio-group>
              </div>
              <div class="fsb-right">
                <el-button @click="fsGoNext">下一题 →</el-button>
              </div>
            </div>
          </div>

          <el-empty v-else description="全部完成！🎉" :image-size="120"/>
        </div>
      </div>
    </template>

    <!-- 配图大图预览 -->
    <el-dialog v-model="zoomFsDiagram" title="配图预览" width="90%" :append-to-body="true">
      <img v-if="fsQuestion?.diagramImageUrl" :src="resolveStaticUrl(fsQuestion.diagramImageUrl)" style="width:100%;max-height:80vh;object-fit:contain;border-radius:8px"/>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from "element-plus"
import { useRouter, useRoute } from 'vue-router'
import { getStudentWrongQuestions, getStudentNewQuestions, getSimilarQuestions } from "@/api/common/questions"
import http from '@/api/request'
import { renderMarkdown, sanitizeHtml } from '@/utils/markdown'
import { resolveStaticUrl } from '@/utils/url'
const router = useRouter(); const route = useRoute()
const tab = ref('wrong'); const filterKps = ref([]); const filterMastery = ref(''); const filterDiff = ref(''); const filterGrade = ref('')
const showDetail = ref(false); const currentQ = ref(null); const zoomDiagram = ref(false); const isFullscreen = ref(false); const fsQuestion = ref(null); const showFsAnswer = ref(false); const showAnalysis = ref(false); const fsSolutionHtml = ref('')
let fsIdx = 0; const fsPool = ref([]); const fsActiveKp = ref(''); const fsKpList = ref([]); const completedSet = ref(new Set())
const fsCompletedCount = computed(() => fsPool.value.filter(q => completedSet.value.has(q.id)).length)
async function setFsQuestion(q) {
  if (q && q.title) q._titleHtml = await renderMarkdown(q.title)
  fsQuestion.value = q
}
watch([showFsAnswer, fsQuestion], async ([show, q]) => {
  if (!show || !q?.solution) return
  // 已渲染过的 KaTeX HTML 直接展示，纯文本才重新渲染
  if (/class="katex"/.test(q.solution)) { fsSolutionHtml.value = sanitizeHtml(q.solution); return }
  let text = q.solution
  text = text.split('\n').map(line => /\\[a-zA-Z]/.test(line) && !/\$/.test(line) ? `$$${line}$$` : line).join('\n')
  fsSolutionHtml.value = await renderMarkdown(text)
})
onMounted(async () => { try { const stageGrades = grades.value.join(','); const wr = await getStudentWrongQuestions({ subject:"math", pageSize:200 }); const nw = await getStudentNewQuestions({ subject:"math", gradeLevel:stageGrades, pageSize:200 }); const diffMap={EASY:{label:"简单",tag:"success"},MEDIUM:{label:"中等",tag:"warning"},HARD:{label:"困难",tag:"danger"}}; const mastMap={UNMASTERED:{label:"未掌握",tag:"danger"},FAMILIAR:{label:"熟悉中",tag:"warning"},MASTERED:{label:"已掌握",tag:"success"}}; const mapper = q => ({...q,kpNames:(q.knowledgePointNames||"").split(",").filter(Boolean) || [],diffTag:diffMap[q.difficulty]?.tag||"info",masteryTag:mastMap[q.mastery]?.tag||"info",masteryLabel:mastMap[q.mastery]?.label||"未掌握",date:q.createdAt?.slice(0,10)||""}); questions.value = [...(wr.list||[]).map(q=>mapper({...q,type:"WRONG"})), ...(nw.list||[]).map(q=>mapper({...q,type:"NEW"}))]; for (const q of questions.value) { if (q.title) q._titleHtml = await renderMarkdown(q.title) } } catch {} })
const elapsed = ref('00:00'); let timer = null; let seconds = 0
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()
const studentGrade = computed(() => auth.user?.grade || '初三')
const grades = computed(() => {
  const g = studentGrade.value
  const all = ['三年级·上学期','三年级·下学期','四年级·上学期','四年级·下学期','五年级·上学期','五年级·下学期','六年级·上学期','六年级·下学期','初一·上学期','初一·下学期','初二·上学期','初二·下学期','初三·上学期','初三·下学期','高一·上学期','高一·下学期','高二·上学期','高二·下学期','高三·上学期','高三·下学期']
  const jhs = all.filter(x => x.includes('初一')||x.includes('初二')||x.includes('初三'))
  const shs = all.filter(x => x.includes('高一')||x.includes('高二')||x.includes('高三'))
  const ps  = all.filter(x => /[三五六]年级/.test(x))
  if (/初/.test(g)) return jhs
  if (/高/.test(g)) return shs
  if (/[三五六]/.test(g)) return ps
  return all.filter(x => x.includes(g))
})
const masteryMap = { UNMASTERED:{label:'未掌握',tag:'danger'}, FAMILIAR:{label:'熟悉中',tag:'warning'}, MASTERED:{label:'已掌握',tag:'success'} }
const questions = ref([
  { id:1, type:'WRONG', title:'已知二次函数 y=x²-4x+3, 求该函数的最小值及对应的 x 值。', kpNames:['二次函数','最值问题'], knowledgePoints:['二次函数','最值问题'], gradeLevel:'初三·上学期', mastery:'FAMILIAR', masteryTag:'warning', masteryLabel:'熟悉中', difficulty:'MEDIUM', diffTag:'warning', errorType:'计算失误', date:'2026-07-03',
    analysis:'学生在配方过程中符号处理有误。x²-4x+3 = (x-2)²-1，当x=2时取最小值-1。',
    solution:'1. 配方: y=x²-4x+3=(x²-4x+4)-1=(x-2)²-1\n2. a=1>0,开口向上,有最小值\n3. 顶点(2,-1), min=-1 (x=2)',
    similarQuestions:['求 y=-x²+6x-5 的最大值','已知 y=a(x-h)²+k 过点(1,0)和(3,0),求h'], diagramImageUrl:'https://picsum.photos/400/300?random=1' },
  { id:2, type:'WRONG', title:'解一元二次方程 2x²-5x+2=0', kpNames:['一元二次方程','求根公式'], knowledgePoints:['一元二次方程','求根公式'], gradeLevel:'初三·上学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'EASY', diffTag:'success', errorType:'概念混淆', date:'2026-07-01',
    analysis:'混淆了求根公式中 a,b,c 的符号。x=(-b±√(b²-4ac))/2a。',
    solution:'a=2, b=-5, c=2\nΔ=(-5)²-4×2×2=25-16=9\nx=(5±3)/4\nx₁=2, x₂=1/2',
    similarQuestions:['解方程 x²-3x-10=0','解方程 3x²+4x-4=0'] },
  { id:3, type:'NEW', title:'在 Rt△ABC 中, ∠C=90°, AC=6, BC=8, 求 AB 的长及 sinA 的值。', kpNames:['勾股定理','三角函数'], knowledgePoints:['勾股定理','三角函数'], gradeLevel:'初三·下学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'EASY', diffTag:'success', date:'2026-07-02',
    solution:'AB=√(6²+8²)=10\nsinA=BC/AB=8/10=4/5', diagramImageUrl:'https://picsum.photos/400/300?random=2' },
  { id:4, type:'NEW', title:'已知反比例函数 y=k/x 过点(2,-3), 求 k 的值及函数图像所在的象限。', kpNames:['反比例函数'], knowledgePoints:['反比例函数'], gradeLevel:'初三·下学期', mastery:'UNMASTERED', masteryTag:'danger', masteryLabel:'未掌握', difficulty:'MEDIUM', diffTag:'warning', date:'2026-07-02',
    solution:'-3=k/2 → k=-6\nk<0, 图像在第二、四象限' },
  { id:5, type:'WRONG', title:'若关于 x 的方程 x²+(m-1)x+m²-1=0 有两个不相等的实数根, 求 m 的取值范围。', kpNames:['一元二次方程','判别式','不等式'], knowledgePoints:['一元二次方程','判别式','不等式'], gradeLevel:'初三·上学期', mastery:'FAMILIAR', masteryTag:'warning', masteryLabel:'熟悉中', difficulty:'HARD', diffTag:'danger', errorType:'审题不清', date:'2026-06-28',
    analysis:'判别式展开时出错。Δ=(m-1)²-4(m²-1)=m²-2m+1-4m²+4=-3m²-2m+5>0',
    solution:'Δ=(m-1)²-4(m²-1)=-3m²-2m+5>0\n→ 3m²+2m-5<0 → (3m+5)(m-1)<0\n→ -5/3<m<1',
    similarQuestions:['已知 x²+2kx+k²-4=0 有两个不等实根,求k'] }
])

// ═══════════ 答题相关状态 ═══════════
const fsSubmitted = ref(false)
const fsAiResult = ref('')
const fsAiCorrect = ref(false)
const fsSentToTeacher = ref(false)
const lastAnswerText = ref('')
const lastAnswerImage = ref('')
const lastAnswerHtml = ref('')
watch([lastAnswerText], async ([v]) => { if (v) lastAnswerHtml.value = await renderMarkdown(v) })
const uploadedAnswerImg = ref('')
const uploadedAnswerFile = ref(null)
const zoomFsDiagram = ref(false)

const canSubmit = computed(() => !!uploadedAnswerImg.value && !!uploadedAnswerFile.value)

// ═══════════ 提交 & AI 批改 ═══════════
function onAnswerImgUpload(e) {
  const f = e.target.files?.[0]
  if (f) { uploadedAnswerFile.value = f; uploadedAnswerImg.value = URL.createObjectURL(f) }
  e.target.value = ''
}

async function submitAnswer() {
  if (!canSubmit.value || !fsQuestion.value) return

  // 智学点消耗检查（5 点）
  try {
    const pts = await http.get('/user/points')
    const balance = pts?.points ?? pts?.data?.points ?? 0
    if (balance < 5) {
      ElMessageBox.confirm(`智学点不足！当前余额 ${balance} 点，本次 AI 批改需消耗 5 点。是否前往充值？`, '智学点不足', { confirmButtonText:'去充值', cancelButtonText:'取消', type:'warning' })
        .then(() => router.push('/' + (route.path.startsWith('/teacher') ? 'teacher' : 'student') + '/recharge'))
      return
    }
    await ElMessageBox.confirm(`本次 AI 批改将消耗 5 智学点（当前余额 ${balance} 点），是否继续？`, '确认消耗', { confirmButtonText:'确认批改', cancelButtonText:'取消', type:'info' })
  } catch (e) { if (e !== 'confirm') return }

  ElMessage.info('AI 正在批改你的答案…')

  // 保存「上次答题」图片（本地展示）
  lastAnswerImage.value = uploadedAnswerImg.value
  lastAnswerText.value = ''

  // 提交 AI 批改（multipart，字段名必须是 file）
  const fd = new FormData()
  fd.append('file', uploadedAnswerFile.value)
  try {
    const res = await http.post(`/student/questions/${fsQuestion.value.id}/grade`, fd)
    // res 已由拦截器解包为 { correct, result, cached }
    fsAiCorrect.value = res.correct
    fsAiResult.value = await renderMarkdown(res.result || '')
    fsSubmitted.value = true
    if (res.cached) ElMessage.info('该题已批改过，本次未扣智学点')
  } catch (e) {
    // 余额不足（后端兜底）：拦截器已弹错误，这里补跳充值
    if (/智学点不足/.test(e?.message || '')) {
      ElMessageBox.confirm('智学点不足，是否前往充值？', '智学点不足', { confirmButtonText:'去充值', cancelButtonText:'取消', type:'warning' })
        .then(() => router.push('/' + (route.path.startsWith('/teacher') ? 'teacher' : 'student') + '/recharge'))
    }
    // 401/403/404/500 已由拦截器统一提示，不重复处理
  }
}

function disputeToTeacher() {
  if (fsSentToTeacher.value) return
  fsSentToTeacher.value = true
  ElMessage.success('答题内容已转为图片，送往老师端批改。请等待老师反馈～')
}

function updateFsMastery() {
  if (fsQuestion.value) {
    fsQuestion.value.masteryTag = masteryMap[fsQuestion.value.mastery].tag
    fsQuestion.value.masteryLabel = masteryMap[fsQuestion.value.mastery].label
    if (fsQuestion.value.mastery === 'MASTERED') completedSet.value.add(fsQuestion.value.id)
    else completedSet.value.delete(fsQuestion.value.id)
    // 保存到后端
    http.put(`/student/questions/${fsQuestion.value.id}/mastery`, {
      mastery: fsQuestion.value.mastery,
      completed: fsQuestion.value.mastery === 'MASTERED'
    }).catch(() => {})
    // 强制触发 computed 刷新
    questions.value = [...questions.value]
  }
  ElMessage.success('掌握度已更新')
}

// ═══════════ 原有逻辑 ═══════════
const allKps = computed(() => [...new Set(questions.value.flatMap(q=>q.kpNames||[]))].sort())
function toggleKp(kp) { const i=filterKps.value.indexOf(kp); i>=0?filterKps.value.splice(i,1):filterKps.value.push(kp) }

const filteredQuestions = computed(() => questions.value.filter(q => {
  if (tab.value === 'wrong' && q.type !== 'WRONG') return false
  if (tab.value === 'new' && q.type !== 'NEW') return false
  const qKps = q.kpNames || []
  if (filterKps.value.length && !filterKps.value.some(kp=>qKps.includes(kp))) return false
  if (filterMastery.value && q.mastery !== filterMastery.value) return false
  if (filterDiff.value && q.difficulty !== filterDiff.value) return false
  if (filterGrade.value && q.gradeLevel !== filterGrade.value) return false
  return true
}))

const filteredList = computed(() => filteredQuestions.value)

// ═══════════ 错题分析 ═══════════
const wrongTotal = computed(() => questions.value.filter(q => q.type === 'WRONG').length)
const newTotal = computed(() => questions.value.filter(q => q.type === 'NEW').length)
const analysisKps = computed(() => {
  const wrongQs = questions.value.filter(q => q.type === 'WRONG')
  const map = {}
  wrongQs.forEach(q => {
    (q.kpNames || []).forEach(kp => {
      if (!map[kp]) map[kp] = { name: kp, total: 0, unmastered: 0, familiar: 0, mastered: 0 }
      map[kp].total++
      if (q.mastery === 'UNMASTERED') map[kp].unmastered++
      else if (q.mastery === 'FAMILIAR') map[kp].familiar++
      else map[kp].mastered++
    })
  })
  return Object.values(map).map(kp => ({
    ...kp,
    weakPercent: wrongTotal.value ? Math.round(kp.total / wrongTotal.value * 100) : 0,
    advice: kp.unmastered >= 2 ? '需专项训练' : kp.unmastered >= 1 ? '加强复习' : '保持巩固'
  })).sort((a, b) => b.total - a.total)
})
const weakKps = computed(() => analysisKps.value.filter(kp => kp.weakPercent >= 25 || kp.unmastered >= 2))
const masteryDist = computed(() => {
  const wrongQs = questions.value.filter(q => q.type === 'WRONG')
  const total = wrongQs.length || 1
  const unmastered = wrongQs.filter(q => q.mastery === 'UNMASTERED').length
  const familiar = wrongQs.filter(q => q.mastery === 'FAMILIAR').length
  const mastered = wrongQs.filter(q => q.mastery === 'MASTERED').length
  return [
    { label: '😰 未掌握', count: unmastered, percent: Math.round(unmastered/total*100), color: '#EF4444' },
    { label: '🤔 熟悉中', count: familiar, percent: Math.round(familiar/total*100), color: '#F59E0B' },
    { label: '😎 已掌握', count: mastered, percent: Math.round(mastered/total*100), color: '#10B981' }
  ]
})
function exportAnalysisPDF() {
  const content = document.getElementById('analysis-report')
  if (!content) return
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  let styleHtml = ''
  styles.forEach(s => { styleHtml += s.outerHTML })
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>错题综合分析报告</title>${styleHtml}<style>
    body { font-family: -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif; padding:24px 28px; color:#333; }
    .ana-wrap { max-width:700px; margin:0 auto; }
    .ana-overview { display:flex; gap:16px; margin-bottom:24px; }
    .ana-ov-item { flex:1; text-align:center; background:#F8FAFC; padding:16px 8px; border-radius:12px; }
    .aov-num { font-size:28px; font-weight:800; color:#6366F1; display:block; }
    .aov-label { font-size:12px; color:#999; }
    .ana-section { margin-bottom:24px; }
    .ana-section h4 { font-size:16px; margin-bottom:12px; }
    .aw-item { background:#FFF5F5; border-radius:10px; padding:12px 14px; margin-bottom:8px; }
    .awi-top { display:flex; justify-content:space-between; margin-bottom:6px; }
    .awi-name { font-weight:700; }
    .awi-badge { background:#EF4444; color:#fff; font-size:11px; padding:1px 8px; border-radius:10px; }
    .awi-bar { height:8px; background:#fee; border-radius:4px; margin-bottom:4px; overflow:hidden; }
    .awib-fill { height:100%; display:block; border-radius:4px; }
    .awi-stats { font-size:12px; color:#888; display:flex; gap:12px; }
    .awi-unmastered { color:#EF4444; }
    .ana-table { width:100%; border-collapse:collapse; font-size:13px; }
    .ana-table th { background:#F8FAFC; padding:8px 10px; text-align:left; font-weight:600; border-bottom:2px solid #e0e0e0; }
    .ana-table td { padding:8px 10px; border-bottom:1px solid #f0f0f0; }
    .aw-row { background:#FFFBFB; }
    .at-red { color:#EF4444; font-weight:600; }
    .at-yellow { color:#F59E0B; }
    .at-green { color:#10B981; }
    .at-advice { font-size:12px; color:#999; }
    .amb-item { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .amb-label { width:80px; font-size:13px; }
    .amb-bar-wrap { flex:1; height:20px; background:#f0f0f0; border-radius:10px; overflow:hidden; }
    .amb-fill { height:100%; display:block; border-radius:10px; }
    .amb-count { font-size:12px; color:#888; white-space:nowrap; }
    .ana-footer-text { text-align:center; color:#ccc; font-size:11px; margin-top:24px; border-top:1px solid #f0f0f0; padding-top:12px; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style></head><body>${content.innerHTML}</body></html>`)
  win.document.close()
  setTimeout(() => { win.print() }, 300)
}

async function findSimilarForQ(targetQ) {
  if (!targetQ) return []
  const kpIds = (targetQ.knowledgePointIds || '').toString()
  if (!kpIds) return []  // 没标注知识点 → 不举一反三
  try {
    const r = await getSimilarQuestions({ subject: 'math', kpId: kpIds.split(',')[0], count: 3, excludeId: targetQ.id })
    return (r?.list || r || []).slice(0, 3)
  } catch { return [] }
}

async function viewQuestion(q) {
  currentQ.value = { ...q }
  if (q.title) currentQ.value._titleHtml = await renderMarkdown(q.title)
  // 生成举一反三（渲染公式）
  const simTitles = await findSimilarForQ(q)
  currentQ.value.similarQuestions = await Promise.all(simTitles.map(async q => ({ ...q, _html: await renderMarkdown(q.title || '') })))
  const cleanAndRender = async (t) => {
    if (!t) return '<span style="color:#999">暂无数据</span>'
    if (/class="katex"/.test(t)) return sanitizeHtml(t)  // 已渲染 HTML 直接展示（仍需消毒）
    // 纯文本 → 直接渲染（保留换行等原始格式）
    return await renderMarkdown(t)
  }
  currentQ.value.analysis = await cleanAndRender(q.analysis)
  currentQ.value.solution = await cleanAndRender(q.solution)
  // 老师解析：文本 + 图片合并
  if (q.teacherAnalysis || q.teacherAnalysisImage) {
    let taHtml = q.teacherAnalysis ? await renderMarkdown(q.teacherAnalysis) : ''
    if (q.teacherAnalysisImage) taHtml += `<img src="${resolveStaticUrl(q.teacherAnalysisImage)}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:8px"/>`
    currentQ.value._teacherAnalysisHtml = taHtml
  } else {
    currentQ.value._teacherAnalysisHtml = '老师暂未上传解析'
  }
  showDetail.value = true
  currentQ.value._idx = filteredList.value.findIndex(x=>x.id===q.id)
}
function goToSimilar(q) { sessionStorage.setItem("qb_focus_question", q.title); showDetail.value = false; enterFullscreen() }
function goNextQuestion() {
  const idx = currentQ.value?._idx; const list = filteredList.value
  if (idx >= 0 && idx < list.length - 1) { viewQuestion(list[idx + 1]) }
  else { ElMessage.info('已经是最后一题了'); showDetail.value = false }
}

onMounted(() => {
  const focusTitle = sessionStorage.getItem('qb_focus_question')
  if (focusTitle) {
    sessionStorage.removeItem('qb_focus_question')
    const q = questions.value.find(x => x.title.includes(focusTitle.slice(0,20)))
    if (q) { tab.value = 'wrong'; enterFullscreen(); selectFsKp(q.knowledgePoints?.[0] || q.knowledgePoint); fsPool.value = [q]; fsIdx = 0; setFsQuestion(q) }
  }
})
function updateMastery() {
  if (currentQ.value) {
    currentQ.value.masteryTag = masteryMap[currentQ.value.mastery]?.tag
    currentQ.value.masteryLabel = masteryMap[currentQ.value.mastery]?.label
    http.put(`/student/questions/${currentQ.value.id}/mastery`, {
      mastery: currentQ.value.mastery,
      completed: currentQ.value.mastery === 'MASTERED'
    }).catch(() => {})
    // 同步更新 questions 数组
    const q = questions.value.find(x => x.id === currentQ.value.id)
    if (q) { q.mastery = currentQ.value.mastery; q.masteryTag = currentQ.value.masteryTag; q.masteryLabel = currentQ.value.masteryLabel }
    questions.value = [...questions.value]
    ElMessage.success('掌握度已更新')
  }
}

function enterFullscreen() {
  isFullscreen.value = true; seconds = 0; elapsed.value = '00:00'; fsIdx = 0; showFsAnswer.value = false
  completedSet.value = new Set(filteredQuestions.value.filter(q => q.mastery === 'MASTERED' || q.completed).map(q => q.id))
  // 重置答题状态
  fsSubmitted.value = false
  fsAiResult.value = ''
  fsSentToTeacher.value = false
  uploadedAnswerImg.value = ''
  timer = setInterval(() => { seconds++; const m=Math.floor(seconds/60).toString().padStart(2,'0'); const s=(seconds%60).toString().padStart(2,'0'); elapsed.value=`${m}:${s}` }, 1000)
  const pool = filteredQuestions.value
  const kpMap = {}
  pool.forEach(q => { q.kpNames.forEach(kp => { if(!kpMap[kp]) kpMap[kp]=0; kpMap[kp]++ }) })
  fsKpList.value = Object.entries(kpMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)
  fsPool.value = pool; fsActiveKp.value = ''
  setFsQuestion(pool.length ? pool[0] : null)
  document.addEventListener('keydown', onKeyDown)
}
function selectFsKp(kpName) {
  fsActiveKp.value = kpName; fsIdx = 0; showFsAnswer.value = false
  resetAnswerState()
  fsPool.value = filteredQuestions.value.filter(q => q.kpNames.includes(kpName))
  setFsQuestion(fsPool.value.length ? fsPool.value[0] : null)
}
function resetAnswerState() {
  fsSubmitted.value = false; fsAiResult.value = ''; fsSentToTeacher.value = false
  uploadedAnswerImg.value = ''; uploadedAnswerFile.value = null; lastAnswerText.value = ''; lastAnswerImage.value = ''; lastAnswerHtml.value = ''
}
function exitFullscreen() { isFullscreen.value = false; clearInterval(timer); document.removeEventListener('keydown', onKeyDown) }
function onKeyDown(e) { if (e.key === 'Escape') exitFullscreen() }
function nextFsQuestion(mastery) {
  if (mastery && fsQuestion.value) { fsQuestion.value.mastery = mastery; fsQuestion.value.masteryTag = masteryMap[mastery].tag; fsQuestion.value.masteryLabel = masteryMap[mastery].label }
  fsGoNext()
}
function fsGoNext() {
  showFsAnswer.value = false; resetAnswerState(); fsIdx++
  const pool = fsActiveKp.value ? fsPool.value : filteredQuestions.value
  setFsQuestion(fsIdx < pool.length ? pool[fsIdx] : null)
  if (!fsQuestion.value) exitFullscreen()
}
</script>

<style scoped>
.qb-page { max-width: 780px; margin: 0 auto; padding: 20px 14px 40px; }
/* ═══ 头部 ═══ */
.qb-hero { display: flex; justify-content: space-between; align-items: center; padding: 12px 0 20px; }
.qbh-left { display: flex; align-items: center; gap: 12px; }
.qbh-icon { font-size: 36px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.qbh-left h2 { font-size: 20px; font-weight: 800; margin-bottom: 2px; color: var(--text-primary); }
.qbh-left p { font-size: 12px; color: var(--text-muted); }
.qbh-actions { display: flex; gap: 8px; }

/* ═══ 标签页 ═══ */
.qb-tabs { display: flex; gap: 4px; padding: 4px; background: var(--color-bg-alt); border-radius: 12px; margin-bottom: 16px; }
.qbt { display: flex; align-items: center; gap: 6px; flex: 1; padding: 10px 16px; border: none; border-radius: 10px; background: transparent; color: var(--text-muted); font-size: 14px; cursor: pointer; transition: all .2s; font-family: inherit; }
.qbt:hover { color: var(--text-primary); }
.qbt.active { background: #fff; color: var(--color-primary); font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.qbt-icon { font-size: 16px; }
.qbt-count { font-size: 11px; background: var(--color-bg-alt); padding: 1px 8px; border-radius: 10px; color: var(--text-muted); }
.qbt.active .qbt-count { background: var(--color-primary-bg); color: var(--color-primary); }

/* ═══ 筛选栏 ═══ */
.qb-filter-bar { background: #fff; border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.03); border: 1px solid var(--color-border-light); }
.qbf-left { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.qbf-select { width: 110px; }
.qbf-count { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.kp-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.kpc-label { font-size: 12px; color: var(--text-muted); flex-shrink: 0; margin-right: 2px; }
.kpc-chip { padding: 4px 12px; border-radius: 14px; font-size: 12px; background: var(--color-bg-alt); border: 1px solid transparent; cursor: pointer; transition: all .15s; color: var(--text-secondary); }
.kpc-chip:hover { border-color: var(--color-primary-light); color: var(--color-primary); background: #fff; }
.kpc-chip.active { background: var(--color-primary-bg); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }

/* ═══ 题目网格 ═══ */
.qb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.q-card { display: flex; gap: 12px; background: #fff; border-radius: 14px; padding: 16px; cursor: pointer; transition: all .2s; box-shadow: 0 1px 4px rgba(0,0,0,.03); border: 1px solid var(--color-border-light); }
.q-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,.06); border-color: var(--color-primary-light); }
.qc-left { flex-shrink: 0; padding-top: 2px; }
.qc-dot { display: block; width: 10px; height: 10px; border-radius: 50%; }
.qc-dot.red { background: #EF4444; }
.qc-dot.yellow { background: #F59E0B; }
.qc-dot.green { background: #10B981; }
.qc-main { flex: 1; min-width: 0; }
.qc-title { font-size: 13px; color: var(--text-primary); line-height: 1.6; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.qc-title :deep(.katex) { font-size: 0.9em; }
.qc-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
.qc-error { font-size: 11px; color: #EF4444; background: #FEF2F2; padding: 1px 8px; border-radius: 10px; }
.qc-date { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.qc-kps { display: flex; gap: 4px; flex-wrap: wrap; }
.result-card { background: #fff; border-radius: 16px; }
.rc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rc-error-tag { font-size: 11px; color: #EF4444; background: #FEF2F2; padding: 1px 8px; border-radius: 10px; margin-left: 8px; }
.rc-date { font-size: 13px; color: #999; }
.rc-body { display: flex; gap: 20px; }
.rc-detail { flex: 1; min-width: 0; }
.rc-diagram { flex-shrink: 0; width: 200px; text-align: center; cursor: pointer; }
.rc-diagram-img { width: 200px; height: 200px; object-fit: contain; border-radius: 12px; background: #f5f5f5; border: 1px solid var(--color-border-light); }
.rc-diagram-empty { width: 200px; height: 200px; border-radius: 12px; background: var(--color-bg-alt); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 13px; line-height: 1.6; }
.rc-zoom-hint { display: block; font-size: 11px; color: var(--color-primary); margin-top: 4px; }
.rc-detail { flex: 1; }
.rc-title { font-size: 14px; font-weight: 600; line-height: 1.6; margin-bottom: 8px; color: #333; word-break: break-word; overflow-wrap: break-word; }
.rc-kps { margin-bottom: 12px; }
.rd-row { margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.rd-label { font-weight: 600; font-size: 14px; }
.rd-text { background: #F8FAFC; padding: 10px 12px; border-radius: 10px; font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; }
.rd-text.solution { background: #F0FDF4; }
.rd-text :deep(.katex) { font-size: 0.92em; white-space: normal !important; word-break: break-all; }
.similar-list { }
.similar-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #555; cursor: pointer; transition: all .15s; align-items: center; }
.similar-item:hover { color: var(--color-primary); background: var(--color-primary-bg); margin: 0 -8px; padding: 8px 8px; border-radius: 6px; }
.si-num { width: 22px; height: 22px; background: var(--color-primary-bg); color: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.si-arrow { margin-left: auto; opacity: 0; transition: opacity .15s; color: var(--color-primary); }
.similar-item:hover .si-arrow { opacity: 1; }
.rc-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: space-between; align-items: center; }
.d-mastery { display: flex; align-items: center; gap: 10px; }
@media (max-width: 640px) { .rc-body { flex-direction: column; } .rc-diagram-img { width: 100%; height: 180px; } }
.d-solution { background: #F0FDF4; padding: 12px; border-radius: 10px; font-family: monospace; white-space: pre-wrap; }
.d-similar { padding: 6px 0; font-size: 13px; color: #555; }
.d-mastery { display: flex; align-items: center; gap: 10px; margin-top: 16px; }

/* ═══════════ 全屏模式 ═══════════ */
.qb-page.fullscreen { max-width: 100%; min-height: 100vh; background: linear-gradient(160deg,#F0F4FF,#FCE4EC,#FFF8E1); display: flex; flex-direction: column; }
.fs-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: rgba(255,255,255,.75); backdrop-filter: blur(12px); flex-shrink: 0; }
.fs-timer { font-size: 24px; font-weight: 700; font-family: monospace; color: var(--color-primary); }
.fs-progress { font-size: 13px; color: #666; white-space: nowrap; }
.fs-progress-bar { flex:1; height:6px; background:#e0e0e0; border-radius:3px; overflow:hidden; max-width:200px; }
.fs-pb-fill { height:100%; background:var(--color-primary); border-radius:3px; transition:width .3s; display:block; }
.fs-top-right { display: flex; gap: 8px; align-items: center; }
.fs-label { font-size: 14px; color: #888; }
.fs-wrap { flex: 1; display: flex; overflow: hidden; min-height: 0; }
.fs-sidebar { width: 170px; background: rgba(255,255,255,.7); padding: 14px 10px; overflow-y: auto; flex-shrink: 0; }
.fs-side-title { font-size: 13px; font-weight: 700; color: #555; margin-bottom: 10px; }
.fs-kp-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 9px; border-radius: 10px; cursor: pointer; font-size: 12px; color: #666; transition: all .15s; margin-bottom: 2px; }
.fs-kp-item:hover { background: var(--color-primary-bg); color: var(--color-primary); }
.fs-kp-item.active { background: var(--color-primary-bg); color: var(--color-primary); font-weight: 700; }
.fsk-count { font-size: 10px; background: #eee; padding: 2px 7px; border-radius: 10px; color: #999; }
.fs-kp-item.active .fsk-count { background: var(--color-primary); color: #fff; }

/* 主区域 */
.fs-body { flex: 1; display: flex; overflow: hidden auto; min-height: 0; }
.fs-main { flex: 1; display: flex; flex-direction: column; padding: 20px 24px; gap: 16px; min-height: 0; max-width: 100%; }

/* 题目区域 */
.fs-question-area { display: flex; gap: 20px; background: rgba(255,255,255,.8); border-radius: 16px; padding: 20px 24px; flex-shrink: 0; min-width: 0; }
.fs-q-left { flex: 1; min-width: 0; overflow: hidden; }
.fs-q-tags { margin-bottom: 12px; display: flex; gap: 3px; flex-wrap: wrap; }
.fs-q-text { font-size: 18px; line-height: 1.9; color: #333; font-weight: 500; word-break: break-word; }
.fs-q-right { flex-shrink: 0; width: 200px; text-align: center; }
.fs-q-diagram { width: 200px; height: 200px; object-fit: contain; border-radius: 12px; background: #f5f5f5; cursor: pointer; border: 1px solid var(--color-border-light); }
.fs-q-zoom-hint { display: block; font-size: 11px; color: var(--color-primary); margin-top: 4px; }

/* 答题区域 */
.fs-answer-area { flex: 1; display: flex; flex-direction: column; background: rgba(255,255,255,.8); border-radius: 16px; padding: 16px 20px; min-height: 0; }
/* 上传答题 */
.fs-upload-wrap { flex: 1; display: flex; align-items: center; justify-content: center; }
.fs-upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; max-width: 320px; padding: 40px; border: 2px dashed var(--color-border);
  border-radius: 16px; cursor: pointer; transition: all .2s; background: rgba(255,255,255,.5);
}
.fs-upload-zone:hover { border-color: var(--color-primary-light); background: var(--color-primary-bg); }
.fuz-icon { font-size: 42px; margin-bottom: 8px; }
.fuz-text { font-size: 14px; color: #555; font-weight: 500; }
.fuz-hint { font-size: 12px; color: #999; margin-top: 4px; }
.fs-upload-preview { text-align: center; }
.fup-img { max-width: 300px; max-height: 260px; border-radius: 12px; margin-bottom: 10px; border: 1px solid var(--color-border); }

/* 提交行 */
.fs-submit-row { text-align: center; padding: 12px 0 4px; flex-shrink: 0; }

/* AI 批改结果 */
.fs-result-area { background: rgba(255,255,255,.85); border-radius: 16px; padding: 16px 20px; flex-shrink: 0; }
.fsr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.fsr-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.fsr-body { font-size: 14px; line-height: 1.8; color: #555; }
.fsr-body :deep(ol), .fsr-body :deep(ul) { padding-left: 18px; margin: 6px 0; }
.fsr-body :deep(li) { margin-bottom: 4px; }
.fsr-correct { font-size: 16px; color: #10B981; margin-bottom: 6px; }
.fsr-wrong { font-size: 15px; color: #EF4444; margin-bottom: 6px; }
.fsr-tip { background: var(--color-primary-bg); padding: 10px 14px; border-radius: 8px; margin-top: 10px; font-size: 13px; }
.fsr-actions { margin-top: 12px; text-align: right; }

/* 解析区域 */
.fs-answer { background: rgba(255,255,255,.8); border-radius: 16px; padding: 16px 20px; flex-shrink: 0; }
.fs-last-answer { background: rgba(255,255,255,.8); border-radius: 16px; padding: 16px 20px; flex-shrink: 0; margin-top: 8px; }
.fs-last-answer .text-box { background:#F8FAFC; padding:10px; border-radius:8px; font-size:13px; line-height:1.6; }
.fsa-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.fs-answer pre { color: #555; font-size: 14px; line-height: 1.8; white-space: pre-wrap; font-family: monospace; }

/* 底部操作栏 */
.fs-bottom-bar { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,.8); border-radius: 16px; padding: 14px 20px; flex-shrink: 0; }
.fsb-left { display: flex; align-items: center; gap: 8px; }
.fsb-label { font-size: 13px; color: #888; }
.fsb-right { display: flex; gap: 8px; }

/* ── 错题分析弹窗 ── */
.ana-wrap { }
.ana-overview { display: flex; gap: 16px; margin-bottom: 24px; }
.ana-ov-item { flex: 1; text-align: center; background: #F8FAFC; padding: 16px 8px; border-radius: 12px; }
.aov-num { font-size: 28px; font-weight: 800; color: var(--color-primary); display: block; }
.aov-label { font-size: 12px; color: #999; }
.ana-section { margin-bottom: 24px; }
.ana-section h4 { font-size: 16px; margin-bottom: 12px; }
.aw-item { background: #FFF5F5; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
.awi-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.awi-name { font-weight: 700; }
.awi-badge { background: #EF4444; color: #fff; font-size: 11px; padding: 1px 8px; border-radius: 10px; }
.awi-bar { height: 8px; background: #FEE; border-radius: 4px; margin-bottom: 4px; overflow: hidden; }
.awib-fill { height: 100%; display: block; border-radius: 4px; }
.awi-stats { font-size: 12px; color: #888; display: flex; gap: 12px; }
.awi-unmastered { color: #EF4444; }
.ana-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ana-table th { background: #F8FAFC; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
.ana-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
.aw-row { background: #FFFBFB; }
.at-red { color: #EF4444; font-weight: 600; }
.at-yellow { color: #F59E0B; }
.at-green { color: #10B981; }
.at-advice { font-size: 12px; color: #999; }
.amb-item { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.amb-label { width: 80px; font-size: 13px; }
.amb-bar-wrap { flex: 1; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.amb-fill { height: 100%; display: block; border-radius: 10px; }
.amb-count { font-size: 12px; color: #888; white-space: nowrap; }
.ana-footer-text { text-align: center; color: #ccc; font-size: 11px; margin-top: 24px; border-top: 1px solid #f0f0f0; padding-top: 12px; }

/* 旧版全屏卡片（保留兼容） */
.fs-card { display: none; }
.fs-kps { margin-bottom: 12px; }
.fs-q { font-size: 20px; line-height: 2; margin-bottom: 32px; color: #333; }
.fs-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.fs-bottom { display: flex; gap: 16px; justify-content: center; margin-top: 12px; }

@media (max-width: 768px) {
  .fs-sidebar { display: none; }
  .fs-question-area { flex-direction: column; padding: 14px 16px; }
  .fs-q-right { width: 100%; }
  .fs-q-diagram { width: 100%; height: 160px; }
  .fs-q-text { font-size: 15px; }
  .fs-main { padding: 12px; gap: 10px; }
  .fs-top { padding: 10px 14px; }
  .fs-timer { font-size: 18px; }
}
@media (max-width: 480px) { .qb-grid { grid-template-columns: 1fr; } }
</style>
