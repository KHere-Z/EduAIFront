<template>
  <div>
    <el-row :gutter="12" class="mb-lg">
      <el-col :span="5"><el-input v-model="search" placeholder="搜索题目..." :prefix-icon="Search" clearable /></el-col>
      <el-col :span="3"><el-select v-model="filterType" placeholder="题型" clearable><el-option label="选择题" value="choice"/><el-option label="填空题" value="fill"/><el-option label="解答题" value="answer"/></el-select></el-col>
      <el-col :span="3"><el-select v-model="filterDiff" placeholder="难度" clearable><el-option label="简单" value="easy"/><el-option label="中等" value="medium"/><el-option label="困难" value="hard"/></el-select></el-col>
      <el-col :span="3"><el-select v-model="filterKp" placeholder="知识点" clearable><el-option v-for="k in kpList" :key="k" :label="k" :value="k"/></el-select></el-col>
      <el-col :span="2"><el-button type="primary"><el-icon><Plus /></el-icon>新增</el-button></el-col>
    </el-row>

    <el-table :data="questions" stripe>
      <el-table-column prop="id" label="#" width="60"/>
      <el-table-column prop="title" label="题目" min-width="250" show-overflow-tooltip/>
      <el-table-column prop="typeLabel" label="题型" width="80"/>
      <el-table-column label="难度" width="80"><template #default="{row}"><el-tag :type="row.diffTag" size="small">{{ row.difficultyLabel }}</el-tag></template></el-table-column>
      <el-table-column prop="kp" label="知识点" width="100"/>
      <el-table-column label="操作" width="120"><template #default><el-button size="small" text type="primary">详情</el-button><el-button size="small" text type="primary">组卷</el-button></template></el-table-column>
    </el-table>
    <div class="mt-lg" style="text-align:right"><el-pagination :total="156" layout="total, prev, pager, next" /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
const search = ref(''); const filterType = ref(''); const filterDiff = ref(''); const filterKp = ref('')
const kpList = ['勾股定理','二次函数','一元二次方程','相似三角形']
const questions = ref([
  { id:1, title:'在 Rt△ABC 中，∠C=90°，AC=3，BC=4，求 AB。', typeLabel:'填空题', difficultyLabel:'简单', diffTag:'success', kp:'勾股定理' },
  { id:2, title:'抛物线 y=x²-4x+3 的顶点坐标是？', typeLabel:'选择题', difficultyLabel:'中等', diffTag:'warning', kp:'二次函数' },
  { id:3, title:'解方程 x²-5x+6=0', typeLabel:'解答题', difficultyLabel:'中等', diffTag:'warning', kp:'一元二次方程' }
])
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.mt-lg { margin-top: var(--space-lg); }
</style>
