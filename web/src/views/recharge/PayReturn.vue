<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  const oid = route.query.out_trade_no
  if (!oid) return router.replace('/')

  // 3=老师 4=学生
  const prefix = auth.role === 3 ? '/teacher' : auth.role === 4 ? '/student' : null
  if (!prefix) {
    // 无登录态（PC 会话已结束）：带着单号去登录，登录后再回来
    return router.replace({ path: '/login', query: { redirect: String(oid) } })
  }
  router.replace(`${prefix}/recharge?out_trade_no=${oid}`)
})
</script>

<template>
  <div style="min-height:60vh;display:flex;align-items:center;justify-content:center;color:#888">
    正在返回支付结果…
  </div>
</template>
