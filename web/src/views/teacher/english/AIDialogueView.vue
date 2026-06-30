<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>AI 情境口语</h2>
        <p>模拟真实场景对话，AI 实时陪伴练习口语</p>
      </div>
    </div>

    <!-- 场景选择 -->
    <div v-if="!activeScenario">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="6" v-for="s in scenarios" :key="s.id" class="mb-lg">
          <el-card shadow="hover" class="scenario-card" @click="startScenario(s)">
            <div class="scenario-icon">{{ s.icon }}</div>
            <h4>{{ s.title }}</h4>
            <p class="scenario-desc">{{ s.description }}</p>
            <div class="scenario-footer">
              <el-tag :type="s.level === 'easy' ? 'success' : s.level === 'medium' ? 'warning' : 'danger'" size="small">
                {{ s.levelLabel }}
              </el-tag>
              <span class="scenario-duration">{{ s.estTime }} 分钟</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 对话界面 -->
    <div v-if="activeScenario">
      <el-card class="mb-lg">
        <div class="chat-header">
          <div>
            <strong>{{ activeScenario.title }}</strong>
            <span class="chat-meta">{{ activeScenario.levelLabel }} · {{ activeScenario.description }}</span>
          </div>
          <div>
            <span class="message-count">已对话 {{ messages.length }} 轮</span>
            <el-button type="danger" plain size="small" @click="endDialogue" style="margin-left:12px">结束对话</el-button>
          </div>
        </div>
      </el-card>

      <!-- 聊天区域 -->
      <el-card class="chat-box mb-lg">
        <div class="chat-messages" ref="chatContainer">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="['chat-bubble', msg.role === 'student' ? 'bubble-student' : 'bubble-ai']"
          >
            <div class="bubble-avatar">{{ msg.role === 'student' ? '我' : 'AI' }}</div>
            <div class="bubble-content">
              <div class="bubble-text">{{ msg.text }}</div>
              <div class="bubble-time">{{ msg.time }}</div>
            </div>
          </div>
          <div v-if="aiTyping" class="chat-bubble bubble-ai">
            <div class="bubble-avatar">AI</div>
            <div class="bubble-content">
              <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            placeholder="请输入你的回复..."
            @keyup.enter.exact.native="sendMessage"
            :disabled="aiTyping"
          />
          <el-button type="primary" @click="sendMessage" :disabled="!inputText.trim() || aiTyping" style="margin-top:8px">
            发送
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- AI 评估面板 -->
    <el-dialog v-model="showEval" title="AI 口语评估" width="640px" :close-on-click-modal="false">
      <div class="eval-score">
        <div class="eval-score-circle">
          <el-progress type="circle" :percentage="evalData.overallScore" :color="'#6366F1'" :stroke-width="8" :width="120" />
        </div>
        <h3>综合评分</h3>
      </div>
      <el-divider />
      <div class="eval-details">
        <div class="eval-row" v-for="item in evalData.categories" :key="item.label">
          <span class="eval-label">{{ item.label }}</span>
          <el-progress :percentage="item.score" :stroke-width="8" :color="item.score >= 80 ? '#10B981' : item.score >= 60 ? '#F59E0B' : '#EF4444'" />
          <span class="eval-comment">{{ item.comment }}</span>
        </div>
      </div>
      <el-divider />
      <div class="eval-feedback">
        <h4>AI 点评</h4>
        <p>{{ evalData.feedback }}</p>
      </div>
      <div class="eval-suggestions">
        <h4>改进建议</h4>
        <ul>
          <li v-for="tip in evalData.suggestions" :key="tip">{{ tip }}</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showEval = false">关闭</el-button>
        <el-button type="primary" @click="resetDialogue">新对话</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const activeScenario = ref(null)
const inputText = ref('')
const messages = ref([])
const aiTyping = ref(false)
const showEval = ref(false)
const chatContainer = ref(null)

const evalData = reactive({
  overallScore: 0,
  categories: [],
  feedback: '',
  suggestions: []
})

