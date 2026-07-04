<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>老师工作台</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/teacher/dashboard"><el-icon><DataAnalysis /></el-icon>工作台</el-menu-item>
          <el-menu-item index="/teacher/students"><el-icon><User /></el-icon>学生信息</el-menu-item>
          <el-sub-menu index="subjects">
            <template #title><el-icon><Collection /></el-icon>学科中心</template>
            <el-menu-item v-for="s in subjects" :key="s.value" :index="subjectLink(s.value)">{{ s.icon }} {{ s.label }}</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/teacher/feedback"><el-icon><ChatLineSquare /></el-icon>学习反馈</el-menu-item>
        </el-menu>
      </nav>
      <div class="sidebar-footer"><el-button text @click="logout" style="width:100%;color:var(--text-muted)"><el-icon><SwitchButton /></el-icon>退出</el-button></div>
    </aside>
    <main class="main-content"><router-view /></main>
  </div>
</template>
<script setup>
import { computed } from 'vue'; import { useRoute, useRouter } from 'vue-router'; import { useAuthStore } from '@/store/auth'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore(); const activeMenu = computed(() => route.path)

const zh2en = { '语文':'chinese','数学':'math','英语':'english','物理':'physics','化学':'chemistry','生物':'biology','历史':'history','政治':'politics','地理':'geography' }
const icons = { '语文':'📝','数学':'📐','英语':'📖','物理':'⚛️','化学':'🧪','生物':'🧬','历史':'📜','政治':'⚖️','地理':'🌍' }

const teacherSubjects = computed(() => auth.user?.subjects || [])
const subjects = computed(() =>
  teacherSubjects.value.filter(s => zh2en[s]).map(s => ({ value:zh2en[s], label:s, icon:icons[s]||'📚' }))
)

function subjectLink(subject) {
  if (subject === 'english') return '/teacher/english/home'
  if (subject === 'math') return '/teacher/subject/math/manage'
  return `/teacher/subject/${subject}/wrong-questions`
}

function logout() { auth.logout(); router.push('/login') }
</script>
