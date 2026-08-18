<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>智学AI</h1><span>老师工作台</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/teacher/dashboard"><el-icon><DataAnalysis /></el-icon>工作台</el-menu-item>
          <el-menu-item index="/teacher/students"><el-icon><User /></el-icon>学生信息</el-menu-item>
          <el-sub-menu index="manage">
            <template #title><el-icon><EditPen /></el-icon>学科管理</template>
            <el-menu-item v-for="s in manageSubjects" :key="s.value" :index="s.active ? manageLink(s.value) : ''" :disabled="!s.active">{{ s.icon }} {{ s.label }}<el-tag v-if="!s.active" size="small" type="info" style="margin-left:6px;font-size:10px">待开发</el-tag></el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="all-subjects">
            <template #title><el-icon><Collection /></el-icon>学科中心</template>
            <el-menu-item v-for="s in allSubjects" :key="s.value" :index="s.active ? centerLink(s.value) : ''" :disabled="!s.active">{{ s.icon }} {{ s.label }}<el-tag v-if="!s.active" size="small" type="info" style="margin-left:6px;font-size:10px">待开发</el-tag></el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/teacher/feedback"><el-icon><ChatLineSquare /></el-icon>学习反馈</el-menu-item>
          <!-- 收益中心暂隐藏：收益已转为智学点，后续市场调研需提现时再开放
          <el-menu-item index="/teacher/revenue"><el-icon><Wallet /></el-icon>收益中心</el-menu-item>
          -->
        </el-menu>
      </nav>
      <div class="sidebar-footer">
        <div class="sf-points" @click="$router.push('/teacher/recharge')" style="cursor:pointer">
          <span class="sfp-label">智学点</span>
          <span class="sfp-num">{{ pointsStore.points }}</span>
        </div>
        <el-button text @click="$router.push('/teacher/profile')" style="width:100%;margin-bottom:4px">👤 个人中心</el-button>
        <el-button text @click="logout" style="width:100%;color:var(--text-muted)"><el-icon><SwitchButton /></el-icon>退出</el-button>
      </div>
    </aside>
    <main class="main-content"><router-view /></main>
  </div>
</template>
<script setup>
import { computed, ref, onMounted } from 'vue'; import { useRoute, useRouter } from 'vue-router'; import { useAuthStore } from '@/store/auth'
import { usePointsStore } from '@/store/points'
import http from '@/api/request'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore(); const activeMenu = computed(() => route.path)
const pointsStore = usePointsStore()
onMounted(() => pointsStore.refresh())

const zh2en = { '语文':'chinese','数学':'math','英语':'english','物理':'physics','化学':'chemistry','生物':'biology','历史':'history','政治':'politics','地理':'geography' }
const icons = { '语文':'📝','数学':'📐','英语':'📖','物理':'⚛️','化学':'🧪','生物':'🧬','历史':'📜','政治':'⚖️','地理':'🌍' }

const manageSubjects = ['数学','语文','英语','物理','化学','生物','历史','政治','地理'].map(s => ({ value:zh2en[s], label:s, icon:icons[s]||'📚', active: s==='数学' }))

const allSubjectList = ['数学','语文','英语','物理','化学','生物','历史','政治','地理']
const allSubjects = allSubjectList.map(s => ({ value:zh2en[s], label:s, icon:icons[s]||'📚', active: s==='数学' }))

function manageLink(subject) {
  if (subject === 'english') return '/teacher/english/home'
  if (subject === 'math') return '/teacher/subject/math/manage'
  return `/teacher/subject/${subject}/wrong-questions`
}
function centerLink(subject) { return `/teacher/subject/${subject}` }

function logout() { auth.logout(); router.push('/login') }
</script>
<style scoped>
.sf-points { text-align: center; padding: 8px 0; margin-bottom: 8px; border-radius: 10px; background: linear-gradient(135deg, rgba(245,158,11,.15), rgba(251,191,36,.1)); transition: all .2s; }
.sf-points:hover { background: linear-gradient(135deg, rgba(245,158,11,.25), rgba(251,191,36,.2)); }
.sfp-label { font-size: 11px; color: var(--text-muted); display: block; }
.sfp-num { font-size: 22px; font-weight: 700; color: #F59E0B; }
</style>
