<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>单词记忆</h2>
        <p>选择词书，通过卡片式记忆掌握核心词汇</p>
      </div>
    </div>

    <!-- 词书选择界面 -->
    <el-card class="mb-lg" v-if="!currentWord && !showEndScreen">
      <template #header><span class="card-title">选择词书</span></template>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="6" v-for="book in wordBooks" :key="book.value">
          <div class="book-card" @click="selectBook(book)">
            <div class="book-icon">{{ book.icon }}</div>
            <h4>{{ book.label }}</h4>
            <p>{{ book.count }} 词</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 单词卡学习界面 -->
    <div v-if="currentWord && !showEndScreen">
      <!-- 进度条 -->
      <div class="progress-section mb-lg">
        <div class="progress-text">
          <span>进度: {{ currentIndex + 1 }} / {{ words.length }}</span>
          <span>已学 {{ stats.learned }} · 待复习 {{ stats.review }} · 已掌握 {{ stats.mastered }}</span>
        </div>
        <el-progress
          :percentage="Math.round((currentIndex + 1) / words.length * 100)"
          :stroke-width="10"
          :color="'#6366F1'"
        />
      </div>

      <!-- 单词卡片 -->
      <el-card class="word-card mb-lg">
        <div class="word-display">
          <div class="word-main">{{ currentWord.word }}</div>
          <div class="word-phonetic">/{{ currentWord.phonetic }}/</div>
          <el-tag size="small" effect="plain" type="info" class="word-tag">{{ currentWord.partOfSpeech }}</el-tag>
        </div>
        <div class="word-meaning">
          <div class="meaning-cn">{{ currentWord.meaning }}</div>
        </div>
        <div class="word-example" v-if="currentWord.example">
          <div class="example-en">{{ currentWord.example.en }}</div>
          <div class="example-cn">{{ currentWord.example.cn }}</div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="word-actions">
        <el-button size="large" type="danger" plain @click="markUnknown">
          <el-icon style="margin-right:6px"><Close /></el-icon>不认识
        </el-button>
        <el-button size="large" type="success" plain @click="markKnown">
          <el-icon style="margin-right:6px"><Check /></el-icon>认识
        </el-button>
        <el-button size="large" type="primary" @click="nextWord">
          下一个 <el-icon style="margin-left:6px"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 结束页面 -->
    <el-card v-if="showEndScreen">
      <div class="end-screen">
        <div class="end-icon">&#127942;</div>
        <h2>学习完成！</h2>
        <p>你已完成 {{ words.length }} 个单词的学习</p>
        <el-row :gutter="16" class="end-stats">
          <el-col :span="8" v-for="s in endStats" :key="s.label">
            <div class="end-stat-card">
              <div class="end-stat-value" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="end-stat-label">{{ s.label }}</div>
            </div>
          </el-col>
        </el-row>
        <el-button type="primary" size="large" @click="resetLearning">重新开始</el-button>
        <el-button size="large" @click="reviewMistakes" style="margin-left:12px">复习错词</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { Close, Check, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const currentIndex = ref(0)
const currentWord = ref(null)
const showEndScreen = ref(false)
const selectedBook = ref('')

const stats = reactive({ learned: 0, review: 0, mastered: 0 })

const wordBooks = [
  { label: '高考核心 3500', value: 'gk3500', count: 3500, icon: '&#127891;' },
  { label: '四级核心词汇', value: 'cet4', count: 4500, icon: '&#128214;' },
  { label: '六级核心词汇', value: 'cet6', count: 5500, icon: '&#128218;' },
  { label: '雅思核心词汇', value: 'ielts', count: 6000, icon: '&#127758;' }
]

const allWords = [
  { word: 'abandon', phonetic: 'əˈbændən', partOfSpeech: 'v.', meaning: '抛弃，放弃', example: { en: 'They had to abandon the sinking ship.', cn: '他们不得不放弃正在下沉的船。' } },
  { word: 'ability', phonetic: 'əˈbɪləti', partOfSpeech: 'n.', meaning: '能力；才能', example: { en: 'She has the ability to learn languages quickly.', cn: '她有快速学习语言的能力。' } },
  { word: 'abroad', phonetic: 'əˈbrɔːd', partOfSpeech: 'adv.', meaning: '在国外；到国外', example: { en: 'He dreams of studying abroad next year.', cn: '他梦想明年出国留学。' } },
  { word: 'academic', phonetic: 'ˌækəˈdemɪk', partOfSpeech: 'adj.', meaning: '学术的；学院的', example: { en: 'Her academic performance is outstanding.', cn: '她的学术表现非常出色。' } },
  { word: 'access', phonetic: 'ˈækses', partOfSpeech: 'n./v.', meaning: '进入；通道；访问', example: { en: 'Students have access to the online library.', cn: '学生可以访问在线图书馆。' } },
  { word: 'accompany', phonetic: 'əˈkʌmpəni', partOfSpeech: 'v.', meaning: '陪伴；伴随', example: { en: 'I will accompany you to the airport.', cn: '我会陪你去机场。' } },
  { word: 'achieve', phonetic: 'əˈtʃiːv', partOfSpeech: 'v.', meaning: '实现；达到', example: { en: 'Hard work helps you achieve your goals.', cn: '努力帮实现目标。' } },
  { word: 'acquire', phonetic: 'əˈkwaɪər', partOfSpeech: 'v.', meaning: '获得；习得', example: { en: 'Children acquire language naturally.', cn: '儿童自然习得语言。' } },
  { word: 'adapt', phonetic: 'əˈdæpt', partOfSpeech: 'v.', meaning: '适应；改编', example: { en: 'We must adapt to the changing environment.', cn: '我们必须适应变化的环境。' } },
  { word: 'adequate', phonetic: 'ˈædɪkwət', partOfSpeech: 'adj.', meaning: '足够的；适当的', example: { en: 'Make sure you have adequate preparation.', cn: '确保你有充分的准备。' } }
]

const words = ref([])

function selectBook(book) {
  selectedBook.value = book.label
  words.value = [...allWords]
  currentIndex.value = 0
  currentWord.value = words.value[0]
  stats.learned = 0
  stats.review = 0
  stats.mastered = 0
  ElMessage.success(`已选择: ${book.label}`)
}

function markKnown() {
  stats.learned++
  stats.mastered++
  ElMessage.success('已记录为"认识"')
  nextWord()
}

function markUnknown() {
  stats.review++
  ElMessage.warning('已记录为"不认识"，将加入复习')
  nextWord()
}

function nextWord() {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++
    currentWord.value = words.value[currentIndex.value]
  } else {
    stats.learned = Math.max(stats.learned, stats.mastered)
    currentWord.value = null
    showEndScreen.value = true
  }
}

