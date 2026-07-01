<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>📊 学员单词学习进度</h2>
        <p>追踪每个学员的单词掌握情况 · 按词库筛选</p>
      </div>
      <el-select v-model="bookFilter" placeholder="选择词库">
        <el-option label="中考核心1500词" value="1" />
        <el-option label="高考高频800词" value="2" />
      </el-select>
    </div>

    <el-row :gutter="20" class="mb-lg">
      <el-col :span="6" v-for="s in summary" :key="s.label">
        <el-card><div class="stat-card"><div class="stat-value" :style="{color:s.color}">{{ s.value }}</div><div class="stat-label">{{ s.label }}</div></div></el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header><span class="card-title">学员详情</span></template>
      <el-table :data="students" stripe>
        <el-table-column prop="name" label="学员" width="100" fixed />
        <el-table-column label="总进度" width="200">
          <template #default="{row}">
            <div class="progress-cell">
              <el-progress :percentage="row.mastery" :color="row.mastery>70?'#67C23A':row.mastery>40?'#E6A23C':'#F56C6C'" :stroke-width="18" />
              <span>{{ row.learned }}/{{ row.total }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="新词" width="70"><template #default="{row}">{{ row.newCount }}</template></el-table-column>
        <el-table-column label="学习中" width="80"><template #default="{row}">{{ row.learning }}</template></el-table-column>
        <el-table-column label="复习中" width="80"><template #default="{row}">{{ row.reviewing }}</template></el-table-column>
        <el-table-column label="已掌握" width="80"><template #default="{row}"><span style="color:#67C23A;font-weight:600">{{ row.mastered }}</span></template></el-table-column>
        <el-table-column label="连续打卡" width="90"><template #default="{row}">{{ row.streak }} 天</template></el-table-column>
        <el-table-column label="最近学习" width="110" prop="lastStudy" />
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" text type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 学员详情弹窗 -->
    <el-dialog v-model="dialogVisible" :title="selectedStudent?.name + ' - 单词详情'" width="700px">
      <template v-if="selectedStudent">
        <el-row :gutter="16" class="mb-lg">
          <el-col :span="8"><el-statistic title="已学单词" :value="selectedStudent.learned" suffix="个" /></el-col>
          <el-col :span="8"><el-statistic title="掌握率" :value="selectedStudent.mastery" suffix="%" /></el-col>
          <el-col :span="8"><el-statistic title="连续打卡" :value="selectedStudent.streak" suffix="天" /></el-col>
        </el-row>
        <el-table :data="selectedStudent.words" stripe size="small" max-height="400">
          <el-table-column prop="word" label="单词" width="120" />
          <el-table-column prop="meaning" label="释义" min-width="150" />
          <el-table-column label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="row.status==='mastered'?'success':row.status==='learning'?'warning':'info'" size="small">
                {{ row.status === 'mastered' ? '已掌握' : row.status === 'learning' ? '学习中' : '新词' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="correct" label="正确" width="60" />
          <el-table-column prop="wrong" label="错误" width="60" />
          <el-table-column prop="lastReview" label="最近复习" width="100" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const bookFilter = ref('1')
const dialogVisible = ref(false)
const selectedStudent = ref(null)

const summary = [
  { label:'学员总数', value:28, color:'#6366F1' },
  { label:'平均掌握率', value:'76%', color:'#67C23A' },
  { label:'今日学习', value:'142词', color:'#E6A23C' },
  { label:'满分学员', value:'3人', color:'#F56C6C' }
]

const students = ref([
  { name:'张三', total:200, learned:182, mastery:91, newCount:3, learning:8, reviewing:12, mastered:162, streak:45, lastStudy:'2026-06-30',
    words:[{word:'abandon',meaning:'放弃',status:'mastered',correct:5,wrong:0,lastReview:'06-29'},{word:'ability',meaning:'能力',status:'mastered',correct:4,wrong:1,lastReview:'06-28'},{word:'abroad',meaning:'在国外',status:'learning',correct:2,wrong:2,lastReview:'06-25'}] },
  { name:'李四', total:200, learned:145, mastery:73, newCount:12, learning:18, reviewing:22, mastered:105, streak:32, lastStudy:'2026-06-29',
    words:[{word:'academic',meaning:'学术的',status:'mastered',correct:4,wrong:0,lastReview:'06-28'}] },
  { name:'王五', total:200, learned:88, mastery:44, newCount:35, learning:28, reviewing:15, mastered:45, streak:7, lastStudy:'2026-06-27',
    words:[{word:'accurate',meaning:'精确的',status:'learning',correct:1,wrong:3,lastReview:'06-25'}] },
  { name:'赵六', total:200, learned:168, mastery:84, newCount:5, learning:10, reviewing:15, mastered:143, streak:28, lastStudy:'2026-06-30',
    words:[{word:'achieve',meaning:'实现',status:'mastered',correct:4,wrong:1,lastReview:'06-30'}] },
  { name:'陈七', total:200, learned:200, mastery:100, newCount:0, learning:0, reviewing:0, mastered:200, streak:60, lastStudy:'2026-06-30',
    words:[{word:'abandon',meaning:'放弃',status:'mastered',correct:6,wrong:0,lastReview:'06-29'}] }
])

function showDetail(student) {
  selectedStudent.value = student
  dialogVisible.value = true
}
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.stat-card { text-align: center; padding: 8px 0; }
.stat-value { font-size: 32px; font-weight: 700; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.card-title { font-weight: 600; }
.progress-cell { display: flex; align-items: center; gap: 10px; }
</style>