const scenarios = [
  { id: 1, title: '餐厅点餐', icon: '&#127869;', description: '在餐厅与服务员交流，点餐、询问推荐', level: 'easy', levelLabel: '简单', estTime: 5 },
  { id: 2, title: '机场登机', icon: '&#9992;', description: '办理登机手续，行李托运，询问登机口', level: 'easy', levelLabel: '简单', estTime: 5 },
  { id: 3, title: '酒店入住', icon: '&#127968;', description: '前台登记，询问设施，办理入住/退房', level: 'medium', levelLabel: '中等', estTime: 8 },
  { id: 4, title: '面试对话', icon: '&#128188;', description: '模拟英文面试，自我介绍与问答', level: 'medium', levelLabel: '中等', estTime: 10 },
  { id: 5, title: '学术讨论', icon: '&#128218;', description: '课堂讨论，表达观点，学术辩论', level: 'hard', levelLabel: '困难', estTime: 12 },
  { id: 6, title: '商务谈判', icon: '&#129309;', description: '商业会议，方案陈述，价格谈判', level: 'hard', levelLabel: '困难', estTime: 15 }
]

const scenarioAIReplies = {
  1: ['Good evening! Welcome to our restaurant. Do you have a reservation?', 'Great. Here is your table. Would you like to see the menu?', 'Our specialties today are the grilled salmon and the steak with mushroom sauce. Both are excellent choices.', 'Excellent choice! Would you like anything to drink with that?', 'Your order is coming soon. Is there anything else I can help you with?'],
  2: ['Good morning! May I see your passport and booking reference, please?', 'Thank you. Are you checking any bags today?', 'Your bags are within the weight limit. Here is your boarding pass.', 'Your gate is B12. Boarding will begin at 14:20.', 'Have a pleasant flight!'],
  3: ['Good afternoon! Welcome to the Grand Hotel. Do you have a booking with us?', 'I have found your reservation. A deluxe room for three nights, correct?', 'The room is on the 8th floor with a city view. Check-out time is 12:00 PM.', 'Breakfast is served from 7:00 to 10:00 in the lobby restaurant.', 'Is there anything else I can assist you with during your stay?'],
  4: ['Good morning! Thank you for coming in today. Could you start by telling me a bit about yourself?', 'That\'s interesting! What do you consider your greatest professional strength?', 'I see. Can you give me an example of a challenge you faced at work and how you handled it?', 'Great answer. Do you have any questions for us about the role or the company?', 'Thank you for your time. We will be in touch soon regarding the next steps.'],
  5: ['In today\'s seminar, we will discuss the impact of social media on modern communication. What are your initial thoughts?', 'That\'s a good point. Could you elaborate on the negative aspects you mentioned?', 'Interesting perspective. How would you compare this to traditional media?', 'Let\'s consider the academic research on this topic — what evidence supports your position?', 'Excellent discussion. To summarize today\'s key takeaways...'],
  6: ['Welcome everyone. Our agenda today is to discuss the Q3 partnership proposal. Let\'s start with your presentation.', 'Those numbers look promising. What would you say is the biggest risk in this proposal?', 'I understand. Regarding pricing, could we explore a more flexible payment structure?', 'That sounds reasonable. Let me summarize what we\'ve agreed upon so far...']
}

function startScenario(s) {
  activeScenario.value = s
  messages.value = []
  const replies = scenarioAIReplies[s.id] || []
  addMessage('ai', replies[0] || 'Hello! Let\'s begin our conversation.')
}

