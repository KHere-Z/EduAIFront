<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>AI 阅读理解</h2>
        <p>精选英语文章，AI 自动出题和批改</p>
      </div>
    </div>

    <!-- 文章列表（未选中文章时） -->
    <div v-if="!selectedArticle">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="8" v-for="a in articles" :key="a.id" class="mb-lg">
          <el-card shadow="hover" class="article-card">
            <div class="article-header">
              <h3>{{ a.title }}</h3>
              <el-tag
                :type="a.level === 'easy' ? 'success' : a.level === 'medium' ? 'warning' : 'danger'"
                size="small"
                effect="light"
              >
                {{ a.levelLabel }}
              </el-tag>
            </div>
            <p class="article-excerpt">{{ a.excerpt }}</p>
            <div class="article-meta">
              <span class="meta-item">词数: {{ a.wordCount }}</span>
              <span class="meta-item">题目: {{ a.questionCount }} 题</span>
              <span class="meta-item">{{ a.topic }}</span>
            </div>
            <el-button type="primary" size="small" @click="selectArticle(a)" style="width:100%;margin-top:12px">
              选题
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 文章阅读 + 答题界面 -->
    <div v-if="selectedArticle && !showResult">
      <el-card class="mb-lg">
        <div class="reader-header">
          <div>
            <h2>{{ selectedArticle.title }}</h2>
            <div class="reader-tags">
              <el-tag :type="levelTagType" size="small">{{ selectedArticle.levelLabel }}</el-tag>
              <span class="word-count">{{ selectedArticle.wordCount }} words</span>
            </div>
          </div>
          <el-button @click="selectedArticle = null">返回列表</el-button>
        </div>
      </el-card>

      <el-card class="mb-lg">
        <div class="article-content">{{ selectedArticle.content }}</div>
      </el-card>

      <el-card class="mb-lg">
        <template #header><span class="card-title">阅读选择题</span></template>
        <div v-for="(q, idx) in selectedArticle.questions" :key="q.id" class="question-block">
          <div class="question-stem">
            <span class="q-num">{{ idx + 1 }}.</span> {{ q.stem }}
          </div>
          <el-radio-group v-model="answers[q.id]" class="options-group">
            <el-radio v-for="(opt, k) in q.options" :key="k" :value="k" class="option-item">
              {{ k }}. {{ opt }}
            </el-radio>
          </el-radio-group>
        </div>
        <el-button type="primary" size="large" @click="submitAnswers" :disabled="!allAnswered" style="margin-top:16px">
          提交答案
        </el-button>
      </el-card>
    </div>

    <!-- AI批改结果 -->
    <div v-if="showResult">
      <el-card class="mb-lg">
        <div class="result-header">
          <h2>AI 批改结果</h2>
          <div class="total-score">
            <span class="score-number">{{ totalScore }}</span>
            <span class="score-unit">/ {{ selectedArticle.questions.length * 25 }} 分</span>
          </div>
        </div>
      </el-card>

      <el-card class="mb-lg">
        <template #header><span class="card-title">逐题分析</span></template>
        <div v-for="(q, idx) in selectedArticle.questions" :key="q.id" class="result-item">
          <div class="result-question">
            <span class="q-num">{{ idx + 1 }}.</span> {{ q.stem }}
          </div>
          <div class="result-compare">
            <div class="your-answer">
              <span class="label">你的答案:</span>
              <el-tag :type="answers[q.id] === q.answer ? 'success' : 'danger'" size="small">
                {{ answers[q.id] }}. {{ q.options[answers[q.id]] }}
              </el-tag>
              <span v-if="answers[q.id] !== q.answer" class="correct-label">
                正确答案: {{ q.answer }}. {{ q.options[q.answer] }}
              </span>
            </div>
          </div>
          <div class="ai-explanation" v-if="q.explanation">
            <el-icon><InfoFilled /></el-icon>
            <span>{{ q.explanation }}</span>
          </div>
        </div>
      </el-card>

      <!-- AI综合评价 -->
      <el-card>
        <template #header><span class="card-title">AI 综合评价</span></template>
        <div class="ai-feedback">
          <p><strong>整体表现:</strong> {{ aiFeedback.overall }}</p>
          <p><strong>阅读理解力:</strong> {{ aiFeedback.readingLevel }}</p>
          <p><strong>改进建议:</strong></p>
          <ul>
            <li v-for="tip in aiFeedback.suggestions" :key="tip">{{ tip }}</li>
          </ul>
        </div>
        <el-button type="primary" @click="resetReader" style="margin-top:16px">再做一篇</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedArticle = ref(null)
const showResult = ref(false)
const answers = ref({})
const totalScore = ref(0)
const aiFeedback = ref({})

