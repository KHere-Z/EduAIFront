<template>
  <div class="home-page">
    <header class="hero">
      <h1>📖 阅读云英语</h1>
      <p>AI 驱动的智能英语学习平台 — 让每个学生都能高效学习</p>
      <el-button type="primary" size="large" @click="$router.push('/login')">立即登录</el-button>
    </header>
  </div>
</template>

<style scoped>
.home-page { min-height: 100vh; }
.hero {
  text-align: center; padding: 120px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}
.hero h1 { font-size: 48px; margin-bottom: 16px; }
.hero p { font-size: 20px; margin-bottom: 32px; opacity: 0.9; }
</style>
