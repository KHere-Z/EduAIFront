<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <div class="logo">🎓 教练工作台</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/coach/dashboard">
          <el-icon><DataAnalysis /></el-icon> 工作台
        </el-menu-item>
        <el-sub-menu index="class">
          <template #title><el-icon><Reading /></el-icon> 课堂</template>
          <el-menu-item index="/coach/classroom">课堂管理</el-menu-item>
          <el-menu-item index="/coach/completed-classes">已完成课堂</el-menu-item>
          <el-menu-item index="/coach/reading-classroom">阅读课堂</el-menu-item>
          <el-menu-item index="/coach/core1000-classroom">核心1000词课堂</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="word">
          <template #title><el-icon><Document /></el-icon> 词汇</template>
          <el-menu-item index="/coach/vocab-test">词汇测试</el-menu-item>
          <el-menu-item index="/coach/word-memorize">单词记忆</el-menu-item>
          <el-menu-item index="/coach/core-words">核心词汇</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="reading">
          <template #title><el-icon><Notebook /></el-icon> 阅读</template>
          <el-menu-item index="/coach/ai-reading">AI 阅读理解</el-menu-item>
          <el-menu-item index="/coach/deep-reading">深度阅读</el-menu-item>
          <el-menu-item index="/coach/book-preview">书籍预览</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="ai">
          <template #title><el-icon><MagicStick /></el-icon> AI 工具</template>
          <el-menu-item index="/coach/ai-dialogue">AI 情境口语</el-menu-item>
          <el-menu-item index="/coach/grammar">语法体系</el-menu-item>
          <el-menu-item index="/coach/sentence-practice">造句练习</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/coach/lexile">
          <el-icon><TrendCharts /></el-icon> 蓝思值报告
        </el-menu-item>
        <el-menu-item index="/coach/feedback">
          <el-icon><ChatLineSquare /></el-icon> 学习反馈
        </el-menu-item>
        <el-menu-item index="/coach/tools">
          <el-icon><SetUp /></el-icon> 工具箱
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.layout-container { height: 100vh; }
.el-aside { background: #f5f7fa; border-right: 1px solid #e4e7ed; }
.logo { padding: 20px; font-size: 18px; font-weight: bold; text-align: center; }
.el-main { padding: 20px; }
</style>
