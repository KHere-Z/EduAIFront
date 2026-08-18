import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '@/api/request'

/**
 * 智学点全局 store
 * 布局（顶栏/侧边栏）与分析页共用同一份响应式余额，
 * 扣点后调用 refresh() 即可让所有位置同步更新。
 */
export const usePointsStore = defineStore('points', () => {
  const points = ref(0)

  async function refresh() {
    try {
      const r = await http.get('/user/points')
      points.value = r?.points ?? r?.data?.points ?? 0
    } catch {}
  }

  return { points, refresh }
})
