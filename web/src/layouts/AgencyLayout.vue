<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <div class="logo">🏢 机构管理中心</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/agency/dashboard">
          <el-icon><DataAnalysis /></el-icon> 工作台
        </el-menu-item>
        <el-menu-item index="/agency/students">
          <el-icon><User /></el-icon> 学员管理
        </el-menu-item>
        <el-menu-item index="/agency/coaches">
          <el-icon><Avatar /></el-icon> 教练管理
        </el-menu-item>
        <el-menu-item index="/agency/courses">
          <el-icon><Collection /></el-icon> 课程管理
        </el-menu-item>
        <el-menu-item index="/agency/schedule">
          <el-icon><Calendar /></el-icon> 排课管理
        </el-menu-item>
        <el-menu-item index="/agency/crm">
          <el-icon><Opportunity /></el-icon> 销售中心
        </el-menu-item>
        <el-menu-item index="/agency/records">
          <el-icon><List /></el-icon> 学习记录
        </el-menu-item>
        <el-menu-item index="/agency/study-plan">
          <el-icon><Guide /></el-icon> 学习规划
        </el-menu-item>
        <el-menu-item index="/agency/lexile">
          <el-icon><TrendCharts /></el-icon> 蓝思值解读
        </el-menu-item>
        <el-menu-item index="/agency/feedback">
          <el-icon><ChatLineSquare /></el-icon> 学习反馈
        </el-menu-item>
        <el-menu-item index="/agency/certificate">
          <el-icon><Medal /></el-icon> 证书管理
        </el-menu-item>
        <el-menu-item index="/agency/referral">
          <el-icon><Share /></el-icon> 转介绍
        </el-menu-item>
        <el-menu-item index="/agency/poster">
          <el-icon><Picture /></el-icon> 宣传物料
        </el-menu-item>
        <el-menu-item index="/agency/tools">
          <el-icon><SetUp /></el-icon> 工具箱
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
