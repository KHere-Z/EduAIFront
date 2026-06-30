<template>
  <el-row :gutter="20">
    <el-col :span="7">
      <el-card>
        <template #header><span class="card-title">📂 知识体系</span></template>
        <el-tree :data="tree" :props="{ children:'children', label:'label' }" node-key="id" default-expand-all highlight-current>
          <template #default="{ data }">
            <span style="font-size:14px">{{ data.label }}</span>
            <el-tag size="small" style="margin-left:8px" :type="data.mastery > 70 ? 'success' : data.mastery > 40 ? 'warning' : 'danger'">{{ data.mastery }}%</el-tag>
          </template>
        </el-tree>
      </el-card>
    </el-col>
    <el-col :span="17">
      <el-card>
        <template #header><span class="card-title">📖 {{ selectedNode?.label || '请选择知识点' }}</span></template>
        <el-empty v-if="!selectedNode" description="左侧选择知识点查看详情" />
        <div v-else>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="所属单元">第{{ selectedNode.unit }}单元</el-descriptions-item>
            <el-descriptions-item label="掌握度">{{ selectedNode.mastery }}%</el-descriptions-item>
            <el-descriptions-item label="关联考点" :span="2">{{ selectedNode.examPoints || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="典型例题" :span="2">{{ selectedNode.example || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref } from 'vue'

const selectedNode = ref(null)

const tree = [
  { id:1, label:'数与代数', unit:1, mastery:82, examPoints:'实数运算·代数式化简', example:'已知 x+y=5, xy=6, 求 x²+y²', children:[
    { id:11, label:'实数与运算', unit:1, mastery:90, examPoints:'实数分类·运算法则' },
    { id:12, label:'代数式', unit:1, mastery:74, examPoints:'整式·分式·二次根式' }
  ]},
  { id:2, label:'方程与不等式', unit:2, mastery:68, examPoints:'一元二次方程·不等式组', children:[
    { id:21, label:'一元一次方程', unit:2, mastery:85 },
    { id:22, label:'一元二次方程', unit:2, mastery:60 },
    { id:23, label:'不等式与不等式组', unit:2, mastery:59 }
  ]},
  { id:3, label:'函数', unit:3, mastery:45, examPoints:'一次函数·二次函数·反比例函数', children:[
    { id:31, label:'一次函数', unit:3, mastery:62 },
    { id:32, label:'二次函数', unit:3, mastery:38 },
    { id:33, label:'反比例函数', unit:3, mastery:35 }
  ]}
]
</script>

<style scoped>
.card-title { font-weight: 600; }
</style>
