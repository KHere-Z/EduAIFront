<template>
  <div>
    <el-row :gutter="16" class="mb-lg">
      <el-col :span="6"><el-input v-model="search" placeholder="搜索题目..." :prefix-icon="Search" clearable /></el-col>
      <el-col :span="4">
        <el-select v-model="filterErrorType" placeholder="错误类型" clearable>
          <el-option label="概念混淆" value="concept" /><el-option label="计算失误" value="calc" />
          <el-option label="审题不清" value="reading" /><el-option label="粗心" value="careless" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select v-model="filterDifficulty" placeholder="难度" clearable>
          <el-option label="简单" value="easy" /><el-option label="中等" value="medium" /><el-option label="困难" value="hard" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="showAdd = true"><el-icon><Plus /></el-icon>录入错题</el-button>
      </el-col>
    </el-row>

    <el-table :data="questions" stripe style="width:100%">
      <el-table-column prop="id" label="#" width="60" />
      <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
      <el-table-column prop="errorTypeLabel" label="错误类型" width="100">
        <template #default="{row}"><el-tag :type="row.errorTag" size="small">{{ row.errorTypeLabel }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="difficultyLabel" label="难度" width="80" />
      <el-table-column prop="kpName" label="关联知识点" width="120" />
      <el-table-column prop="date" label="录入时间" width="110" />
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" text type="primary" @click="$router.push(`/coach/subject/${$route.params.subject}/wrong-analysis?id=${row.id}`)">分析</el-button>
          <el-button size="small" text type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-lg" style="text-align:right">
      <el-pagination v-model:current-page="page" :total="total" :page-size="20" layout="total, prev, pager, next" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'

const search = ref('')
const filterErrorType = ref('')
const filterDifficulty = ref('')
const page = ref(1)
const total = ref(48)

const questions = ref([
  { id:1, title:'若 a² + b² = c²，且 a=3, b=4，求 c 的值。', errorTypeLabel:'计算失误', errorTag:'warning', difficultyLabel:'简单', kpName:'勾股定理', date:'06-28' },
  { id:2, title:'下列哪个是二次函数的图像特征？', errorTypeLabel:'概念混淆', errorTag:'danger', difficultyLabel:'中等', kpName:'二次函数', date:'06-27' },
  { id:3, title:'When did the Industrial Revolution begin?', errorTypeLabel:'审题不清', errorTag:'info', difficultyLabel:'中等', kpName:'工业革命', date:'06-27' },
  { id:4, title:'写出光合作用的化学方程式。', errorTypeLabel:'粗心', errorTag:'', difficultyLabel:'简单', kpName:'光合作用', date:'06-26' },
  { id:5, title:'计算: ∫(2x+3)dx', errorTypeLabel:'计算失误', errorTag:'warning', difficultyLabel:'困难', kpName:'不定积分', date:'06-25' }
])

function remove(id) { questions.value = questions.value.filter(q => q.id !== id) }
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.mt-lg { margin-top: var(--space-lg); }
</style>
