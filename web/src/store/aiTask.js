import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============================================================
// AI 分析任务全局 store
// 目的：让「试卷分析 / 错题分析」的进度状态脱离页面组件，
// 切出分析页后任务照常跑，进度由悬浮窗（AiProgressWidget）展示。
// ============================================================

let seq = 0
const nextId = () => 'task_' + (++seq) + '_' + Math.random().toString(36).slice(2, 6)

export const useAiTaskStore = defineStore('aiTask', () => {
  // 任务列表（按创建顺序追加；完成任务 4s 后自动移除）
  const tasks = ref([])

  // 最近一个「进行中」任务，其次回退到最近一个未移除的任务（完成/失败态仍可短暂展示）
  const activeTask = computed(() => {
    const running = tasks.value.filter(t => t.status === 'running')
    if (running.length) return running[running.length - 1]
    return tasks.value[tasks.value.length - 1] || null
  })

  const hasRunning = computed(() => tasks.value.some(t => t.status === 'running'))

  /**
   * 创建一个任务，返回 taskId
   * @param {Object} opt { title, type, route }
   */
  function start(opt = {}) {
    const task = {
      id: nextId(),
      title: opt.title || 'AI 分析',
      type: opt.type || 'generic',
      route: opt.route || '',
      status: 'running',       // running | done | error
      progress: 0,
      stageText: '准备中…',
      result: null,            // 页面自定义的结果对象（用于切回后恢复）
    }
    tasks.value.push(task)
    return task.id
  }

  /**
   * 更新进度
   * @param {String} id
   * @param {Object} patch { progress, stageText, result }
   */
  function update(id, patch = {}) {
    const t = tasks.value.find(t => t.id === id)
    if (!t) return
    if (patch.progress != null) t.progress = Math.max(0, Math.min(100, Math.round(patch.progress)))
    if (patch.stageText != null) t.stageText = patch.stageText
    if (patch.result != null) t.result = patch.result
  }

  function finish(id, patch = {}) {
    const t = tasks.value.find(t => t.id === id)
    if (!t) return
    t.status = 'done'
    t.progress = 100
    t.stageText = patch.stageText || '完成'
    if (patch.result != null) t.result = patch.result
    setTimeout(() => remove(id), 15000)
  }

  function fail(id, err) {
    const t = tasks.value.find(t => t.id === id)
    if (!t) return
    t.status = 'error'
    t.stageText = err || '分析失败'
    setTimeout(() => remove(id), 8000)
  }

  function remove(id) {
    const i = tasks.value.findIndex(t => t.id === id)
    if (i >= 0) tasks.value.splice(i, 1)
  }

  /** 取某路由下最近的任务（用于页面挂载时恢复） */
  function taskForRoute(route) {
    const list = tasks.value.filter(t => t.route === route)
    return list[list.length - 1] || null
  }

  return { tasks, activeTask, hasRunning, start, update, finish, fail, remove, taskForRoute }
})
