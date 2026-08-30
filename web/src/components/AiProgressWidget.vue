<template>
  <!-- 悬浮进度窗：切出分析页后出现，可拖动，点击回到分析页 -->
  <div
    v-if="visible"
    class="apw"
    :class="'apw--' + task.status"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @pointerdown="onPointerDown"
  >
    <div class="apw-head">
      <span class="apw-title">{{ task.title }}</span>
      <div class="apw-meta">
        <span class="apw-status">
          <template v-if="task.status === 'done'">✓</template>
          <template v-else-if="task.status === 'error'">✗</template>
          <template v-else>{{ task.progress }}%</template>
        </span>
        <button class="apw-close" title="关闭" @pointerdown.stop @click.stop="close">×</button>
      </div>
    </div>
    <div class="apw-bar">
      <div class="apw-fill" :class="'apw-fill--' + task.status" :style="{ width: task.progress + '%' }"></div>
    </div>
    <div class="apw-stage">
      <template v-if="task.status === 'error'">分析失败，点击返回查看</template>
      <template v-else-if="task.status === 'done'">分析完成，点击返回查看</template>
      <template v-else>{{ task.stageText }} · 后台进行中</template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAiTaskStore } from '@/store/aiTask'

const route = useRoute()
const router = useRouter()
const store = useAiTaskStore()

// 有任务且当前不在此任务的路由上时才显示（在分析页时由页面内嵌进度条展示）
const task = computed(() => store.activeTask)
const visible = computed(() => {
  const t = task.value
  if (!t) return false
  return t.route !== route.fullPath
})

// 默认出现在右下角
const pos = reactive({
  x: typeof window !== 'undefined' ? window.innerWidth - 292 : 60,
  y: typeof window !== 'undefined' ? window.innerHeight - 150 : 60,
})

let drag = null
const moved = ref(false)

function onPointerDown(e) {
  drag = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
  moved.value = false
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  e.preventDefault()
}
function onPointerMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.startX
  const dy = e.clientY - drag.startY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.value = true
  pos.x = Math.max(0, Math.min(window.innerWidth - 100, drag.origX + dx))
  pos.y = Math.max(0, Math.min(window.innerHeight - 90, drag.origY + dy))
}
function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  const wasDragging = moved.value
  drag = null
  // 未发生拖动 → 视为点击，回到分析页
  if (!wasDragging && task.value?.route) router.push(task.value.route)
}

function close() {
  if (task.value?.id) store.remove(task.value.id)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.apw {
  position: fixed;
  z-index: 3000;
  width: 260px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 8px 30px rgba(0, 0, 0, .16);
  border: 1px solid var(--color-border, #e5e7eb);
  cursor: pointer;
  user-select: none;
  backdrop-filter: blur(10px);
}
.apw--done { border-color: #10B981; }
.apw--error { border-color: #EF4444; }

.apw-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.apw-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  display: flex;
  align-items: center;
  gap: 6px;
}
.apw-title::before { content: '⚙️'; font-size: 13px; }
.apw--done .apw-title::before { content: '✅'; }
.apw--error .apw-title::before { content: '⚠️'; }
.apw-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.apw-status {
  font-size: 12px;
  font-weight: 700;
  color: #6366F1;
  flex-shrink: 0;
}
.apw--done .apw-status { color: #10B981; }
.apw--error .apw-status { color: #EF4444; }
.apw-close {
  border: none;
  background: transparent;
  color: var(--text-muted, #6b7280);
  font-size: 17px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color .15s;
}
.apw-close:hover { color: #EF4444; }

.apw-bar {
  height: 6px;
  border-radius: 3px;
  background: #eef0f6;
  overflow: hidden;
  margin-bottom: 8px;
}
.apw-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #6366F1, #8B5CF6);
  transition: width .4s ease;
}
.apw-fill--done { background: #10B981; }
.apw-fill--error { background: #EF4444; }

.apw-stage {
  font-size: 11px;
  color: var(--text-muted, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
