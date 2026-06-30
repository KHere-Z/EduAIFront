<template>
  <el-row :gutter="16">
    <el-col :span="8" v-for="m in models" :key="m.id" class="mb-lg">
      <el-card shadow="hover" @click="selected = m" :class="['model-card', { active: selected?.id === m.id }]">
        <div class="model-icon">{{ m.icon }}</div>
        <h4>{{ m.name }}</h4>
        <p>{{ m.desc }}</p>
        <el-tag size="small">{{ m.count }} 道例题</el-tag>
      </el-card>
    </el-col>
  </el-row>

  <el-dialog v-model="showDetail" :title="selected?.name" width="700px">
    <div v-if="selected">
      <h4>解法模板</h4>
      <div class="template-box">{{ selected.template }}</div>
      <h4 class="mt-lg">典型例题</h4>
      <p style="color:var(--text-secondary)">{{ selected.example }}</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
const selected = ref(null)
const showDetail = computed({ get:() => !!selected.value, set:(v) => { if(!v) selected.value = null } })
const models = ref([
  { id:1, icon:'📐', name:'函数模型', desc:'建立函数关系解决实际问题', count:12, template:'1. 设未知数\n2. 列函数关系\n3. 利用性质求解\n4. 检验实际意义', example:'某商品定价问题...' },
  { id:2, icon:'🔺', name:'几何模型', desc:'辅助线构造与图形变换', count:8, template:'1. 分析已知条件\n2. 作辅助线\n3. 找全等/相似\n4. 推导结论' },
  { id:3, icon:'📊', name:'概率模型', desc:'古典概型与统计推断', count:6, template:'1. 确定样本空间\n2. 列举事件\n3. 计算概率\n4. 期望分析' },
  { id:4, icon:'⚡', name:'力学模型', desc:'牛顿定律与运动分析', count:10, template:'1. 受力分析\n2. 列方程\n3. 联立求解\n4. 结果讨论' },
  { id:5, icon:'🔬', name:'离子反应', desc:'离子方程式与定量计算', count:7, template:'1. 写化学方程式\n2. 拆离子\n3. 去相同\n4. 写离子方程' },
  { id:6, icon:'🧬', name:'遗传模型', desc:'孟德尔遗传定律分析', count:5, template:'1. 确定性状显隐\n2. 写基因型\n3. 画遗传图解\n4. 算概率' }
])
</script>

<style scoped>
.mb-lg { margin-bottom: var(--space-lg); }
.model-card { cursor: pointer; border: 2px solid transparent; }
.model-card.active { border-color: var(--color-primary); }
.model-icon { font-size: 32px; margin-bottom: 8px; }
.model-card h4 { font-size: 16px; margin-bottom: 4px; }
.model-card p { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.template-box { background: var(--color-bg-alt); padding: 16px; border-radius: var(--radius-sm); font-family: monospace; font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
.mt-lg { margin-top: var(--space-lg); }
</style>
