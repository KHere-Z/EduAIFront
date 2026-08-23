<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
    title="编辑头像"
    width="360px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="reset"
  >
    <div class="ac-body">
      <div class="ac-canvas-wrap">
        <canvas
          ref="canvasRef"
          class="ac-canvas"
          @mousedown="onDown"
          @mousemove="onMove"
          @mouseup="onUp"
          @mouseleave="onUp"
        />
        <div v-if="!img" class="ac-placeholder">
          <div class="ac-ph-icon">🖼️</div>
          <div>选择一张图片开始编辑</div>
        </div>
      </div>

      <div v-if="img" class="ac-tools">
        <span class="ac-label">缩放</span>
        <el-slider v-model="scale" :min="minScale" :max="maxScale" :step="0.01" class="ac-slider" @input="draw" />
      </div>

      <div class="ac-actions">
        <el-button size="small" @click="pick">📁 选择图片</el-button>
        <el-button size="small" type="primary" :disabled="!img" @click="confirm">✓ 确定</el-button>
      </div>

      <input ref="fileRef" type="file" accept="image/*" style="display:none" @change="onFile" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const CANVAS = 300   // 预览画布边长（CSS px）
const OUTPUT = 512   // 导出头像边长（px）

const canvasRef = ref(null)
const fileRef = ref(null)
const img = ref(null)          // HTMLImageElement
const scale = ref(1)
const minScale = ref(1)
const maxScale = ref(3)
const offsetX = ref(0)
const offsetY = ref(0)

function pick() { fileRef.value?.click() }

function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  const im = new Image()
  im.onload = () => {
    img.value = im
    fit()
    draw()
    URL.revokeObjectURL(url)
  }
  im.onerror = () => URL.revokeObjectURL(url)
  im.src = url
  e.target.value = ''   // 允许重复选择同一张图
}

// 以「cover」方式适配：较短边铺满画布，保证圆形裁切区被完全覆盖
function fit() {
  const im = img.value
  if (!im) return
  minScale.value = Math.max(CANVAS / im.naturalWidth, CANVAS / im.naturalHeight)
  maxScale.value = Math.min(minScale.value * 4, 8)
  scale.value = minScale.value
  offsetX.value = 0
  offsetY.value = 0
}

function drawW() { return img.value ? img.value.naturalWidth * scale.value : 0 }
function drawH() { return img.value ? img.value.naturalHeight * scale.value : 0 }
function maxOffX() { return Math.max(0, (drawW() - CANVAS) / 2) }
function maxOffY() { return Math.max(0, (drawH() - CANVAS) / 2) }

function draw() {
  const c = canvasRef.value
  if (!c || !img.value) return
  c.width = CANVAS
  c.height = CANVAS
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, CANVAS, CANVAS)
  ctx.save()
  // 圆形遮罩（预览效果），实际导出为正方形，圆角由展示层 CSS 处理
  ctx.beginPath()
  ctx.arc(CANVAS / 2, CANVAS / 2, CANVAS / 2, 0, Math.PI * 2)
  ctx.clip()
  const x = (CANVAS - drawW()) / 2 + offsetX.value
  const y = (CANVAS - drawH()) / 2 + offsetY.value
  ctx.drawImage(img.value, x, y, drawW(), drawH())
  ctx.restore()
}

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }

let dragging = false
let startX = 0, startY = 0, startOffX = 0, startOffY = 0
function onDown(e) {
  if (!img.value) return
  dragging = true
  startX = e.clientX
  startY = e.clientY
  startOffX = offsetX.value
  startOffY = offsetY.value
}
function onMove(e) {
  if (!dragging || !img.value) return
  offsetX.value = clamp(startOffX + (e.clientX - startX), -maxOffX(), maxOffX())
  offsetY.value = clamp(startOffY + (e.clientY - startY), -maxOffY(), maxOffY())
  draw()
}
function onUp() { dragging = false }

// 将画布可视区域（圆形）裁切成 OUTPUT×OUTPUT 正方形，直接读原图保证高清
function crop() {
  const im = img.value
  const out = document.createElement('canvas')
  out.width = OUTPUT
  out.height = OUTPUT
  const ctx = out.getContext('2d')
  const x = (CANVAS - drawW()) / 2 + offsetX.value
  const y = (CANVAS - drawH()) / 2 + offsetY.value
  const sx = -x / scale.value
  const sy = -y / scale.value
  const sw = CANVAS / scale.value
  const sh = CANVAS / scale.value
  ctx.drawImage(im, sx, sy, sw, sh, 0, 0, OUTPUT, OUTPUT)
  return out
}

function confirm() {
  if (!img.value) return
  const out = crop()
  out.toBlob(blob => {
    if (blob) emit('saved', blob)
  }, 'image/png')
}

function reset() {
  img.value = null
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}
</script>

<style scoped>
.ac-body { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.ac-canvas-wrap {
  position: relative; width: 300px; height: 300px;
  border-radius: 50%; overflow: hidden;
  background: #1e293b; cursor: grab;
}
.ac-canvas { width: 300px; height: 300px; display: block; }
.ac-canvas-wrap:active { cursor: grabbing; }
.ac-placeholder {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  color: #64748b; font-size: 13px; pointer-events: none;
}
.ac-ph-icon { font-size: 34px; }
.ac-tools { display: flex; align-items: center; gap: 10px; width: 100%; }
.ac-label { font-size: 13px; color: #64748b; flex-shrink: 0; }
.ac-slider { flex: 1; }
.ac-actions { display: flex; gap: 10px; justify-content: center; }
</style>
