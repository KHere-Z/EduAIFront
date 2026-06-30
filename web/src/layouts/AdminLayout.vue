<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>安文AI</h1><span>管理后台</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/admin/dashboard"><el-icon><DataAnalysis /></el-icon>管理概览</el-menu-item>
          <el-menu-item index="/admin/teachers"><el-icon><Avatar /></el-icon>老师管理</el-menu-item>
          <el-menu-item index="/admin/students"><el-icon><User /></el-icon>学生管理</el-menu-item>
          <el-menu-item index="/admin/subjects"><el-icon><Collection /></el-icon>学科管理</el-menu-item>
          <el-menu-item index="/admin/word-libraries"><el-icon><Document /></el-icon>词库管理</el-menu-item>
          <el-menu-item index="/admin/grammar-libraries"><el-icon><Files /></el-icon>语法库管理</el-menu-item>
          <el-menu-item index="/admin/question-bank"><el-icon><Notebook /></el-icon>题库总管理</el-menu-item>
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
function logout() { auth.logout(); router.push('/login') }
</script>
