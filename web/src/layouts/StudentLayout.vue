<template>
  <div class="student-app">
    <!-- 顶部导航条 -->
    <header class="top-bar">
      <div class="top-brand">安文AI</div>
      <div class="top-user">
        <span class="top-greeting">{{ auth.user?.realName || '同学' }}</span>
        <span class="logout-btn" @click="logout"><el-icon><SwitchButton /></el-icon> 退出</span>
      </div>
    </header>

    <!-- 标签导航 -->
    <nav class="tag-nav">
      <span class="tag" :class="{active:$route.path==='/student/dashboard'}" @click="$router.push('/student/dashboard')">🏠 首页</span>
      <span class="tag" :class="{active:$route.path==='/student/schedule'}" @click="$router.push('/student/schedule')">📅 课表</span>
      <span class="tag" :class="{active:$route.path==='/student/scores'}" @click="$router.push('/student/scores')">🏆 成绩</span>
    </nav>

    <!-- 内容区 -->
    <main class="main-view">
      <router-view />
    </main>

    <!-- 背景动画 -->
    <div class="bg-anim">
      <div class="bubble b1"></div><div class="bubble b2"></div><div class="bubble b3"></div>
      <div class="bubble b4"></div><div class="bubble b5"></div><div class="bubble b6"></div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'; import { useRoute, useRouter } from 'vue-router'; import { useAuthStore } from '@/store/auth'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore()
const zh2en = { '语文':'chinese','数学':'math','英语':'english','物理':'physics','化学':'chemistry','生物':'biology','历史':'history','政治':'politics','地理':'geography' }
const icons = { '语文':'📝','数学':'📐','英语':'📖','物理':'⚛️','化学':'🧪','生物':'🧬','历史':'📜','政治':'⚖️','地理':'🌍' }
const enrolled = computed(() => auth.user?.enrolledSubjects || auth.user?.subjects || [])
const subjects = computed(() => enrolled.value.filter(s => zh2en[s]).map(s => ({ value: zh2en[s], label: s, icon: icons[s] || '📚' })))
function logout() { auth.logout(); router.push('/login') }
</script>
<style>
/* 全局 — 移动优先 */
.student-app {
  min-height: 100vh; background: linear-gradient(160deg, #F0F4FF 0%, #FCE4EC 30%, #FFF8E1 60%, #E8F5E9 100%);
  background-attachment: fixed; position: relative; overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
/* 顶部栏 */
.top-bar {
  position: sticky; top: 0; z-index: 100;
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px;
  background: rgba(255,255,255,.75); backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0,0,0,.05);
}
.top-brand { font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #6366F1, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.top-greeting { font-size: 14px; color: #666; margin-right: 4px; }
.logout-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 16px; font-size: 12px; color: #EF4444; cursor: pointer; background: rgba(239,68,68,.08); transition: all .2s; font-weight: 500; }
.logout-btn:hover { background: rgba(239,68,68,.18); }
/* 标签导航 — 横向滚动 */
.tag-nav {
  display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; white-space: nowrap;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.tag-nav::-webkit-scrollbar { display: none; }
.tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;
  background: rgba(255,255,255,.7); color: #555; cursor: pointer; transition: all .2s;
  white-space: nowrap; flex-shrink: 0; border: 1px solid rgba(0,0,0,.06);
  backdrop-filter: blur(8px);
}
.tag:hover { background: #fff; transform: translateY(-1px); }
.tag.active { background: #fff; color: var(--color-primary); font-weight: 700; box-shadow: 0 2px 12px rgba(99,102,241,.15); border-color: var(--color-primary-light); }
/* 内容区 */
.main-view { position: relative; z-index: 1; padding: 0 8px 40px; }
/* 背景气泡动画 */
.bg-anim { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.bubble { position: absolute; border-radius: 50%; opacity: .12; animation: float 12s infinite ease-in-out; }
.b1 { width: 200px; height: 200px; background: #6366F1; top: 10%; left: -5%; animation-delay: 0s; }
.b2 { width: 160px; height: 160px; background: #EC4899; top: 50%; right: -8%; animation-delay: -3s; }
.b3 { width: 120px; height: 120px; background: #10B981; bottom: 20%; left: 20%; animation-delay: -6s; }
.b4 { width: 100px; height: 100px; background: #F59E0B; top: 30%; left: 60%; animation-delay: -9s; }
.b5 { width: 140px; height: 140px; background: #8B5CF6; bottom: 10%; right: 20%; animation-delay: -2s; }
.b6 { width: 80px; height: 80px; background: #EF4444; top: 70%; left: 40%; animation-delay: -7s; }
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-30px) scale(1.05); }
  50% { transform: translateY(-60px) scale(.95); }
  75% { transform: translateY(-20px) scale(1.02); }
}
/* 移动端适配 */
@media (max-width: 768px) {
  .top-bar { padding: 8px 12px; }
  .top-brand { font-size: 18px; }
  .tag-nav { padding: 8px 10px; gap: 6px; }
  .tag { padding: 6px 12px; font-size: 13px; }
}

/* 覆盖 Element Plus 默认尺寸（移动端） */
@media (max-width: 768px) {
  .el-card { border-radius: 16px !important; }
  .el-button--large { font-size: 14px; padding: 10px 20px; }
}
</style>
