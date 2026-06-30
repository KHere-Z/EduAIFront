<template>
  <div class="platform-dashboard">
    <h2>🖥️ 平台管理中心</h2>
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
        <el-card><template #header>📊 机构分布</template><el-empty description="暂无数据" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><template #header>📈 增长趋势</template><el-empty description="暂无数据" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
const stats = [
  { label: '机构总数', value: 0, suffix: '家', icon: 'Office', color: '#409EFF' },
  { label: '教练总数', value: 0, suffix: '人', icon: 'Avatar', color: '#67C23A' },
  { label: '学员总数', value: 0, suffix: '人', icon: 'User', color: '#E6A23C' },
  { label: '词库单词', value: 0, suffix: '个', icon: 'Document', color: '#F56C6C' }
]
</script>

<style scoped>
.platform-dashboard h2 { margin-bottom: 24px; }
.stats-row { margin-bottom: 24px; }
</style>
