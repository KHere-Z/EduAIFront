<template>
  <canvas ref="c" class="bg-theme-canvas" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

// 背景主题 canvas 动画：
// - flower 花朵绽放后淡出（蓝白色调）
// - leaf   树叶飘落（绿白色调）
const props = defineProps({ theme: { type: String, default: 'flower' } })

const c = ref(null)
let raf = null
let items = []

const FLOWER_PETALS = [
  'rgba(255,255,255,.95)',
  'rgba(191,219,254,.92)',
  'rgba(147,197,253,.88)',
  'rgba(219,234,254,.92)',
]

function resize() {
  const cv = c.value
  if (!cv) return
  cv.width = window.innerWidth
  cv.height = window.innerHeight
}

function spawnFlower(now) {
  const cv = c.value
  items.push({
    type: 'flower',
    x: Math.random() * cv.width,
    y: Math.random() * cv.height * 0.92,
    r: 14 + Math.random() * 26,
    petals: 5 + Math.floor(Math.random() * 3),
    rot: Math.random() * Math.PI * 2,
    born: now,
    life: 3500 + Math.random() * 2600,
    petalColor: FLOWER_PETALS[Math.floor(Math.random() * FLOWER_PETALS.length)],
  })
}

function drawFlower(ctx, f, now) {
  const t = (now - f.born) / f.life
  const scale = Math.min(1, t * 3)           // 快速绽放
  const alpha = t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.45) // 后段淡出
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(f.rot)
  ctx.scale(scale, scale)
  ctx.globalAlpha = alpha * 0.85
  for (let i = 0; i < f.petals; i++) {
    const a = (Math.PI * 2 * i) / f.petals
    ctx.save()
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(f.r * 0.5, 0, f.r * 0.5, f.r * 0.26, 0, 0, Math.PI * 2)
    ctx.fillStyle = f.petalColor
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, f.r * 0.26, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(253,224,71,.7)'
  ctx.fill()
  ctx.restore()
}

function spawnLeaf() {
  const cv = c.value
  const hue = 120 + Math.floor(Math.random() * 40) // 偏冷的绿 120~160
  items.push({
    type: 'leaf',
    x: Math.random() * cv.width,
    y: -40,
    vy: 0.5 + Math.random() * 0.9,           // 缓慢轻柔地飘落
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.008 + Math.random() * 0.014,
    swayAmp: 18 + Math.random() * 26,        // 摆动幅度更小
    size: 10 + Math.random() * 12,           // 叶长
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.025, // 旋转更慢
    hue,
    light: 55 + Math.random() * 20,          // 稍实一点，仍偏白绿
    alpha: 0.45 + Math.random() * 0.25,      // 半透明
  })
}

function drawLeaf(ctx, l) {
  l.y += l.vy
  l.sway += l.swaySpeed
  l.rot += l.rotSpeed
  const x = l.x + Math.sin(l.sway) * l.swayAmp
  const len = l.size
  const w = len * 0.5
  ctx.save()
  ctx.translate(x, l.y)
  ctx.rotate(l.rot)
  ctx.globalAlpha = l.alpha
  // 柔光 / 毛玻璃般的朦胧感
  ctx.shadowColor = `hsla(${l.hue}, 55%, 68%, 0.6)`
  ctx.shadowBlur = 10
  // 叶身（贝塞尔曲线，叶尖朝上）
  ctx.beginPath()
  ctx.moveTo(0, -len)
  ctx.bezierCurveTo(w, -len * 0.15, w * 0.9, len * 0.45, 0, len)
  ctx.bezierCurveTo(-w * 0.9, len * 0.45, -w, -len * 0.15, 0, -len)
  ctx.closePath()
  ctx.fillStyle = `hsla(${l.hue}, 52%, ${l.light}%, 0.62)`
  ctx.fill()
  // 去掉生硬描边，只留一条淡白主脉
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255,255,255,.42)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, -len * 0.8)
  ctx.lineTo(0, len * 0.8)
  ctx.stroke()
  ctx.restore()
}

function tick(now) {
  const cv = c.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  ctx.clearRect(0, 0, cv.width, cv.height)

  if (props.theme === 'flower') {
    if (Math.random() < 0.1 && items.length < 96) spawnFlower(now)
    items = items.filter(it => now - it.born < it.life)
    items.forEach(it => drawFlower(ctx, it, now))
  } else if (props.theme === 'leaf') {
    if (Math.random() < 0.03 && items.length < 24) spawnLeaf()
    items = items.filter(it => it.y < cv.height + 100)
    items.forEach(it => drawLeaf(ctx, it))
  }

  raf = requestAnimationFrame(tick)
}

watch(() => props.theme, () => { items = [] })

function onVisibility() {
  // 页面隐藏/最小化时暂停动画，避免 GPU 空转并在最小化瞬间触发闪烁
  if (document.hidden) {
    cancelAnimationFrame(raf)
    raf = null
  } else if (!raf) {
    raf = requestAnimationFrame(tick)
  }
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', onVisibility)
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.bg-theme-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
