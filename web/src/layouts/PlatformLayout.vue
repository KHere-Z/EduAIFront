<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <div class="logo">🖥️ 平台管理中心</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/platform/dashboard">
          <el-icon><DataAnalysis /></el-icon> 平台概览
        </el-menu-item>
        <el-menu-item index="/platform/organizations">
          <el-icon><Office /></el-icon> 机构管理
        </el-menu-item>
        <el-menu-item index="/platform/coaches">
          <el-icon><Avatar /></el-icon> 教练管理
        </el-menu-item>
        <el-menu-item index="/platform/students">
          <el-icon><User /></el-icon> 学员管理
        </el-menu-item>
        <el-menu-item index="/platform/word-libraries">
          <el-icon><Document /></el-icon> 词库管理
        </el-menu-item>
        <el-menu-item index="/platform/grammar-libraries">
          <el-icon><Files /></el-icon> 语法库管理
        </el-menu-item>
        <el-menu-item index="/platform/book-libraries">
          <el-icon><Notebook /></el-icon> 书库管理
        </el-menu-item>
        <el-menu-item index="/platform/referral">
          <el-icon><Share /></el-icon> 转介绍
        </el-menu-item>
        <el-menu-item index="/platform/poster">
          <el-icon><Picture /></el-icon> 宣传物料
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
