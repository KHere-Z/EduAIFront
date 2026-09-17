<template>
  <div class="sv-root" :class="{ 'sv-ok': ok }">
    <div ref="trackRef" class="sv-track">
      <div class="sv-fill" :style="{ width: fill + 'px' }"></div>
      <div class="sv-label">{{ ok ? '✓ 验证通过' : '按住滑块，拖动到最右侧' }}</div>
      <div
        ref="handleRef"
        class="sv-handle"
        :style="{ transform: `translateX(${x}px)` }"
        @mousedown.prevent="start"
        @touchstart.prevent="start"
      >
        <span class="sv-arrow">{{ ok ? '✓' : '»' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['success'])

const trackRef = ref(null)
const handleRef = ref(null)
const x = ref(0)
const fill = ref(0)
const ok = ref(false)
let maxX = 0
let dragging = false
let startPointer = 0
let startHandle = 0

function computeMax() {
  if (!trackRef.value || !handleRef.value) return
  maxX = trackRef.value.clientWidth - handleRef.value.clientWidth
  if (maxX < 0) maxX = 0
}

function start(e) {
  if (ok.value) return
  dragging = true
  startPointer = e.touches ? e.touches[0].clientX : e.clientX
  startHandle = x.value
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', end)
  document.addEventListener('touchmove', move)
  document.addEventListener('touchend', end)
}

function move(e) {
  if (!dragging) return
  const cx = e.touches ? e.touches[0].clientX : e.clientX
  let nx = startHandle + (cx - startPointer)
  nx = Math.max(0, Math.min(maxX, nx))
  x.value = nx
  fill.value = nx
}

function end() {
  if (!dragging) return
  dragging = false
  document.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', end)
  document.removeEventListener('touchmove', move)
  document.removeEventListener('touchend', end)
  if (x.value >= maxX - 2) {
    ok.value = true
    x.value = maxX
    fill.value = maxX
    emit('success')
  } else {
    x.value = 0
    fill.value = 0
  }
}

function reset() {
  ok.value = false
  x.value = 0
  fill.value = 0
}

defineExpose({ reset })

onMounted(() => {
  computeMax()
  window.addEventListener('resize', computeMax)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', computeMax)
  document.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', end)
  document.removeEventListener('touchmove', move)
  document.removeEventListener('touchend', end)
})
</script>

<style scoped>
.sv-root { width: 100%; }
.sv-track {
  position: relative;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .1);
  overflow: hidden;
  user-select: none;
}
.sv-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: rgba(99, 102, 241, .25);
  border-radius: 10px 0 0 10px;
  transition: width .1s linear;
}
.sv-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #64748B;
  pointer-events: none;
}
.sv-ok .sv-label { color: #A5B4FC; }
.sv-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .3);
  z-index: 1;
}
.sv-handle:active { cursor: grabbing; }
.sv-arrow { color: #6366F1; font-size: 18px; font-weight: 700; }
.sv-ok .sv-handle { background: #10B981; }
.sv-ok .sv-arrow { color: #fff; }
</style>
