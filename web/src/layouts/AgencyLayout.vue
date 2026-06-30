<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>机构管理中心</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/agency/dashboard"><el-icon><DataAnalysis /></el-icon>工作台</el-menu-item>
          <el-menu-item index="/agency/students"><el-icon><User /></el-icon>学员管理</el-menu-item>
          <el-menu-item index="/agency/coaches"><el-icon><Avatar /></el-icon>教练管理</el-menu-item>
          <el-menu-item index="/agency/courses"><el-icon><Collection /></el-icon>课程管理</el-menu-item>
          <el-menu-item index="/agency/schedule"><el-icon><Calendar /></el-icon>排课管理</el-menu-item>
          <el-menu-item index="/agency/crm"><el-icon><Opportunity /></el-icon>销售中心</el-menu-item>
          <el-menu-item index="/agency/records"><el-icon><List /></el-icon>学习记录</el-menu-item>
          <el-menu-item index="/agency/study-plan"><el-icon><Guide /></el-icon>学习规划</el-menu-item>
          <el-menu-item index="/agency/feedback"><el-icon><ChatLineSquare /></el-icon>学习反馈</el-menu-item>
          <el-menu-item index="/agency/certificate"><el-icon><Medal /></el-icon>证书管理</el-menu-item>
          <el-menu-item index="/agency/referral"><el-icon><Share /></el-icon>转介绍</el-menu-item>
          <el-menu-item index="/agency/poster"><el-icon><Picture /></el-icon>宣传物料</el-menu-item>
          <el-menu-item index="/agency/tools"><el-icon><SetUp /></el-icon>工具箱</el-menu-item>
        </el-menu>
      </nav>
      <div class="sidebar-footer">
        <el-button text @click="handleLogout" style="width:100%;color:var(--text-muted)"><el-icon><SwitchButton /></el-icon>退出登录</el-button>
      </div>
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
function handleLogout() { auth.logout(); router.push('/login') }
</script>
