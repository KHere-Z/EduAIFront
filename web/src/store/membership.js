import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/request'

/**
 * 会员状态全局 store
 * 顶栏/侧边栏的「会员」标识与充值页、题库门控共用同一份会员状态。
 * 注册送 7 天会员后 refresh() 即可让标识同步点亮。
 */
export const useMembershipStore = defineStore('membership', () => {
  const active = ref(false)
  const plan = ref('')
  const expiresAt = ref('')

  async function refresh() {
    try {
      const r = await http.get('/user/membership')
      const m = r?.data ?? r ?? {}
      active.value = !!m.active
      plan.value = m.plan || ''
      expiresAt.value = m.expiresAt || ''
    } catch {
      active.value = false
    }
  }

  return { active, plan, expiresAt, refresh }
})
