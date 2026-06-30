<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>安文AI</h1>
        <span>教师工作台</span>
      </div>

      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/coach/dashboard">
            <el-icon><DataAnalysis /></el-icon> 工作台
          </el-menu-item>

          <el-sub-menu index="english">
            <template #title><el-icon><Reading /></el-icon> 英语</template>
            <el-menu-item index="/coach/classroom">课堂管理</el-menu-item>
            <el-menu-item index="/coach/vocab-test">词汇测试</el-menu-item>
            <el-menu-item index="/coach/word-memorize">单词记忆</el-menu-item>
            <el-menu-item index="/coach/core-words">核心词汇</el-menu-item>
            <el-menu-item index="/coach/ai-reading">AI 阅读理解</el-menu-item>
            <el-menu-item index="/coach/deep-reading">深度阅读</el-menu-item>
            <el-menu-item index="/coach/ai-dialogue">AI 情境口语</el-menu-item>
            <el-menu-item index="/coach/grammar">语法体系</el-menu-item>
            <el-menu-item index="/coach/sentence-practice">造句练习</el-menu-item>
            <el-menu-item index="/coach/reading-classroom">阅读课堂</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="subjects">
            <template #title><el-icon><Collection /></el-icon> 学科中心</template>
            <el-menu-item
              v-for="s in subjects"
              :key="s.value"
              :index="`/coach/subject/${s.value}/wrong-questions`"
            >{{ s.icon }} {{ s.label }}</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/coach/feedback">
            <el-icon><ChatLineSquare /></el-icon> 学习反馈
          </el-menu-item>
          <el-menu-item index="/coach/tools">
            <el-icon><SetUp /></el-icon> 工具箱
          </el-menu-item>
        </el-menu>
      </nav>

      <div class="sidebar-footer">
        <el-button text @click="handleLogout" style="width:100%;color:var(--text-muted)">
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-button>
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activeMenu = computed(() => route.path)

const subjects = [
  { value: 'chinese',  label: '语文', icon: '📝' },
  { value: 'math',     label: '数学', icon: '📐' },
  { value: 'english',  label: '英语', icon: '📖' },
  { value: 'physics',  label: '物理', icon: '⚛️' },
  { value: 'chemistry',label: '化学', icon: '🧪' },
  { value: 'biology',  label: '生物', icon: '🧬' },
  { value: 'history',  label: '历史', icon: '📜' },
  { value: 'politics', label: '政治', icon: '⚖️' },
  { value: 'geography',label: '地理', icon: '🌍' }
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
