<template>
  <transition name="trial-banner">
    <div v-if="visible" class="trial-banner" @click="goRecharge">
      <span class="tb-icon">🎉</span>
      <span class="tb-text">
        恭喜获得 <b>体验会员</b>，有效期还剩 <b>{{ daysLeft }}</b> 天
      </span>
      <span class="tb-close" @click.stop="dismiss">✕</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useMembershipStore } from '@/store/membership'

const router = useRouter()
const memberStore = useMembershipStore()
const visible = ref(false)
const dismissed = ref(false)
let hideTimer = null

// 体验会员（trial）判定：后端 MembershipVO.plan 返回中文展示名「体验会员」
const isTrial = computed(() => memberStore.active && memberStore.plan === '体验会员')

const daysLeft = computed(() => {
  const exp = memberStore.expiresAt
  if (!exp) return 0
  const t = new Date(String(exp).replace(' ', 'T')).getTime()
  if (!Number.isFinite(t)) return 0
  const ms = t - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / 86400000)
})

function show() {
  if (dismissed.value || daysLeft.value <= 0) return
  visible.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { visible.value = false }, 4500)
}

function dismiss() {
  dismissed.value = true
  visible.value = false
  clearTimeout(hideTimer)
}

function goRecharge() {
  dismiss()
  const prefix = router.currentRoute.value.path.startsWith('/teacher') ? '/teacher' : '/student'
  router.push(prefix + '/recharge')
}

// 会员数据由布局挂载时异步刷新，用 watcher 等数据到位后再弹出
watch(isTrial, (v) => { if (v) show() }, { immediate: true })
onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<style scoped>
.trial-banner {
  position: fixed;
  top: 84px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 1px solid #FDE68A;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(180, 83, 9, .18);
  font-size: 14px;
  color: #92400E;
  max-width: 92%;
  cursor: pointer;
  user-select: none;
}
.tb-icon { font-size: 20px; flex-shrink: 0; }
.tb-text b { color: #B45309; }
.tb-close { margin-left: 4px; font-size: 14px; color: #D97706; cursor: pointer; padding: 0 2px; flex-shrink: 0; }
.tb-close:hover { color: #92400E; }

/* 渐隐出场：淡入上滑 → 停留 → 淡出上移 */
.trial-banner-enter-active { transition: all .5s cubic-bezier(.22,1,.36,1); }
.trial-banner-leave-active { transition: all .9s ease; }
.trial-banner-enter-from, .trial-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-18px);
}
</style>
