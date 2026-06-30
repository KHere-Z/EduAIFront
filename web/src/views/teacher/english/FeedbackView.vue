<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>学习反馈</h2>
        <p>查看学生的综合学习报告，AI 智能建议助力成长</p>
      </div>
      <el-button type="primary" @click="generateFeedback">
        <el-icon style="margin-right:6px"><MagicStick /></el-icon>生成反馈
      </el-button>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：学生选择 -->
      <el-col :xs="24" :md="6">
        <el-card class="student-sidebar">
          <template #header><span class="card-title">选择学生</span></template>
          <div
            v-for="s in students"
            :key="s.id"
            :class="['student-item', { active: selectedStudent?.id === s.id }]"
            @click="selectStudent(s)"
          >
            <div class="student-avatar">{{ s.name.charAt(0) }}</div>
            <div class="student-info">
              <div class="student-name">{{ s.name }}</div>
              <div class="student-meta">{{ s.grade }} · {{ s.classroom }}</div>
            </div>
            <el-tag :type="s.level === 'A' ? 'success' : s.level === 'B' ? 'warning' : 'danger'" size="small">
              {{ s.level }}
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：反馈面板 -->
      <el-col :xs="24" :md="18">
        <div v-if="!selectedStudent">
          <el-card>
            <el-empty description="请在左侧选择学生查看学习反馈" :image-size="100" />
          </el-card>
        </div>

        <div v-if="selectedStudent">
          <!-- 综合概览 -->
          <el-row :gutter="12" class="stats-row">
            <el-col :span="6" v-for="s in studentStats" :key="s.label">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
                <div class="stat-label">{{ s.label }}</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 优劣势分析 -->
          <el-row :gutter="16" class="mb-lg">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span class="card-title">
                    <el-icon style="color:var(--color-success);margin-right:4px"><CircleCheck /></el-icon>优势
                  </span>
                </template>
                <div class="strength-list">
                  <div v-for="(item, idx) in selectedStudent.strengths" :key="idx" class="strength-item">
                    <span class="strength-dot" />
                    <div>
                      <div class="strength-title">{{ item.title }}</div>
                      <div class="strength-desc">{{ item.desc }}</div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span class="card-title">
                    <el-icon style="color:var(--color-warning);margin-right:4px"><WarningFilled /></el-icon>待提升
                  </span>
                </template>
                <div class="weakness-list">
                  <div v-for="(item, idx) in selectedStudent.weaknesses" :key="idx" class="weakness-item">
                    <span class="weakness-dot" />
                    <div>
                      <div class="weakness-title">{{ item.title }}</div>
                      <div class="weakness-desc">{{ item.desc }}</div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- AI建议 -->
          <el-card class="mb-lg">
            <template #header>
              <span class="card-title">
                <el-icon style="margin-right:4px"><MagicStick /></el-icon>AI 学习建议
              </span>
            </template>
            <div class="ai-suggestions">
              <div v-for="(sug, idx) in selectedStudent.suggestions" :key="idx" class="suggestion-item">
                <div class="suggestion-number">{{ idx + 1 }}</div>
                <div>
                  <div class="suggestion-title">{{ sug.title }}</div>
                  <div class="suggestion-detail">{{ sug.detail }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 生成的最新反馈 -->
          <el-card class="mb-lg" v-if="generatedFeedback">
            <template #header>
              <span class="card-title">
                <el-icon style="margin-right:4px"><Document /></el-icon>最新生成反馈
              </span>
            </template>
            <div class="generated-feedback">
              <div class="gf-header">
                <span>生成时间: {{ generatedFeedback.time }}</span>
                <el-tag type="primary" size="small">AI 生成</el-tag>
              </div>
              <div class="gf-content">{{ generatedFeedback.content }}</div>
              <div class="gf-metrics">
                <div class="gf-metric">
                  <span class="metric-label">综合评分</span>
                  <span class="metric-value">{{ generatedFeedback.score }}/100</span>
                </div>
                <div class="gf-metric">
                  <span class="metric-label">进步趋势</span>
                  <el-tag :type="generatedFeedback.trend === 'up' ? 'success' : 'warning'" size="small">
                    {{ generatedFeedback.trend === 'up' ? '上升中' : '平稳' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 历史反馈 -->
          <el-card>
            <template #header><span class="card-title">历史反馈记录</span></template>
            <el-table :data="feedbackHistory" stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.type === '周报' ? 'primary' : row.type === '月报' ? 'success' : 'info'" size="small">
                    {{ row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="topic" label="主题" />
              <el-table-column prop="score" label="评分" width="90" />
              <el-table-column prop="summary" label="摘要" min-width="200" />
              <el-table-column label="操作" width="100">
                <template #default>
                  <el-button type="primary" link size="small">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MagicStick, CircleCheck, WarningFilled, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const selectedStudent = ref(null)
const generatedFeedback = ref(null)

const students = [
  {
    id: 1, name: '王小明', grade: '初三', classroom: '周一英语基础班', level: 'A',
    strengths: [
      { title: '词汇积累扎实', desc: '核心词汇掌握度 92%，远超班级平均水平' },
      { title: '阅读理解能力强', desc: '能准确把握文章主旨和细节信息' },
      { title: '学习态度积极', desc: '主动完成课后练习，经常提问' }
    ],
    weaknesses: [
      { title: '口语流利度不足', desc: '表达时有较多停顿，自信心需提升' },
      { title: '写作逻辑待加强', desc: '段落衔接不够自然，缺少过渡词' }
    ],
    suggestions: [
      { title: '每日口语练习', detail: '建议每天进行10分钟英语口语自述，录下后回听对比，重点关注流利度和连读技巧。' },
      { title: '阅读进阶', detail: '当前水平可尝试《哈利波特》英版等中长篇读物，每周两章，记录生词和好句。' },
      { title: '写作模板训练', detail: '学习三段式作文结构，每周写一篇150词的短文，重点训练连接词(first, moreover, in conclusion)的使用。' }
    ]
  },
  {
    id: 2, name: '李小华', grade: '高一', classroom: '周三阅读进阶班', level: 'A',
    strengths: [
      { title: '语法基础牢固', desc: '语法测试正确率 95%，能准确运用各种复合句' },
      { title: '听力理解出色', desc: '能听懂VOA常速英语80%以上的内容' }
    ],
    weaknesses: [
      { title: '词汇量需扩充', desc: '学术词汇和高级词汇的掌握还有提升空间' },
      { title: '口语地道性不足', desc: '表达偏中式，缺少俚语和地道搭配' }
    ],
    suggestions: [
      { title: '词汇突击计划', detail: '建议使用词根词缀法系统记忆学术词汇，每天30个，配合Anki卡片进行间隔复习。' },
      { title: '口语地道化训练', detail: '观看英美剧（如Friends），模仿角色对话，注意idiomatic expressions的积累。' },
      { title: '写作翻译练习', detail: '每周从中文新闻中选取一段，翻译成英文后对照参考译文修改，关注用词和句式多样化。' }
    ]
  },
  {
    id: 3, name: '张小雨', grade: '初三', classroom: '周一英语基础班', level: 'B',
    strengths: [
      { title: '听力基础不错', desc: '课堂听力练习的正确率稳定在 80% 以上' }
    ],
    weaknesses: [
      { title: '语法薄弱', desc: '时态和语态概念混淆，考试中语法模块失分较多' },
      { title: '词汇拼写错误多', desc: '常见拼写错误影响写作和测试成绩' },
      { title: '阅读速度偏慢', desc: '完成一篇阅读理解平均用时比班级多3-5分钟' }
    ],
    suggestions: [
      { title: '语法专项突破', detail: '从时态体系开始系统复习，配合造句练习巩固。每周专攻一个时态，做20道相关练习题。' },
      { title: '拼写每日打卡', detail: '每天默写15个核心词汇，重点记忆易错拼写（如：receive, necessary, accommodation）。' },
      { title: '限时阅读训练', detail: '设定计时器，10分钟内完成一篇短阅读，逐步缩短时间，培养快速定位关键信息的能力。' }
    ]
  }
]

const studentStats = computed(() => {
  if (!selectedStudent.value) return []
  const s = selectedStudent.value
  return [
    { label: '综合评分', value: s.level === 'A' ? '92' : s.level === 'B' ? '78' : '65', color: s.level === 'A' ? 'var(--color-success)' : s.level === 'B' ? 'var(--color-warning)' : 'var(--color-danger)' },
    { label: '课堂出勤', value: s.level === 'A' ? '98%' : '85%', color: 'var(--color-primary)' },
    { label: '作业完成', value: s.level === 'A' ? '100%' : '88%', color: 'var(--color-primary)' },
    { label: '测试均分', value: s.level === 'A' ? '89' : '72', color: 'var(--text-primary)' }
  ]
})

const feedbackHistory = ref([
  { date: '2026-06-28', type: '周报', topic: '第26周学习反馈', score: 88, summary: '词汇测试进步明显，阅读正确率提升5%' },
  { date: '2026-06-21', type: '周报', topic: '第25周学习反馈', score: 85, summary: '语法练习正确率稳定，口语流利度仍需提升' },
  { date: '2026-06-14', type: '月报', topic: '6月学习月报', score: 83, summary: '整体呈上升趋势，阅读理解进步最大' },
  { date: '2026-06-01', type: '周报', topic: '第23周学习反馈', score: 80, summary: '开始使用AI口语练习，初显效果' }
])

function selectStudent(s) {
  selectedStudent.value = s
  generatedFeedback.value = null
}

function generateFeedback() {
  if (!selectedStudent.value) {
    ElMessage.warning('请先选择学生')
    return
  }
  const s = selectedStudent.value
  const score = s.level === 'A' ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 15) + 75
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  generatedFeedback.value = {
    time: timeStr,
    score,
    trend: Math.random() > 0.3 ? 'up' : 'stable',
    content: `${s.name}同学在本阶段学习中表现${score >= 85 ? '出色' : '良好'}。${
      s.strengths[0]?.title || ''
    }是其突出优势。建议重点关注${
      s.weaknesses[0]?.title || '薄弱环节'
    }的提升。基于AI分析，推荐继续加强${
      s.suggestions[0]?.title || '日常练习'
    }，预计下一阶段可在现有基础上提升5-8分。`
  }
  ElMessage.success('学习反馈已生成')
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }

/* 学生列表 */
.student-sidebar { padding: 0; }
.student-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px; cursor: pointer;
  transition: all var(--transition); border-bottom: 1px solid var(--color-border-light);
}
.student-item:hover, .student-item.active { background: var(--color-primary-bg); }
.student-avatar {
  width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary);
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; flex-shrink: 0;
}
.student-info { flex: 1; min-width: 0; }
.student-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.student-meta { font-size: 12px; color: var(--text-muted); }

/* 统计 */
.stat-card { text-align: center; padding: 12px 0; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

/* 优势/劣势 */
.strength-list, .weakness-list { display: flex; flex-direction: column; gap: 14px; }
.strength-item, .weakness-item { display: flex; gap: 10px; }
.strength-dot, .weakness-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 6px;
}
.strength-dot { background: var(--color-success); }
.weakness-dot { background: var(--color-warning); }
.strength-title, .weakness-title { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px; }
.strength-desc, .weakness-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* AI建议 */
.ai-suggestions { display: flex; flex-direction: column; gap: 14px; }
.suggestion-item { display: flex; gap: 12px; }
.suggestion-number {
  width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: var(--color-primary); flex-shrink: 0; margin-top: 2px;
}
.suggestion-title { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px; }
.suggestion-detail { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

/* 生成反馈 */
.generated-feedback { padding: 4px 0; }
.gf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); }
.gf-content { font-size: 14px; color: var(--text-primary); line-height: 1.8; margin-bottom: 16px; padding: 16px; background: var(--color-bg-alt); border-radius: var(--radius-md); }
.gf-metrics { display: flex; gap: 24px; }
.gf-metric { display: flex; flex-direction: column; gap: 4px; }
.metric-label { font-size: 12px; color: var(--text-muted); }
.metric-value { font-size: 18px; font-weight: 700; color: var(--text-primary); }
</style>