const articles = [
  {
    id: 1, title: 'The Future of Remote Work', level: 'easy', levelLabel: '简单',
    topic: '科技', wordCount: 280, questionCount: 4,
    excerpt: 'Remote work has become a defining trend of the modern workplace. With advancements in technology, more companies are embracing flexible work arrangements...',
    content: 'Remote work has become a defining trend of the modern workplace. With advancements in technology, more companies are embracing flexible work arrangements.\n\nAccording to a recent survey, over 60% of workers now prefer hybrid models that combine office and home working. This shift has led to increased productivity in many sectors.\n\nHowever, challenges remain. Communication can be more difficult when teams are distributed across different time zones. Companies need to invest in the right tools and establish clear protocols.\n\nLooking ahead, experts predict that the future of work will be increasingly flexible, with technology playing a central role in bridging the gap between physical and virtual workplaces.',
    questions: [
      { id: 'q1', stem: 'What percentage of workers prefer hybrid models?', options: { A: 'Over 40%', B: 'Over 60%', C: 'Over 80%', D: 'About 50%' }, answer: 'B', explanation: '第二段明确提到 "over 60% of workers prefer hybrid models"' },
      { id: 'q2', stem: 'What is a challenge mentioned for remote work?', options: { A: 'Higher office costs', B: 'Communication difficulties', C: 'Less work-life balance', D: 'Slower internet' }, answer: 'B', explanation: '第三段指出 "Communication can be more difficult when teams are distributed"' },
      { id: 'q3', stem: 'The word "embracing" in paragraph 1 most nearly means:', options: { A: 'Rejecting', B: 'Accepting', C: 'Ignoring', D: 'Questioning' }, answer: 'B', explanation: '"embracing" 在此处意为"接纳、采用"，与 accepting 同义' },
      { id: 'q4', stem: 'What is the main idea of this article?', options: { A: 'Technology is harmful to work', B: 'Offices should be closed', C: 'Remote work is growing with benefits and challenges', D: 'All workers prefer remote work' }, answer: 'C', explanation: '全文主要讨论远程工作的增长趋势、益处与挑战' }
    ]
  },
  {
    id: 2, title: 'Climate Change and Biodiversity', level: 'medium', levelLabel: '中等',
    topic: '环境', wordCount: 350, questionCount: 4,
    excerpt: 'Climate change poses one of the greatest threats to global biodiversity. Rising temperatures, changing weather patterns, and extreme events are affecting ecosystems worldwide...',
    content: 'Climate change poses one of the greatest threats to global biodiversity. Rising temperatures, changing weather patterns, and extreme events are affecting ecosystems worldwide.\n\nScientists estimate that up to one million species face extinction within decades if current trends continue. Coral reefs, which support roughly 25% of marine life, are particularly vulnerable to ocean warming.\n\nConservation efforts have intensified in recent years. Protected areas now cover about 15% of the Earth\'s land surface. However, experts argue that more ambitious targets are needed.\n\nThe relationship between biodiversity and human well-being is direct: healthy ecosystems provide clean air, fresh water, and food security. Preserving biodiversity is not just an environmental concern — it is essential for human survival.',
    questions: [
      { id: 'q5', stem: 'How many species face extinction according to scientists?', options: { A: 'Up to 100,000', B: 'Up to 500,000', C: 'Up to one million', D: 'Up to ten million' }, answer: 'C', explanation: '第二段 "up to one million species face extinction"' },
      { id: 'q6', stem: 'What percentage of marine life do coral reefs support?', options: { A: '15%', B: '25%', C: '50%', D: '75%' }, answer: 'B', explanation: '第二段 "coral reefs support roughly 25% of marine life"' },
      { id: 'q7', stem: 'What area of land is currently protected?', options: { A: '5%', B: '10%', C: '15%', D: '25%' }, answer: 'C', explanation: '第三段 "Protected areas now cover about 15%"' },
      { id: 'q8', stem: 'What is the author\'s tone in the final paragraph?', options: { A: 'Humorous', B: 'Urgent', C: 'Indifferent', D: 'Skeptical' }, answer: 'B', explanation: '最后一段强调紧迫性，"essential for human survival" 体现急切语气' }
    ]
  },
  {
    id: 3, title: 'The Psychology of Habit Formation', level: 'hard', levelLabel: '困难',
    topic: '心理', wordCount: 420, questionCount: 4,
    excerpt: 'Understanding how habits form is crucial for personal development. Research in behavioral psychology has revealed fascinating insights into the mechanisms that drive automatic behaviors...',
    content: 'Understanding how habits form is crucial for personal development. Research in behavioral psychology has revealed fascinating insights into the mechanisms that drive automatic behaviors.\n\nThe habit loop, as described by Charles Duhigg, consists of three components: cue, routine, and reward. The cue triggers the brain to initiate a behavior, the routine is the behavior itself, and the reward reinforces the loop.\n\nNeuroscience research shows that as habits become ingrained, the brain activity associated with the behavior shifts from the prefrontal cortex to the basal ganglia. This shift explains why established habits can be so difficult to break.\n\nTo form a new habit, experts recommend starting small, being consistent, and linking the new behavior to an existing routine. It typically takes anywhere from 18 to 254 days for a new behavior to become automatic.',
    questions: [
      { id: 'q9', stem: 'According to Duhigg, what are the three components of the habit loop?', options: { A: 'Goal, action, result', B: 'Cue, routine, reward', C: 'Stimulus, response, feedback', D: 'Plan, execute, review' }, answer: 'B', explanation: '第二段明确界定 habit loop 三要素' },
      { id: 'q10', stem: 'Where does brain activity shift to as habits form?', options: { A: 'Prefrontal cortex', B: 'Amygdala', C: 'Basal ganglia', D: 'Hippocampus' }, answer: 'C', explanation: '第三段 "from the prefrontal cortex to the basal ganglia"' },
      { id: 'q11', stem: 'What is the recommended approach to forming new habits?', options: { A: 'Make drastic changes immediately', B: 'Start small and be consistent', C: 'Wait for motivation to appear', D: 'Force yourself through willpower' }, answer: 'B', explanation: '最后一段 "starting small, being consistent"' },
      { id: 'q12', stem: 'The word "ingrained" in paragraph 3 most nearly means:', options: { A: 'Reversible', B: 'Superficial', C: 'Deeply established', D: 'Recently acquired' }, answer: 'C', explanation: '"ingrained" 指"根深蒂固的"，与 deeply established 同义' }
    ]
  }
]