const endStats = computed(() => [
  { label: '本轮学习', value: words.value.length, color: 'var(--color-primary)' },
  { label: '已掌握', value: stats.mastered, color: 'var(--color-success)' },
  { label: '待复习', value: stats.review, color: 'var(--color-warning)' }
])

function resetLearning() {
  showEndScreen.value = false
  currentIndex.value = 0
  currentWord.value = null
  selectedBook.value = ''
  stats.learned = 0
  stats.review = 0
  stats.mastered = 0
}

function reviewMistakes() {
  ElMessage.info('复习模式开发中...')
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }

/* 词书选择 */
.book-card {
  text-align: center; padding: 24px 16px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border); cursor: pointer;
  transition: all var(--transition);
}
.book-card:hover { border-color: var(--color-primary-light); background: var(--color-primary-bg); }
.book-icon { font-size: 32px; margin-bottom: 8px; }
.book-card h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
.book-card p { font-size: 13px; color: var(--text-muted); }

/* 进度 */
.progress-section { background: var(--color-bg-alt); padding: 16px; border-radius: var(--radius-md); }
.progress-text { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: var(--text-secondary); }

/* 单词卡片 */
.word-card { text-align: center; padding: 32px 0; }
.word-display { margin-bottom: 20px; }
.word-main { font-size: 42px; font-weight: 700; color: var(--text-primary); letter-spacing: 1px; }
.word-phonetic { font-size: 16px; color: var(--text-muted); margin: 8px 0; }
.word-tag { margin-top: 6px; }
.word-meaning { margin-bottom: 24px; }
.meaning-cn { font-size: 22px; font-weight: 600; color: var(--color-primary); }
.word-example { background: var(--color-bg-alt); padding: 16px 24px; border-radius: var(--radius-sm); text-align: left; max-width: 520px; margin: 0 auto; }
.example-en { font-size: 14px; color: var(--text-primary); font-style: italic; margin-bottom: 4px; }
.example-cn { font-size: 13px; color: var(--text-secondary); }

/* 操作按钮 */
.word-actions { display: flex; justify-content: center; gap: 16px; }

/* 结束页面 */
.end-screen { text-align: center; padding: 32px 0; }
.end-icon { font-size: 64px; margin-bottom: 16px; }
.end-screen h2 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.end-screen > p { color: var(--text-secondary); margin-bottom: 24px; }
.end-stats { max-width: 480px; margin: 0 auto 32px; }
.end-stat-card { padding: 16px; }
.end-stat-value { font-size: 36px; font-weight: 700; }
.end-stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
</style>
