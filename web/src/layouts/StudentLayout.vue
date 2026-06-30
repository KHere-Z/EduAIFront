<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>学习中心</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/student/dashboard"><el-icon><HomeFilled /></el-icon>学习中心</el-menu-item>
          <el-menu-item index="/student/wrong-book"><el-icon><Edit /></el-icon>我的错题本</el-menu-item>
          <el-menu-item index="/student/practice"><el-icon><Reading /></el-icon>智能练习</el-menu-item>
          <el-menu-item index="/student/ai-analysis"><el-icon><TrendCharts /></el-icon>AI学情分析</el-menu-item>
          <el-menu-item index="/student/scores"><el-icon><DataAnalysis /></el-icon>我的成绩</el-menu-item>
          <el-sub-menu index="subjects">
            <template #title><el-icon><Collection /></el-icon>学科学习</template>
            <el-menu-item v-for="s in subjects" :key="s.value" :index="`/student/subject/${s.value}`">{{ s.icon }} {{ s.label }}</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </nav>
      <div class="sidebar-footer"><el-button text @click="logout" style="width:100%;color:var(--text-muted)"><el-icon><SwitchButton /></el-icon>退出</el-button></div>
    </aside>
    <main class="main-content"><router-view /></main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore()
const activeMenu = computed(() => route.path)
const subjects = [
  { value:'chinese',label:'语文',icon:'📝'},{value:'math',label:'数学',icon:'📐'},{value:'english',label:'英语',icon:'📖'},
  { value:'physics',label:'物理',icon:'⚛️'},{value:'chemistry',label:'化学',icon:'🧪'},{value:'biology',label:'生物',icon:'🧬'},
  { value:'history',label:'历史',icon:'📜'},{value:'politics',label:'政治',icon:'⚖️'},{value:'geography',label:'地理',icon:'🌍'}
]
function logout() { auth.logout(); router.push('/login') }
</script>
