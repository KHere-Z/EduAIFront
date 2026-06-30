<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>词汇测试</h2>
        <p>创建测试，查看进行中和历史的词汇测验</p>
      </div>
      <el-button type="primary" @click="showCreate = true">
        <el-icon style="margin-right:6px"><Plus /></el-icon>创建测试
      </el-button>
    </div>

    <!-- 创建测试表单 -->
    <el-card class="mb-lg" v-if="showCreate">
      <template #header><span class="card-title">新建词汇测试</span></template>
      <el-form :model="testForm" label-width="110px" label-position="right">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="词书" required>
              <el-select v-model="testForm.wordBook" placeholder="选择词书" style="width:100%">
                <el-option label="高考核心 3500" value="高考核心 3500" />
                <el-option label="四级核心词汇" value="四级核心词汇" />
                <el-option label="六级核心词汇" value="六级核心词汇" />
                <el-option label="雅思核心词汇" value="雅思核心词汇" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="对应课堂">
              <el-select v-model="testForm.classroom" placeholder="选择课堂（可选）" clearable style="width:100%">
                <el-option label="周一英语基础班" value="周一英语基础班" />
                <el-option label="周三阅读进阶班" value="周三阅读进阶班" />
                <el-option label="周五冲刺强化班" value="周五冲刺强化班" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单词数量">
              <el-slider v-model="testForm.wordCount" :min="10" :max="100" :step="10" show-input />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时间限制（分钟）">
              <el-slider v-model="testForm.timeLimit" :min="5" :max="60" :step="5" show-input />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="测试类型">
          <el-radio-group v-model="testForm.testType">
            <el-radio value="chs_to_en">看中文选英文</el-radio>
            <el-radio value="en_to_chs">看英文选中文</el-radio>
            <el-radio value="dictation">听写模式</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createTest">创建并发布</el-button>
          <el-button @click="showCreate = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 进行中的测试 -->
    <el-card class="mb-lg">
      <template #header><span class="card-title">进行中的测试</span></template>
      <el-table :data="activeTests" stripe v-if="activeTests.length">
        <el-table-column prop="name" label="测试名称" />
        <el-table-column prop="wordBook" label="词书" />
        <el-table-column prop="classroom" label="课堂" />
        <el-table-column prop="wordCount" label="单词数" width="90" />
        <el-table-column prop="timeLimit" label="限时" width="90">
          <template #default="{ row }">{{ row.timeLimit }} 分钟</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default>
            <el-tag type="success" size="small">进行中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="startTest(row)">开始测试</el-button>
            <el-button size="small" @click="viewResult(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无进行中的测试" :image-size="80" />
    </el-card>

    <!-- 测试历史 -->
    <el-card>
      <template #header><span class="card-title">测试历史</span></template>
      <el-table :data="historyTests" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="wordBook" label="词书" />
        <el-table-column prop="classroom" label="课堂" />
        <el-table-column prop="participants" label="参与人数" width="100" />
        <el-table-column prop="avgScore" label="平均分" width="90" />
        <el-table-column prop="highest" label="最高分" width="90" />
        <el-table-column prop="lowest" label="最低分" width="90" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button type="primary" link size="small">详情</el-button>
            <el-button link size="small">重新发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 测试结果对话框 -->
    <el-dialog v-model="showResultDialog" title="测试结果" width="700px">
      <el-table :data="resultDetails" stripe>
        <el-table-column prop="student" label="学生" />
        <el-table-column prop="score" label="得分" width="100" />
        <el-table-column prop="correct" label="正确数" width="100" />
        <el-table-column prop="timeUsed" label="用时" width="100" />
        <el-table-column label="正确率" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.correct / 20 * 100)"
              :stroke-width="8"
              :color="row.score >= 80 ? '#10B981' : row.score >= 60 ? '#F59E0B' : '#EF4444'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showCreate = ref(false)
const showResultDialog = ref(false)
const resultDetails = ref([])

const testForm = reactive({
  wordBook: '',
  classroom: '',
  wordCount: 20,
  timeLimit: 15,
  testType: 'en_to_chs'
})

const activeTests = ref([
  { id: 1, name: 'Unit 1 词汇检测', wordBook: '高考核心 3500', classroom: '周一英语基础班', wordCount: 20, timeLimit: 15 },
  { id: 2, name: '词根词缀专项', wordBook: '四级核心词汇', classroom: '周三阅读进阶班', wordCount: 30, timeLimit: 20 }
])

const studentNames = ['王小明', '李小华', '张小雨', '赵思琪', '陈浩然', '刘婧雯']

const historyTests = ref([
  { id: 1, date: '2026-06-28', wordBook: '高考核心 3500', classroom: '周一英语基础班', participants: 4, avgScore: 82, highest: 95, lowest: 68 },
  { id: 2, date: '2026-06-25', wordBook: '四级核心词汇', classroom: '周三阅读进阶班', participants: 3, avgScore: 76, highest: 90, lowest: 62 },
  { id: 3, date: '2026-06-22', wordBook: '高考核心 3500', classroom: '周五冲刺强化班', participants: 2, avgScore: 88, highest: 93, lowest: 83 },
  { id: 4, date: '2026-06-20', wordBook: '六级核心词汇', classroom: '周一英语基础班', participants: 4, avgScore: 74, highest: 88, lowest: 57 }
])

function createTest() {
  if (!testForm.wordBook) { ElMessage.warning('请选择词书'); return }
  activeTests.value.push({
    id: Date.now(),
    name: `${testForm.wordBook} 测试`,
    wordBook: testForm.wordBook,
    classroom: testForm.classroom || '全部课堂',
    wordCount: testForm.wordCount,
    timeLimit: testForm.timeLimit
  })
  ElMessage.success('测试已发布')
  showCreate.value = false
  testForm.wordBook = ''
  testForm.classroom = ''
}

function startTest(row) {
  ElMessage.info(`开始测试: ${row.name}`)
}

function viewResult(row) {
  resultDetails.value = studentNames.slice(0, 4).map(name => ({
    student: name,
    score: Math.floor(Math.random() * 40) + 60,
    correct: Math.floor(Math.random() * 6) + 14,
    timeUsed: Math.floor(Math.random() * 10) + 5 + ' 分钟'
  }))
  showResultDialog.value = true
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }
</style>
