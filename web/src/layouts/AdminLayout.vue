<template>
  <div class="sidebar-layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h1>智学AI</h1><span>管理后台</span></div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/admin/dashboard"><el-icon><DataAnalysis /></el-icon>管理概览</el-menu-item>
          <el-menu-item index="/admin/students"><el-icon><User /></el-icon>学生管理</el-menu-item>
          <el-menu-item index="/admin/teachers"><el-icon><Avatar /></el-icon>老师管理</el-menu-item>
          <el-menu-item index="/admin/schedules"><el-icon><Calendar /></el-icon>排课查看</el-menu-item>
          <el-menu-item index="/admin/resources"><el-icon><FolderOpened /></el-icon>学习资源上传</el-menu-item>
          <!-- 提现审核暂隐藏：收益已转为智学点，后续开放提现时再恢复
          <el-menu-item index="/admin/withdraws"><el-icon><Coin /></el-icon>提现审核</el-menu-item>
          -->
          <el-menu-item index="/admin/settings"><el-icon><SetUp /></el-icon>系统设置</el-menu-item>
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
