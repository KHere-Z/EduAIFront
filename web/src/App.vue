<template>
  <!-- 全局中文语言包：分页显示「总共 N 条」，日期选择器等同步中文化 -->
  <el-config-provider :locale="elementLocale">
    <router-view />
    <!-- 全局 AI 分析进度悬浮窗（后台运行 + 拖动 + 点击返回） -->
    <AiProgressWidget />
  </el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import AiProgressWidget from '@/components/AiProgressWidget.vue'
import elementLocale from '@/utils/elementLocale'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
// 启动时用 /auth/me 兜底刷新一次 user，确保 uid/subjects 等字段与后端一致
// （后端已在 doLogin / me() / createStudent 兜底补 uid，此处覆盖已登录旧会话的刷新）
onMounted(() => {
  if (auth.isLoggedIn) auth.fetchUserInfo().catch(() => {})
})
</script>
