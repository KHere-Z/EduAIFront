<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>课堂管理</h2>
        <p>创建和管你的英语课堂，查看学生出勤和成绩</p>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon style="margin-right:6px"><Plus /></el-icon>创建课堂
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="s in stats" :key="s.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 课堂卡片网格 -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="8" v-for="cls in classrooms" :key="cls.id" class="mb-lg">
        <el-card shadow="hover" class="classroom-card" @click="openDetail(cls)">
          <div class="card-top">
            <h3>{{ cls.name }}</h3>
            <el-tag :type="cls.status === '进行中' ? 'success' : cls.status === '已结束' ? 'info' : 'warning'" size="small">
              {{ cls.status }}
            </el-tag>
          </div>
          <div class="card-info">
            <div class="info-row"><span class="label">上课时间</span><span>{{ cls.schedule }}</span></div>
            <div class="info-row"><span class="label">词书</span><span>{{ cls.wordBook }}</span></div>
            <div class="info-row"><span class="label">学生人数</span><span>{{ cls.students.length }} 人</span></div>
            <div class="info-row"><span class="label">创建日期</span><span>{{ cls.createdAt }}</span></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建课堂对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新课堂" width="560px" destroy-on-close>
      <el-form :model="createForm" label-width="90px" label-position="right">
        <el-form-item label="课堂名称" required>
          <el-input v-model="createForm.name" placeholder="如：周一英语基础班" />
        </el-form-item>
        <el-form-item label="上课时间" required>
          <el-select v-model="createForm.schedule" placeholder="选择时间" style="width:100%">
            <el-option label="周一 10:00-11:30" value="周一 10:00-11:30" />
            <el-option label="周三 14:00-15:30" value="周三 14:00-15:30" />
            <el-option label="周五 16:00-17:30" value="周五 16:00-17:30" />
            <el-option label="周六 09:00-10:30" value="周六 09:00-10:30" />
            <el-option label="周日 15:00-16:30" value="周日 15:00-16:30" />
          </el-select>
        </el-form-item>
        <el-form-item label="词书选择" required>
          <el-select v-model="createForm.wordBook" placeholder="选择词书" style="width:100%">
            <el-option label="高考核心 3500" value="高考核心 3500" />
            <el-option label="四级核心词汇" value="四级核心词汇" />
            <el-option label="六级核心词汇" value="六级核心词汇" />
            <el-option label="雅思核心词汇" value="雅思核心词汇" />
            <el-option label="托福核心词汇" value="托福核心词汇" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择学生">
          <el-select v-model="createForm.students" placeholder="选择学生" multiple style="width:100%">
            <el-option
              v-for="s in availableStudents"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createClassroom">创建</el-button>
      </template>
    </el-dialog>

    <!-- 课堂详情对话框 -->
    <el-dialog v-model="showDetailDialog" :title="selectedClass?.name" width="720px" destroy-on-close>
      <el-tabs v-model="detailTab">
        <el-tab-pane label="学生出勤" name="attendance">
          <el-table :data="selectedClass?.students || []" stripe>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="attendance" label="出勤次数" width="100" />
            <el-table-column prop="total" label="总课时" width="100" />
            <el-table-column label="出勤率" width="120">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.attendance / row.total * 100)" :stroke-width="8" :color="'#6366F1'" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="成绩记录" name="scores">
          <el-table :data="selectedClass?.scores || []" stripe>
            <el-table-column prop="studentName" label="姓名" />
            <el-table-column prop="avgScore" label="平均分" width="100" />
            <el-table-column prop="testCount" label="测试次数" width="100" />
            <el-table-column prop="latestScore" label="最近成绩" width="100" />
            <el-table-column label="等级" width="100">
              <template #default="{ row }">
                <el-tag :type="row.grade === 'A' ? 'success' : row.grade === 'B' ? 'warning' : 'danger'" size="small">
                  {{ row.grade }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const selectedClass = ref(null)
const detailTab = ref('attendance')

const stats = [
  { label: '活跃课堂', value: 5 },
  { label: '在读学生', value: 32 },
  { label: '本月课时', value: 48 },
  { label: '平均出勤率', value: '94%' }
]

const availableStudents = [
  { id: 1, name: '王小明' }, { id: 2, name: '李小华' },
  { id: 3, name: '张小雨' }, { id: 4, name: '赵思琪' },
  { id: 5, name: '陈浩然' }, { id: 6, name: '刘婧雯' },
  { id: 7, name: '杨博文' }, { id: 8, name: '黄梓涵' }
]

const classrooms = ref([
  {
    id: 1,
    name: '周一英语基础班',
    schedule: '周一 10:00-11:30',
    wordBook: '高考核心 3500',
    status: '进行中',
    createdAt: '2026-06-15',
    students: [
      { name: '王小明', attendance: 8, total: 10 },
      { name: '李小华', attendance: 10, total: 10 },
      { name: '张小雨', attendance: 7, total: 10 },
      { name: '赵思琪', attendance: 9, total: 10 }
    ],
    scores: [
      { studentName: '王小明', avgScore: 85, testCount: 4, latestScore: 88, grade: 'A' },
      { studentName: '李小华', avgScore: 92, testCount: 4, latestScore: 95, grade: 'A' },
      { studentName: '张小雨', avgScore: 72, testCount: 4, latestScore: 76, grade: 'B' },
      { studentName: '赵思琪', avgScore: 80, testCount: 4, latestScore: 83, grade: 'B' }
    ]
  },
  {
    id: 2,
    name: '周三阅读进阶班',
    schedule: '周三 14:00-15:30',
    wordBook: '四级核心词汇',
    status: '进行中',
    createdAt: '2026-06-18',
    students: [
      { name: '陈浩然', attendance: 6, total: 8 },
      { name: '刘婧雯', attendance: 8, total: 8 },
      { name: '杨博文', attendance: 5, total: 8 }
    ],
    scores: [
      { studentName: '陈浩然', avgScore: 78, testCount: 3, latestScore: 82, grade: 'B' },
      { studentName: '刘婧雯', avgScore: 90, testCount: 3, latestScore: 93, grade: 'A' },
      { studentName: '杨博文', avgScore: 65, testCount: 3, latestScore: 70, grade: 'C' }
    ]
  },
  {
    id: 3,
    name: '周五冲刺强化班',
    schedule: '周五 16:00-17:30',
    wordBook: '六级核心词汇',
    status: '进行中',
    createdAt: '2026-06-20',
    students: [
      { name: '黄梓涵', attendance: 5, total: 6 },
      { name: '王小明', attendance: 6, total: 6 }
    ],
    scores: [
      { studentName: '黄梓涵', avgScore: 88, testCount: 2, latestScore: 91, grade: 'A' },
      { studentName: '王小明', avgScore: 86, testCount: 2, latestScore: 89, grade: 'A' }
    ]
  }
])

const createForm = reactive({
  name: '',
  schedule: '',
  wordBook: '',
  students: []
})

function createClassroom() {
  if (!createForm.name || !createForm.schedule || !createForm.wordBook) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const selectedNames = createForm.students
    .map(id => availableStudents.find(s => s.id === id))
    .filter(Boolean)
    .map(s => ({ name: s.name, attendance: 0, total: 0 }))
  classrooms.value.push({
    id: Date.now(),
    name: createForm.name,
    schedule: createForm.schedule,
    wordBook: createForm.wordBook,
    status: '进行中',
    createdAt: new Date().toISOString().split('T')[0],
    students: selectedNames,
    scores: selectedNames.map(s => ({
      studentName: s.name, avgScore: 0, testCount: 0, latestScore: 0, grade: '-'
    }))
  })
  ElMessage.success('课堂创建成功')
  showCreateDialog.value = false
  createForm.name = ''
  createForm.schedule = ''
  createForm.wordBook = ''
  createForm.students = []
}

function openDetail(cls) {
  selectedClass.value = cls
  showDetailDialog.value = true
  detailTab.value = 'attendance'
}
</script>

<style scoped>
.stat-card { text-align: center; padding: 12px 0; }
.stat-card .stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.stat-card .stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.mb-lg { margin-bottom: var(--space-lg); }

.classroom-card { cursor: pointer; }
.classroom-card:hover { border-color: var(--color-primary-light); }
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-top h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.card-info .info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 13px;
}
.info-row .label { color: var(--text-muted); }
.info-row span:last-child { color: var(--text-secondary); font-weight: 500; }
</style>
