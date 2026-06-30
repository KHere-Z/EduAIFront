<template>
  <div class="agency-dashboard">
    <h2>🏢 {{ auth.user?.org_name || '机构管理中心' }}</h2>
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="hover">
          <el-statistic :title="stat.label" :value="stat.value" :suffix="stat.suffix">
            <template #prefix><el-icon :color="stat.color"><component :is="stat.icon" /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card><template #header>📅 今日排课</template><el-empty description="暂无排课" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header>💰 业绩概览</template><el-empty description="暂无数据" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const auth = useAuthStore()

const stats = [
  { label: '学员总数', value: 0, suffix: '人', icon: 'User', color: '#409EFF' },
  { label: '教练人数', value: 0, suffix: '人', icon: 'Avatar', color: '#67C23A' },
  { label: '本月课时', value: 0, suffix: '节', icon: 'Calendar', color: '#E6A23C' },
  { label: '本月营收', value: 0, suffix: '元', icon: 'Money', color: '#F56C6C' }
]
</script>

<style scoped>
.agency-dashboard h2 { margin-bottom: 24px; }
.stats-row { margin-bottom: 24px; }
</style>
