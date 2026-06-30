<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span class="card-title">🔍 错题详情</span></template>
          <el-form label-position="top">
            <el-form-item label="原题"><el-input v-model="question" type="textarea" :rows="3" placeholder="输入或粘贴错题内容..." /></el-form-item>
            <el-form-item label="学生答案"><el-input v-model="wrongAnswer" placeholder="学生给出的错误答案" /></el-form-item>
            <el-form-item label="正确答案"><el-input v-model="correctAnswer" placeholder="标准答案" /></el-form-item>
            <el-button type="primary" @click="analyze" :loading="analyzing">
              <el-icon><MagicStick /></el-icon>AI 分析错因
            </el-button>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <!-- AI 分析结果 -->
        <el-card v-if="result">
          <template #header><span class="card-title">🤖 AI 分析报告</span></template>
          <div class="result-section">
            <h4>错误根因</h4>
            <el-tag :type="result.rootCauseTag">{{ result.rootCause }}</el-tag>
            <p class="mt-md" style="color:var(--text-secondary);line-height:1.8">{{ result.analysis }}</p>
          </div>
          <div class="result-section mt-lg">
            <h4>掌握度评估</h4>
            <el-progress :percentage="result.mastery" :color="result.mastery > 60 ? '#10B981' : result.mastery > 30 ? '#F59E0B' : '#EF4444'" />
          </div>
        </el-card>

        <!-- 举一反三 -->
        <el-card class="mt-lg" v-if="result">
          <template #header><span class="card-title">🔄 举一反三</span></template>
          <div v-for="(q, i) in result.similarQuestions" :key="i" class="similar-item">
            <span class="similar-num">{{ i + 1 }}</span>
            <span class="similar-text">{{ q }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const question = ref('')
const wrongAnswer = ref('')
const correctAnswer = ref('')
const analyzing = ref(false)
const result = ref(null)

function analyze() {
  if (!question.value) { ElMessage.warning('请输入错题内容'); return }
  analyzing.value = true
  // 模拟 AI 分析
  setTimeout(() => {
    result.value = {
      rootCause: '概念混淆',
      rootCauseTag: 'danger',
      analysis: '学生对"二次函数顶点式"的概念理解有偏差，混淆了顶点坐标 (h,k) 与一般式系数 a/b/c 的对应关系。建议回顾顶点式 y=a(x-h)²+k 的推导过程，明确 h=-b/(2a)。',
      mastery: 42,
      similarQuestions: [
        '已知二次函数 y=2(x-3)²+1，求其对称轴和顶点坐标。',
        '把 y=x²+6x+5 化为顶点式，并写出顶点坐标。',
        '若二次函数顶点为 (2,-3) 且过 (0,1)，求解析式。'
      ]
    }
    analyzing.value = false
  }, 1500)
}
</script>

<style scoped>
.card-title { font-weight: 600; }
.result-section h4 { font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px; }
.mt-md { margin-top: var(--space-md); }
.mt-lg { margin-top: var(--space-lg); }
.similar-item { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--color-border-light); align-items:flex-start; }
.similar-num { width:24px;height:24px;border-radius:50%;background:var(--color-primary-bg);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0; }
.similar-text { font-size:14px; color:var(--text-secondary); line-height:1.7; }
</style>
