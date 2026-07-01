<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>老师工作台</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/teacher/dashboard"><el-icon><DataAnalysis /></el-icon>工作台</el-menu-item>
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

const subjectMeta = { chinese:{label:'语文',icon:'📝'}, math:{label:'数学',icon:'📐'}, english:{label:'英语',icon:'📖', link:'/teacher/classroom'}, physics:{label:'物理',icon:'⚛️'}, chemistry:{label:'化学',icon:'🧪'}, biology:{label:'生物',icon:'🧬'}, history:{label:'历史',icon:'📜'}, politics:{label:'政治',icon:'⚖️'}, geography:{label:'地理',icon:'🌍'} }

const teacherSubjects = computed(() => auth.user?.subjects || [])
const subjects = computed(() =>
  teacherSubjects.value.filter(k => subjectMeta[k]).map(k => ({ value:k, ...subjectMeta[k] }))
)

function subjectLink(subject) {
  // 英语跳到课堂管理，其他学科跳到错题整理
  if (subject === 'english') return '/teacher/classroom'
  return `/teacher/subject/${subject}/wrong-questions`
}

function logout() { auth.logout(); router.push('/login') }
</script>
