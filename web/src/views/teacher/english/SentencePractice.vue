<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>造句练习</h2>
        <p>根据语法点提示造句，即时获得反馈和纠正</p>
      </div>
    </div>

    <!-- 选择语法点 -->
    <el-card class="mb-lg">
      <template #header><span class="card-title">选择语法点</span></template>
      <el-select v-model="selectedPoint" placeholder="选择一个语法点开始练习" style="width:360px" @change="startPractice">
        <el-option-group v-for="cat in grammarPoints" :key="cat.category" :label="cat.category">
          <el-option v-for="p in cat.items" :key="p.id" :label="p.name" :value="p.id" />
        </el-option-group>
      </el-select>
      <el-tag v-if="currentPoint" type="primary" effect="plain" style="margin-left:12px" size="large">
        {{ currentPoint.name }}
      </el-tag>
    </el-card>

    <!-- 练习区域 -->
    <div v-if="currentPoint">
      <!-- 当前题目 -->
      <el-card class="mb-lg">
        <div class="prompt-section">
          <div class="prompt-header">
            <span class="round-badge">{{ currentRound }} / {{ totalRounds }}</span>
            <el-tag :type="currentPoint.level === 'basic' ? 'success' : currentPoint.level === 'intermediate' ? 'warning' : 'danger'" size="small">
              {{ currentPoint.levelLabel }}
            </el-tag>
          </div>
          <div class="prompt-card">
            <div class="prompt-grammar">
              <span class="grammar-tag">{{ currentPoint.name }}</span>
              <code class="grammar-formula">{{ currentPoint.formula }}</code>
            </div>
            <div class="prompt-question">{{ currentPrompt }}</div>
          </div>

          <!-- 输入区域 -->
          <div class="input-section mt-lg">
            <el-input
              v-model="userSentence"
              type="textarea"
              :rows="3"
              placeholder="请输入你造的句子..."
              :disabled="answered"
            />
            <div class="input-actions mt-lg">
              <el-button type="primary" size="large" @click="checkAnswer" :disabled="!userSentence.trim() || answered">
                提交检查
              </el-button>
              <el-button size="large" @click="skipQuestion" :disabled="answered">跳过</el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 反馈结果 -->
      <el-card v-if="answered" class="mb-lg" :class="['feedback-card', isCorrect ? 'feedback-correct' : 'feedback-incorrect']">
        <div class="feedback-header">
          <div v-if="isCorrect" class="correct-badge">
            <el-icon :size="20"><CircleCheckFilled /></el-icon>
            <span>正确！非常棒</span>
          </div>
          <div v-else class="incorrect-badge">
            <el-icon :size="20"><CircleCloseFilled /></el-icon>
            <span>还需改进</span>
          </div>
        </div>
        <div class="feedback-compare">
          <div class="compare-row">
            <span class="compare-label">你的句子:</span>
            <span :class="isCorrect ? 'text-correct' : 'text-incorrect'">{{ userSentence }}</span>
          </div>
          <div class="compare-row" v-if="!isCorrect">
            <span class="compare-label">参考答案:</span>
            <span class="text-reference">{{ currentPromptAnswer }}</span>
          </div>
        </div>
        <div class="feedback-explanation" v-if="!isCorrect">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ feedbackMessage }}</span>
        </div>
        <div class="feedback-explanation" v-else>
          <el-icon><InfoFilled /></el-icon>
          <span>句子结构正确，语法使用得当。</span>
        </div>
        <el-button type="primary" @click="nextQuestion" style="margin-top:12px">
          {{ currentRound >= totalRounds ? '查看总结' : '下一题' }}
        </el-button>
      </el-card>
    </div>

    <!-- 未选择语法点时的提示 -->
    <el-card v-if="!currentPoint">
      <el-empty description="请选择一个语法点开始造句练习" :image-size="100">
        <div class="practice-tips">
          <h4>练习提示</h4>
          <ul>
            <li>每个语法点包含 5 道造句练习</li>
            <li>AI 会自动检查你的语法和用词</li>
            <li>完成后可查看练习总结</li>
          </ul>
        </div>
      </el-empty>
    </el-card>

    <!-- 练习总结 -->
    <el-dialog v-model="showSummary" title="练习总结" width="560px">
      <div class="summary-stats">
        <div class="summary-score">
          <el-progress type="circle" :percentage="Math.round(correctCount / totalRounds * 100)" :color="'#6366F1'" :stroke-width="8" :width="120" />
        </div>
        <h3>正确率 {{ Math.round(correctCount / totalRounds * 100) }}%</h3>
        <p>答对 {{ correctCount }} / {{ totalRounds }} 题</p>
        <p>{{ summaryMessage }}</p>
      </div>
      <template #footer>
        <el-button @click="showSummary = false">关闭</el-button>
        <el-button type="primary" @click="restartPractice">再来一轮</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { InfoFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedPoint = ref('')
const currentPoint = ref(null)
const userSentence = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const currentRound = ref(0)
const totalRounds = 5
const correctCount = ref(0)
const showSummary = ref(false)
const feedbackMessage = ref('')
const currentPrompt = ref('')
const currentPromptAnswer = ref('')

const grammarPoints = [
  {
    category: '时态',
    items: [
      { id: 'gt1', name: '一般现在时', formula: 'S + V(s/es) + O', level: 'basic', levelLabel: '基础' },
      { id: 'gt2', name: '一般过去时', formula: 'S + V-ed + O', level: 'basic', levelLabel: '基础' },
      { id: 'gt3', name: '现在完成时', formula: 'S + have/has + V-ed(pp) + O', level: 'intermediate', levelLabel: '进阶' }
    ]
  },
  {
    category: '从句',
    items: [
      { id: 'gc1', name: '定语从句', formula: 'N + who/which/that + V...', level: 'intermediate', levelLabel: '进阶' },
      { id: 'gc2', name: '条件状语从句', formula: 'If + 现在时, 将来时', level: 'intermediate', levelLabel: '进阶' }
    ]
  },
  {
    category: '特殊句式',
    items: [
      { id: 'gs1', name: '比较级', formula: 'A + be + 比较级 + than + B', level: 'basic', levelLabel: '基础' },
      { id: 'gs2', name: '被动语态', formula: 'S + be + V-ed(pp) + (by O)', level: 'advanced', levelLabel: '高级' }
    ]
  }
]

// 每个语法点的题库
const questionBank = {
  gt1: [
    { prompt: '用一般现在时描述你的日常习惯。（提示词: every morning, read, English）', answer: 'I read English every morning.' },
    { prompt: '用一般现在时表达一个客观事实。（提示词: the sun, rise, east）', answer: 'The sun rises in the east.' },
    { prompt: '描述你的朋友经常做的事。（提示词: my friend, often, play, basketball）', answer: 'My friend often plays basketball.' },
    { prompt: '表达一个普遍规律。（提示词: water, freeze, 0°C）', answer: 'Water freezes at 0 degrees Celsius.' },
    { prompt: '描述你的家庭。（提示词: I, have, a happy family）', answer: 'I have a happy family.' }
  ],
  gt2: [
    { prompt: '描述你昨天做了什么。（提示词: yesterday, go to, park）', answer: 'I went to the park yesterday.' },
    { prompt: '描述过去的经历。（提示词: last summer, travel, Beijing）', answer: 'Last summer I traveled to Beijing.' },
    { prompt: '描述过去的一次晚餐。（提示词: have dinner, with my family, last night）', answer: 'I had dinner with my family last night.' },
    { prompt: '描述你上周末的活动。（提示词: last weekend, watch a movie）', answer: 'Last weekend I watched a movie.' },
    { prompt: '表达小时候的事。（提示词: when I was young, like drawing）', answer: 'When I was young, I liked drawing.' }
  ],
  gt3: [
    { prompt: '表达已经完成的某事。（提示词: already, finish, homework）', answer: 'I have already finished my homework.' },
    { prompt: '表达去过的地方。（提示词: ever, been to, Shanghai）', answer: 'Have you ever been to Shanghai?' },
    { prompt: '表达从未做过的事。（提示词: never, try, Japanese food）', answer: 'I have never tried Japanese food.' },
    { prompt: '表达最近刚发生的事。（提示词: just, receive, a letter）', answer: 'I have just received a letter.' },
    { prompt: '表达从过去开始持续到现在。（提示词: live here, since 2015）', answer: 'I have lived here since 2015.' }
  ],
  gc1: [
    { prompt: '描述一个人正在做什么。（提示词: the girl, who, sing, is my sister）', answer: 'The girl who is singing is my sister.' },
    { prompt: '描述你买过的东西。（提示词: the book, that, I buy, yesterday）', answer: 'This is the book that I bought yesterday.' },
    { prompt: '描述你去的地方。（提示词: the city, where, I was born）', answer: 'This is the city where I was born.' },
    { prompt: '描述你认识的人。（提示词: the man, who(m), I met）', answer: 'The man whom I met is a doctor.' },
    { prompt: '描述一个你喜欢的东西。（提示词: the movie, which, I watched）', answer: 'The movie which I watched was very touching.' }
  ],
  gc2: [
    { prompt: '表达如果明天下雨会怎样。（提示词: if, rain tomorrow, stay home）', answer: 'If it rains tomorrow, I will stay home.' },
    { prompt: '表达努力学习的结果。（提示词: if, study hard, pass the exam）', answer: 'If I study hard, I will pass the exam.' },
    { prompt: '表达有时间会做的事。（提示词: if, have time, call you）', answer: 'If I have time, I will call you.' },
    { prompt: '表达不努力的结果。（提示词: if, not hurry, miss the bus）', answer: 'If you don\'t hurry, you will miss the bus.' },
    { prompt: '表达天气好的条件。（提示词: if, sunny, go hiking）', answer: 'If it is sunny, we will go hiking.' }
  ],
  gs1: [
    { prompt: '比较两个人的年龄。（提示词: older than）', answer: 'My brother is older than me.' },
    { prompt: '比较两本书的趣味性。（提示词: more interesting than）', answer: 'This book is more interesting than that one.' },
    { prompt: '比较两种学习方式。（提示词: better than）', answer: 'Practicing is better than just reading.' },
    { prompt: '表达某种事物的最高级。（提示词: the tallest, in my class）', answer: 'He is the tallest boy in my class.' },
    { prompt: '比较今天的天气。（提示词: colder than, yesterday）', answer: 'Today is colder than yesterday.' }
  ],
  gs2: [
    { prompt: '用被动语态描述书被写了。（提示词: the book, write, by）', answer: 'The book was written by a famous author.' },
    { prompt: '描述英语在全球被使用。（提示词: English, speak, worldwide）', answer: 'English is spoken worldwide.' },
    { prompt: '描述信被寄出了。（提示词: the letter, send, yesterday）', answer: 'The letter was sent yesterday.' },
    { prompt: '描述窗户被打破了。（提示词: the window, break, by the boy）', answer: 'The window was broken by the boy.' },
    { prompt: '描述蛋糕被吃完了。（提示词: all the cake, eat, by the children）', answer: 'All the cake was eaten by the children.' }
  ]
}

const allGrammarPointsFlat = grammarPoints.flatMap(cat => cat.items)

function startPractice(id) {
  const point = allGrammarPointsFlat.find(p => p.id === id)
  if (!point) return
  currentPoint.value = point
  currentRound.value = 1
  correctCount.value = 0
  answered.value = false
  userSentence.value = ''
  loadQuestion()
}

function loadQuestion() {
  answered.value = false
  userSentence.value = ''
  isCorrect.value = false
  const bank = questionBank[currentPoint.value.id]
  if (bank && currentRound.value <= bank.length) {
    const q = bank[currentRound.value - 1]
    currentPrompt.value = q.prompt
    currentPromptAnswer.value = q.answer
  } else {
    // 如果题库用完了
    currentPrompt.value = `请用 ${currentPoint.value.name} (${currentPoint.value.formula}) 造一个句子。`
    currentPromptAnswer.value = '（自由作答，AI检查语法结构）'
  }
}

function checkAnswer() {
  if (!userSentence.value.trim()) return
  answered.value = true
  const input = userSentence.value.trim().toLowerCase()
  const expectedLower = currentPromptAnswer.value.toLowerCase()

  // 简单比对（实际应由AI/API来做精确检查）
  const similarity = calculateSimilarity(input, expectedLower)
  if (similarity > 0.5 || input.includes(expectedLower.split(' ').slice(0, 3).join(' '))) {
    isCorrect.value = true
    correctCount.value++
    feedbackMessage.value = ''
  } else {
    isCorrect.value = false
    // 生成语法反馈
    const issues = analyzeSentence(input, currentPoint.value)
    feedbackMessage.value = issues.length ? issues.join('；') : '句子结构需调整，请参考标准答案。'
  }
}

function calculateSimilarity(a, b) {
  const aWords = a.split(/\s+/)
  const bWords = b.split(/\s+/)
  const common = aWords.filter(w => bWords.includes(w)).length
  return common / Math.max(aWords.length, bWords.length)
}

function analyzeSentence(sentence, point) {
  const issues = []
  const lower = sentence.toLowerCase()
  // 基础规则检查
  if (point.id.startsWith('gt') && !sentence.match(/[.!?]$/)) {
    issues.push('句子缺少标点符号')
  }
  if (point.id === 'gt1' && lower.match(/he|she|it/) && !lower.match(/s\b|es\b/) && lower.match(/\b(read|play|go|like|have)\b/)) {
    issues.push('第三人称单数动词需加 s/es')
  }
  if (point.id === 'gt2' && !lower.match(/\b(was|were|went|did|had|played|lived|watched|liked|visited|traveled)\b/)) {
    issues.push('一般过去时需使用动词过去式形式')
  }
  if (point.id === 'gt3' && !lower.match(/\bhave\b|\bhas\b/)) {
    issues.push('现在完成时需使用 have/has + 过去分词')
  }
  if (point.id === 'gc1' && !lower.match(/\bwho\b|\bwhich\b|\bthat\b|\bwhere\b|\bwhom\b/)) {
    issues.push('定语从句缺少关系代词（who/which/that/where）')
  }
  return issues
}

function skipQuestion() {
  currentRound.value++
  if (currentRound.value > totalRounds) {
    showSummary.value = true
  } else {
    loadQuestion()
  }
}

function nextQuestion() {
  if (currentRound.value >= totalRounds) {
    showSummary.value = true
  } else {
    currentRound.value++
    loadQuestion()
  }
}

const summaryMessage = computed(() => {
  const rate = correctCount.value / totalRounds
  if (rate >= 0.8) return '非常出色！你对这个语法点掌握得很好，继续保持。'
  if (rate >= 0.6) return '不错的表现！建议再多加练习这个语法点。'
  return '还需要多练习哦，建议回到语法页面复习相关内容。'
})

function restartPractice() {
  showSummary.value = false
  const id = currentPoint.value?.id
  if (id) startPractice(id)
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.mt-lg { margin-top: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }

/* 提示卡片 */
.prompt-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.round-badge { font-size: 13px; font-weight: 600; color: var(--color-primary); }
.prompt-card { background: var(--color-bg-alt); border-radius: var(--radius-md); padding: 20px; }
.prompt-grammar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.grammar-tag { font-size: 12px; font-weight: 600; color: var(--color-primary); background: var(--color-primary-bg); padding: 2px 10px; border-radius: 12px; }
.grammar-formula { font-size: 13px; color: var(--text-muted); font-family: 'SF Mono', monospace; }
.prompt-question { font-size: 15px; color: var(--text-primary); line-height: 1.6; }

.input-section { margin-top: 16px; }
.input-actions { display: flex; gap: 12px; }

/* 反馈卡片 */
.feedback-card { border-left: 4px solid var(--color-border); }
.feedback-correct { border-left-color: var(--color-success); background: #F0FDFA; }
.feedback-incorrect { border-left-color: var(--color-danger); background: #FEF2F2; }
.feedback-header { margin-bottom: 14px; }
.correct-badge, .incorrect-badge {
  display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600;
}
.correct-badge { color: var(--color-success); }
.incorrect-badge { color: var(--color-danger); }
.feedback-compare { margin-bottom: 12px; }
.compare-row { display: flex; gap: 10px; align-items: baseline; padding: 4px 0; }
.compare-label { font-size: 13px; color: var(--text-muted); flex-shrink: 0; }
.text-correct { color: var(--color-success); font-weight: 500; }
.text-incorrect { color: var(--color-danger); font-weight: 500; text-decoration: line-through; text-decoration-color: var(--color-danger); }
.text-reference { color: var(--color-success); font-weight: 500; }
.feedback-explanation { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: var(--text-secondary); padding: 8px 12px; background: var(--color-bg); border-radius: var(--radius-sm); line-height: 1.6; }

/* 提示 */
.practice-tips { text-align: left; max-width: 300px; margin: 0 auto; }
.practice-tips h4 { font-size: 14px; margin-bottom: 8px; }
.practice-tips ul { padding-left: 18px; }
.practice-tips li { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }

/* 总结 */
.summary-stats { text-align: center; }
.summary-score { margin-bottom: 12px; }
.summary-stats h3 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.summary-stats p { font-size: 14px; color: var(--text-secondary); margin-bottom: 4px; }
</style>