function addMessage(role, text) {
  const now = new Date()
  messages.value.push({
    role,
    text,
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text) return
  addMessage('student', text)
  inputText.value = ''
  aiTyping.value = true

  // 模拟AI回复延迟
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
  aiTyping.value = false

  const replies = scenarioAIReplies[activeScenario.value?.id] || []
  const msgCount = messages.value.filter(m => m.role === 'ai').length
  if (msgCount < replies.length) {
    addMessage('ai', replies[msgCount])
  } else {
    addMessage('ai', 'Thank you for this wonderful conversation! Would you like to continue or shall we wrap up?')
  }
}

function endDialogue() {
  ElMessage.info('AI 正在评估你的对话表现...')
  const score = Math.floor(Math.random() * 30) + 70
  evalData.overallScore = score
  evalData.categories = [
    { label: '流利度', score: score - Math.floor(Math.random() * 5), comment: score >= 80 ? '表达流畅自然' : '偶尔停顿' },
    { label: '词汇量', score: score + Math.floor(Math.random() * 5) - 3, comment: score >= 75 ? '词汇使用恰当' : '可丰富词汇' },
    { label: '语法准确性', score: score - Math.floor(Math.random() * 8), comment: score >= 70 ? '语法基本正确' : '需加强语法' },
    { label: '交际能力', score: score + Math.floor(Math.random() * 3), comment: score >= 80 ? '互动积极有效' : '可多参与互动' }
  ]
  evalData.feedback = score >= 85
    ? 'Excellent! 你的口语表达非常出色，能够自如地进行日常对话。继续保持！'
    : score >= 75
      ? 'Good job! 你基本能够应对该场景的对话需求，建议在多使用地道表达方面加强。'
      : 'Keep practicing! 你的基础不错，但需要更多的练习来提升流利度和自信心。'
  evalData.suggestions = score >= 85
    ? ['尝试更多高级场景挑战自己', '关注地道的idiomatic表达', '练习更长时间的自由对话']
    : score >= 75
      ? ['每天进行10分钟口语练习', '录下自己的对话回听分析', '使用更多连接词使表达更连贯']
      : ['先从简单场景多练习', '背诵场景常用的句型模板', '不要怕犯错，大胆开口说']
  showEval.value = true
}

function resetDialogue() {
  showEval.value = false
  activeScenario.value = null
  messages.value = []
  inputText.value = ''
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }

/* 场景卡片 */
.scenario-card { cursor: pointer; text-align: center; padding: 8px 0; }
.scenario-card:hover { border-color: var(--color-primary-light); transform: translateY(-2px); }
.scenario-icon { font-size: 36px; margin-bottom: 8px; }
.scenario-card h4 { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
.scenario-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px; }
.scenario-footer { display: flex; align-items: center; justify-content: center; gap: 8px; }
.scenario-duration { font-size: 12px; color: var(--text-muted); }

/* 聊天头部 */
.chat-header { display: flex; align-items: center; justify-content: space-between; }
.chat-header strong { font-size: 15px; color: var(--text-primary); }
.chat-meta { font-size: 12px; color: var(--text-muted); margin-left: 10px; }
.message-count { font-size: 13px; color: var(--text-muted); }

/* 聊天区域 */
.chat-box { padding: 0; }
.chat-messages { height: 420px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.chat-bubble { display: flex; gap: 10px; max-width: 78%; }
.bubble-student { align-self: flex-end; flex-direction: row-reverse; }
.bubble-ai { align-self: flex-start; }
.bubble-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: white;
}
.bubble-student .bubble-avatar { background: var(--color-primary); }
.bubble-ai .bubble-avatar { background: #8B5CF6; }
.bubble-content { max-width: 100%; }
.bubble-text { padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; line-height: 1.5; }
.bubble-student .bubble-text { background: var(--color-primary-bg); color: var(--text-primary); }
.bubble-ai .bubble-text { background: var(--color-bg-alt); color: var(--text-primary); }
.bubble-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.bubble-student .bubble-time { text-align: right; }

.typing-indicator { display: flex; gap: 4px; padding: 14px 18px; }
.typing-indicator span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: typeBounce 1.4s infinite ease-in-out; }
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }
@keyframes typeBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.chat-input-area { padding: 16px 20px; border-top: 1px solid var(--color-border); }

/* 评估面板 */
.eval-score { text-align: center; }
.eval-score-circle { margin-bottom: 8px; }
.eval-score h3 { font-size: 18px; color: var(--text-primary); }
.eval-details { display: flex; flex-direction: column; gap: 12px; }
.eval-row { display: flex; align-items: center; gap: 12px; }
.eval-label { width: 80px; font-size: 14px; font-weight: 500; flex-shrink: 0; }
.eval-row .el-progress { flex: 1; }
.eval-comment { width: 100px; font-size: 12px; color: var(--text-muted); text-align: right; flex-shrink: 0; }
.eval-feedback { margin-bottom: 12px; }
.eval-feedback h4, .eval-suggestions h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.eval-feedback p { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }
.eval-suggestions ul { padding-left: 20px; }
.eval-suggestions li { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
</style>
