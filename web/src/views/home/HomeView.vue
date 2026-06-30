<template>
  <div class="home-page">
    <header class="hero">
      <div class="hero-content">
        <div class="hero-badge">9大学科全覆盖</div>
        <h1>安文<span class="text-primary">AI教育</span></h1>
        <p>AI 驱动的全学科智能学习平台<br/>错题分析 · 举一反三 · 个性化学习路径</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="$router.push('/login')">立即开始</el-button>
          <el-button size="large" round class="btn-outline" @click="$router.push('/register')">注册账号</el-button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><strong>9</strong><span>学科</span></div>
          <div class="hero-stat"><strong>5000+</strong><span>用户</span></div>
          <div class="hero-stat"><strong>10万+</strong><span>题库</span></div>
        </div>
      </div>
    </header>
  </div>
</template>

<style scoped>
.home-page { min-height: 100vh; background: var(--color-bg); }
.hero {
  text-align: center; padding: 120px 20px 80px;
  background: linear-gradient(160deg, #1E1B4B 0%, #312E81 30%, #4338CA 70%, #6366F1 100%);
  color: #fff; position: relative; overflow: hidden;
}
.hero::before {
  content: ''; position: absolute;
  top: -20%; right: -10%; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(129,140,248,.2), transparent 70%);
  border-radius: 50%;
}
.hero-content { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.hero-badge {
  display: inline-block; padding: 4px 16px; border-radius: 20px;
  background: rgba(255,255,255,.15); font-size: 13px; margin-bottom: 20px;
  backdrop-filter: blur(10px);
}
.hero h1 { font-size: 56px; font-weight: 800; letter-spacing: 4px; margin-bottom: 16px; }
.text-primary { color: #A5B4FC; }
.hero p { font-size: 17px; opacity: .85; line-height: 1.8; margin-bottom: 32px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 48px; }
.btn-outline { border: 1px solid rgba(255,255,255,.4) !important; color: #fff !important; background: transparent !important; }
.btn-outline:hover { border-color: #fff !important; }
.hero-stats { display: flex; gap: 48px; justify-content: center; }
.hero-stat strong { display: block; font-size: 28px; font-weight: 700; }
.hero-stat span { font-size: 13px; opacity: .7; }
</style>
