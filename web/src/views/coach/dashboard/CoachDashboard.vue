<template>
  <div class="coach-dashboard">
    <h2>👋 欢迎回来，{{ auth.user?.real_name || '教练' }}</h2>
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover">
          <el-statistic :title="stat.label" :value="stat.value" :suffix="stat.suffix">
            <template #prefix><el-icon :color="stat.color"><component :is="stat.icon" /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card title="快捷操作">
          <template #header>⚡ 快捷操作</template>
          <el-row :gutter="12">
            <el-col :span="8" v-for="action in quickActions" :key="action.text">
              <el-button :type="action.type" :icon="action.icon" class="action-btn" @click="$router.push(action.path)">
                {{ action.text }}
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>📊 今日概览</template>
          <div class="today-item" v-for="item in todayStats" :key="item.label">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()

const stats = [
  { label: '我的学员', value: 0, suffix: '人', icon: 'User', color: '#409EFF' },
  { label: '今日课堂', value: 0, suffix: '节', icon: 'Reading', color: '#67C23A' },
  { label: '待批作业', value: 0, suffix: '份', icon: 'Edit', color: '#E6A23C' },
  { label: '学员进步', value: 0, suffix: '%', icon: 'TrendCharts', color: '#F56C6C' }
]

const quickActions = [
  { text: '开始课堂', icon: 'Reading', type: 'primary', path: '/coach/classroom' },
  { text: '词汇测试', icon: 'Document', type: 'success', path: '/coach/vocab-test' },
  { text: 'AI 阅读', icon: 'Notebook', type: 'warning', path: '/coach/ai-reading' },
  { text: 'AI 口语', icon: 'MagicStick', type: 'danger', path: '/coach/ai-dialogue' },
  { text: '蓝思报告', icon: 'TrendCharts', type: 'info', path: '/coach/lexile' },
  { text: '学习反馈', icon: 'ChatLineSquare', type: '', path: '/coach/feedback' }
]

const todayStats = [
  { label: '本周课时', value: '0' },
  { label: '新增学员', value: '0' },
  { label: '测试完成', value: '0' },
  { label: '阅读篇数', value: '0' }
]
</script>

<style scoped>
.coach-dashboard h2 { margin-bottom: 24px; font-size: 22px; }
.stats-row { margin-bottom: 24px; }
.content-row { }
.action-btn { width: 100%; margin-bottom: 8px; height: 64px; font-size: 15px; }
.today-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ebeef5; }
</style>
