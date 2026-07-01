<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>📖 英语学科中心</h2>
        <p>课堂管理 · 词汇教学 · AI工具 · 学员进度</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-icon" style="background:#EEF2FF"><el-icon :size="20"><Reading /></el-icon></div><div class="stat-value">4</div><div class="stat-label">进行中课堂</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-icon" style="background:#ECFDF5"><el-icon :size="20"><User /></el-icon></div><div class="stat-value">28</div><div class="stat-label">英语学员</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card"><div class="stat-icon" style="background:#FFF7ED"><el-icon :size="20"><Document /></el-icon></div><div class="stat-value">1,250</div><div class="stat-label">已学单词</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover" class="stat-card" @click="goProgress"><div class="stat-icon" style="background:#FEF2F2;cursor:pointer"><el-icon :size="20"><TrendCharts /></el-icon></div><div class="stat-value">{{ progressRatio }}%</div><div class="stat-label">平均掌握率 → 详情</div></el-card></el-col>
    </el-row>

    <!-- 功能入口 -->
    <el-card class="mt-lg">
      <template #header><span class="card-title">⚡ 教学功能</span></template>
      <el-row :gutter="16">
        <el-col :span="6" v-for="item in features" :key="item.path">
          <div class="feature-card" @click="$router.push(item.path)">
            <div class="feature-icon" :style="{ background: item.bg }">
              <el-icon :size="22"><component :is="item.icon" /></el-icon>
            </div>
            <div class="feature-info">
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 学员单词进度 -->
    <el-card class="mt-lg">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">📊 学员单词学习进度</span>
          <el-button type="primary" size="small" @click="goProgress">查看全部</el-button>
        </div>
      </template>
      <el-table :data="students" stripe size="small">
        <el-table-column prop="name" label="学员" width="80" />
        <el-table-column label="进度条" min-width="180">
          <template #default="{row}">
            <div class="progress-cell">
              <el-progress :percentage="row.mastery" :color="row.mastery > 70 ? '#67C23A' : row.mastery > 40 ? '#E6A23C' : '#F56C6C'" :stroke-width="16" />
              <span class="progress-text">{{ row.learned }}/{{ row.total }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="statusLabel" label="状态" width="90">
          <template #default="{row}"><el-tag :type="row.statusTag" size="small">{{ row.statusLabel }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="lastStudy" label="最近学习" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const progressRatio = computed(() => {
  const total = students.reduce((s, r) => s + r.total, 0)
  const learned = students.reduce((s, r) => s + r.learned, 0)
  return total ? Math.round(learned / total * 100) : 0
})

function goProgress() { router.push('/teacher/english/word-progress') }

const features = [
  { title:'课堂管理',   desc:'创建班级·排课·记录',       icon:'Reading',         path:'/teacher/classroom',           bg:'#EEF2FF' },
  { title:'词汇测试',   desc:'选词库·组卷·批改',         icon:'Document',        path:'/teacher/vocab-test',          bg:'#ECFDF5' },
  { title:'单词记忆',   desc:'记单词·艾宾浩斯复习',       icon:'Collection',      path:'/teacher/word-memorize',       bg:'#FFF7ED' },
  { title:'AI 阅读',    desc:'阅读理解·AI批改',          icon:'Notebook',        path:'/teacher/ai-reading',          bg:'#FEF2F2' },
  { title:'AI 口语',    desc:'情境对话·AI评测',          icon:'MagicStick',      path:'/teacher/ai-dialogue',         bg:'#F5F3FF' },
  { title:'语法体系',   desc:'知识点·公式·例句',         icon:'Files',           path:'/teacher/grammar',             bg:'#F0FDFA' },
  { title:'造句练习',   desc:'语法实战·即时批改',         icon:'EditPen',         path:'/teacher/sentence-practice',   bg:'#FFF1F0' },
  { title:'学习反馈',   desc:'强弱项·AI诊断·周报',       icon:'ChatLineSquare',  path:'/teacher/feedback',            bg:'#F0FDFA' }
]

const students = [
  { name:'张三', total:200, learned:182, mastery:91, statusLabel:'优秀', statusTag:'success', lastStudy:'今天' },
  { name:'李四', total:200, learned:145, mastery:73, statusLabel:'良好', statusTag:'warning', lastStudy:'昨天' },
  { name:'王五', total:200, learned:88,  mastery:44, statusLabel:'薄弱', statusTag:'danger',  lastStudy:'3天前' },
  { name:'赵六', total:200, learned:168, mastery:84, statusLabel:'良好', statusTag:'warning', lastStudy:'今天' },
  { name:'陈七', total:200, learned:200, mastery:100,statusLabel:'全部掌握',statusTag:'success',lastStudy:'今天' }
]
</script>

<style scoped>
.stats-row { margin-bottom: var(--space-lg); }
.stat-card { text-align: center; padding: 8px 0; cursor: default; }
.stat-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: var(--color-primary); }
.stat-value { font-size: 32px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.mt-lg { margin-top: var(--space-lg); }
.card-title { font-weight: 600; font-size: 15px; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }

.feature-card {
  display: flex; align-items: center; gap: 12px; padding: 14px;
  border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition);
  border: 1px solid var(--color-border-light); margin-bottom: 10px;
}
.feature-card:hover { background: var(--color-bg-alt); border-color: var(--color-primary-light); }
.feature-icon { width: 44px; height: 44px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--color-primary); flex-shrink: 0; }
.feature-info strong { display: block; font-size: 14px; margin-bottom: 2px; }
.feature-info span { font-size: 12px; color: var(--text-muted); }

.progress-cell { display: flex; align-items: center; gap: 8px; }
.progress-text { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
</style>
