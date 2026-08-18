<template>
  <div class="home-page">
    <!-- 动态粒子背景 -->
    <canvas ref="bgCanvas" class="bg-canvas" />

    <!-- 主内容 -->
    <div class="hero">
      <div class="hero-glow" />
      <div class="hero-ring" />

      <div class="hero-content">
        <div class="hc-badge">
          <span class="badge-dot" />
          AI · 9 学科 · 全阶段覆盖
        </div>

        <h1 class="hc-title">
          <span class="hc-brand">智学</span>
          <span class="hc-ai">AI 教育</span>
        </h1>

        <p class="hc-desc">
          智能错题分析 · 举一反三训练 · 个性化学习路径
          <br/>让每一位学生都拥有 AI 导师
        </p>

        <div class="hc-actions">
          <button class="btn-primary" @click="$router.push('/login')">
            <span>立即开始</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div class="hc-stats">
          <div class="stat" v-for="s in stats" :key="s.n">
            <span class="stat-num">{{ s.n }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- 底部学科图标 -->
      <div class="subjects-bar">
        <span v-for="s in subjects" :key="s" class="sb-item">{{ s }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const bgCanvas = ref(null)
let animId = null

const stats = [
  { n: '9', label: '学科' },
  { n: '5000+', label: '用户' },
  { n: '10万+', label: '题库' },
]
const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '政治', '地理']

function initBg() {
  const c = bgCanvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  const setSize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
  setSize()
  window.addEventListener('resize', setSize)

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
    r: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.5 + 0.2,
  }))

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height)
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0 || p.x > c.width) p.vx *= -1
      if (p.y < 0 || p.y > c.height) p.vy *= -1
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(99,102,241,${p.alpha})`; ctx.fill()

      // 连线
      for (let j = i + 1; j < particles.length; j++) {
        const dx = p.x - particles[j].x, dy = p.y - particles[j].y
        if (dx * dx + dy * dy < 15000) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(99,102,241,${0.06})`; ctx.lineWidth = 1; ctx.stroke()
        }
      }
    })
    animId = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(initBg)
onBeforeUnmount(() => cancelAnimationFrame(animId))
</script>

<style scoped>
.home-page { min-height: 100vh; background: #0A0A1A; position: relative; overflow: hidden; color: #fff; }
.bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

/* Hero */
.hero {
  position: relative; z-index: 1; min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px;
}
.hero-glow {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%);
  pointer-events: none;
}
.hero-ring {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 500px; height: 500px; border-radius: 50%;
  border: 1px solid rgba(99,102,241,.08);
  animation: spin 30s linear infinite; pointer-events: none;
}
@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }

.hero-content { position: relative; z-index: 2; text-align: center; max-width: 600px; }

/* Badge */
.hc-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 20px; border-radius: 20px;
  border: 1px solid rgba(99,102,241,.25);
  background: rgba(99,102,241,.08);
  font-size: 13px; color: #A5B4FC;
  margin-bottom: 32px; backdrop-filter: blur(10px);
}
.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #818CF8; animation: pulse 2s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Title */
.hc-title { font-size: 64px; font-weight: 800; letter-spacing: 6px; margin-bottom: 20px; line-height: 1.2; }
.hc-brand {
  background: linear-gradient(135deg, #fff 0%, #E0E7FF 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hc-ai {
  display: block; font-size: 48px;
  background: linear-gradient(135deg, #6366F1, #A78BFA, #C084FC);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  animation: shimmer 3s ease infinite; background-size: 200% 200%;
}
@keyframes shimmer { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

.hc-desc { font-size: 16px; color: #94A3B8; line-height: 1.8; margin-bottom: 40px; }

/* Buttons */
.hc-actions { display: flex; gap: 14px; justify-content: center; margin-bottom: 56px; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 32px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: #fff; font-size: 16px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all .3s;
  box-shadow: 0 4px 24px rgba(99,102,241,.4);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(99,102,241,.5); }
/* Stats */
.hc-stats { display: flex; gap: 56px; justify-content: center; }
.stat-num { display: block; font-size: 32px; font-weight: 700;
  background: linear-gradient(135deg, #A78BFA, #6366F1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.stat-label { font-size: 13px; color: #64748B; }

/* Subjects bar */
.subjects-bar {
  position: absolute; bottom: 32px;
  display: flex; gap: 0; flex-wrap: wrap; justify-content: center;
  opacity: .2; font-size: 11px; letter-spacing: 2px;
}
.sb-item { padding: 0 16px; transition: all .3s; cursor: default; }
.sb-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,.15); }
.sb-item:hover { opacity: 1; color: #818CF8; }
</style>
