<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>平台管理中心</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/platform/dashboard"><el-icon><DataAnalysis /></el-icon>平台概览</el-menu-item>
          <el-menu-item index="/platform/organizations"><el-icon><Office /></el-icon>机构管理</el-menu-item>
          <el-menu-item index="/platform/coaches"><el-icon><Avatar /></el-icon>教练管理</el-menu-item>
          <el-menu-item index="/platform/students"><el-icon><User /></el-icon>学员管理</el-menu-item>
          <el-menu-item index="/platform/word-libraries"><el-icon><Document /></el-icon>词库管理</el-menu-item>
          <el-menu-item index="/platform/grammar-libraries"><el-icon><Files /></el-icon>语法库管理</el-menu-item>
          <el-menu-item index="/platform/book-libraries"><el-icon><Notebook /></el-icon>书库管理</el-menu-item>
          <el-menu-item index="/platform/referral"><el-icon><Share /></el-icon>转介绍</el-menu-item>
          <el-menu-item index="/platform/poster"><el-icon><Picture /></el-icon>宣传物料</el-menu-item>
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