const levelTagType = computed(() => {
  if (!selectedArticle.value) return ''
  return selectedArticle.value.level === 'easy' ? 'success' : selectedArticle.value.level === 'medium' ? 'warning' : 'danger'
})

const allAnswered = computed(() => {
  if (!selectedArticle.value) return false
  return selectedArticle.value.questions.every(q => answers.value[q.id])
})

function selectArticle(a) {
  selectedArticle.value = a
  showResult.value = false
  answers.value = {}
  totalScore.value = 0
}

function submitAnswers() {
  const article = selectedArticle.value
  let correct = 0
  article.questions.forEach(q => {
    if (answers.value[q.id] === q.answer) correct++
  })
  totalScore.value = correct * 25

  const level = correct >= 3 ? '优秀' : correct >= 2 ? '良好' : '需加强'
  aiFeedback.value = {
    overall: `你在本篇文章中表现${level}，正确率 ${Math.round(correct / article.questions.length * 100)}%。`,
    readingLevel: correct >= 3 ? '能够准确把握文章主旨和关键细节' : correct >= 2 ? '基本理解文章内容，但在细节把握上还有提升空间' : '建议回到文章中仔细阅读，注意关键信息的定位',
    suggestions: correct >= 3
      ? ['继续保持广泛阅读的习惯', '尝试更快速度完成同类练习', '关注复杂句式中的逻辑关系']
      : correct >= 2
        ? ['建议逐段精读后做题', '注意选项中的同义替换', '练习定位文章中的关键信息']
        : ['先从较简单的文章开始', '建立阅读后归纳主旨的习惯', '每天坚持15分钟英语阅读']
  }
  showResult.value = true
  ElMessage.success('AI 批改完成')
}

function resetReader() {
  selectedArticle.value = null
  showResult.value = false
  answers.value = {}
  totalScore.value = 0
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }

/* 文章卡片 */
.article-card { cursor: pointer; }
.article-card:hover { border-color: var(--color-primary-light); }
.article-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.article-header h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.article-excerpt { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.article-meta { display: flex; gap: 12px; }
.meta-item { font-size: 12px; color: var(--text-muted); }

/* 阅读器 */
.reader-header { display: flex; align-items: flex-start; justify-content: space-between; }
.reader-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.reader-tags { display: flex; align-items: center; gap: 12px; }
.word-count { font-size: 13px; color: var(--text-muted); }
.article-content { font-size: 15px; line-height: 2; color: var(--text-primary); white-space: pre-line; }

/* 题目 */
.question-block { padding: 16px 0; border-bottom: 1px solid var(--color-border-light); }
.question-block:last-child { border-bottom: none; }
.question-stem { font-size: 15px; font-weight: 500; margin-bottom: 12px; }
.q-num { font-weight: 700; color: var(--color-primary); }
.options-group { display: flex; flex-direction: column; gap: 6px; padding-left: 24px; }
.option-item { font-size: 14px; color: var(--text-secondary); }

/* 结果 */
.result-header { text-align: center; padding: 16px 0; }
.result-header h2 { font-size: 20px; margin-bottom: 12px; }
.total-score { display: flex; align-items: baseline; justify-content: center; gap: 4px; }
.score-number { font-size: 48px; font-weight: 700; color: var(--color-primary); }
.score-unit { font-size: 18px; color: var(--text-muted); }
.result-item { padding: 14px 0; border-bottom: 1px solid var(--color-border-light); }
.result-item:last-child { border-bottom: none; }
.result-question { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
.result-compare { margin-bottom: 8px; }
.your-answer { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.your-answer .label { color: var(--text-muted); }
.correct-label { color: var(--color-success); font-size: 13px; }
.ai-explanation { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text-secondary); background: var(--color-bg-alt); padding: 8px 12px; border-radius: var(--radius-sm); }
.ai-feedback { font-size: 14px; line-height: 1.8; color: var(--text-secondary); }
.ai-feedback p { margin-bottom: 8px; }
.ai-feedback ul { padding-left: 20px; margin-bottom: 8px; }
.ai-feedback li { margin-bottom: 4px; }
</style>
