<template>
  <router-view />
  <!-- 全局 AI 分析进度悬浮窗（后台运行 + 拖动 + 点击返回） -->
  <AiProgressWidget />
</template>

<script setup>
import { onMounted } from 'vue'
import AiProgressWidget from '@/components/AiProgressWidget.vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
// 启动时用 /auth/me 兜底刷新一次 user，确保 uid/subjects 等字段与后端一致
// （后端已在 doLogin / me() / createStudent 兜底补 uid，此处覆盖已登录旧会话的刷新）
onMounted(() => {
  if (auth.isLoggedIn) auth.fetchUserInfo().catch(() => {})
})
</script>
