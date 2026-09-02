<template>
  <div class="login-page">
    <canvas ref="bgCanvas" class="bg-canvas" />

    <div class="brand-side">
      <div class="brand-glow" />
      <div class="brand-inner">
        <div class="bi-logo">
          <div class="bi-mark">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 15l3-6 2 4 3-5"/></svg>
          </div>
          智学
        </div>
        <div class="bi-sub">AI 教育</div>
        <p class="bi-desc">AI 驱动的全学科智能学习平台</p>
        <div class="bi-features">
          <div v-for="(f,i) in features" :key="i" class="bif-item" :style="{ animationDelay: i * 0.15 + 's' }">
            <span class="bif-icon" v-html="f.icon" /><span>{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-side">
      <div class="ls-card">
        <h3>欢迎回来</h3>
        <p class="ls-sub">选择登录方式</p>

        <!-- 登录方式切换 -->
        <div class="login-tabs">
          <button :class="['lt-btn',{active:loginMode==='password'}]" @click="loginMode='password'">账号密码</button>
          <button :class="['lt-btn',{active:loginMode==='sms'}]" @click="loginMode='sms'">手机验证码</button>
        </div>

        <!-- ═══ 账号密码登录 ═══ -->
        <div v-if="loginMode === 'password'" style="min-height:270px">
          <div class="role-switch">
            <button v-for="r in roles" :key="r.value" :class="['rs-btn', { active: role === r.value }]" @click="role = r.value">
              <span class="rs-icon" v-html="r.icon" /><span>{{ r.label }}</span>
            </button>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handlePwdLogin" autocomplete="off">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名" size="large" class="login-input" autocomplete="off">
                <template #prefix><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="form.password" placeholder="密码" type="password" size="large" show-password class="login-input" autocomplete="new-password">
                <template #prefix><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg></template>
              </el-input>
            </el-form-item>
            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="spinner"/><span>登 录</span>
            </button>
          </el-form>
        </div>

        <!-- ═══ 手机验证码登录 ═══ -->
        <div v-if="loginMode === 'sms'" style="min-height:270px">
            <div class="role-switch">
              <button v-for="r in roles" :key="r.value" :class="['rs-btn', { active: smsRole === r.value }]" @click="smsRole = r.value">
                <span class="rs-icon" v-html="r.icon" /><span>{{ r.label }}</span>
              </button>
            </div>

            <el-form @submit.prevent="handleSmsLogin" autocomplete="off">
              <el-form-item>
                <div style="display:flex;gap:8px">
                  <el-input v-model="smsPhone" placeholder="手机号" size="large" class="login-input" maxlength="11" style="flex:1"/>
                  <el-button size="large" @click="sendCode" :disabled="!smsPhone||smsSending||smsCountdown>0" class="sms-btn">
                    {{ smsCountdown > 0 ? smsCountdown+'s' : smsSending ? '…' : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item>
                <el-input v-model="smsCode" placeholder="" size="large" class="login-input code-input" maxlength="6"/>
              </el-form-item>
              <button type="submit" class="submit-btn" :disabled="!smsPhone||smsCode.length<4||smsLoading">
                <span v-if="smsLoading" class="spinner"/><span>{{ smsLoading ? '验证中…' : '登录' }}</span>
              </button>
            </el-form>
        </div>

        <div class="ls-extra">
          <router-link to="/register" class="ls-register">还没有账号？立即注册</router-link>
        </div>
      </div>
      <p class="ls-copy">© 2026 智学AI教育</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { sendSmsCode, loginBySms } from '@/api/common/auth'

const router = useRouter()
const authStore = useAuthStore()

// 登录方式
const loginMode = ref('password')
const role = ref('teacher')
const loading = ref(false)
const formRef = ref(null)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 密码登录
async function handlePwdLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await authStore.login(form.username, form.password)
    ElMessage.success(`欢迎回来，${res.user?.realName || form.username}`)
    const rt = res.user?.roleType
    if (rt === 4 || rt === 'student') await authStore.enrichStudentSubjects()
    await navigateByRole(rt)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || e.message || '登录失败')
  } finally { loading.value = false }
}

// 短信登录
const smsRole = ref('teacher')
const smsPhone = ref('')
const smsCode = ref('')
const smsStep = ref(1) // 保留用于新用户注册步骤
const smsSending = ref(false)
const smsLoading = ref(false)
const smsCountdown = ref(0)
async function sendCode() {
  if (!/^1\d{10}$/.test(smsPhone.value)) { ElMessage.warning('请输入正确的手机号'); return }
  smsSending.value = true
  try {
    await sendSmsCode(smsPhone.value)
    smsCountdown.value = 60
    const t = setInterval(() => { smsCountdown.value--; if (smsCountdown.value <= 0) clearInterval(t) }, 1000)
    ElMessage.success('验证码已发送')
  } catch (e) { ElMessage.error(e.response?.data?.message || '发送失败') }
  smsSending.value = false
}

async function handleSmsLogin() {
  if (smsCode.value.length < 4) { ElMessage.warning('请输入完整验证码'); return }
  smsLoading.value = true
  try {
    const res = await loginBySms(smsPhone.value, smsCode.value, smsRole.value)
    authStore.setToken(res.token || res.data?.token)
    authStore.setUser(res.user || res.data?.user)
    ElMessage.success('登录成功')
    await navigateByRole(res.user?.roleType || smsRole.value)
  } catch (e) {
    const msg = e.response?.data?.message || e.message || ''
    if (msg.includes('角色') || e.response?.data?.code === 40009) {
      ElMessage.info('请选择角色后重试')
    } else { ElMessage.error(msg || '登录失败') }
  }
  smsLoading.value = false
}

async function navigateByRole(roleType) {
  const rt = String(roleType)
  let target = '/'
  if (rt === '4' || rt === 'student') target = '/student/dashboard'
  else if (rt === '3' || rt === 'teacher') target = '/teacher/dashboard'
  else if (rt === '1' || rt === 'admin') target = '/admin/dashboard'
  // 登录后不应能退回登录页，用 replace；导航失败兜底到首页，避免卡在登录页
  await router.replace(target).catch(() => router.replace('/'))
}

// 角色
const roles = [
  { label: '老师', value: 'teacher', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6M17 11h6"/></svg>` },
  { label: '学生', value: 'student', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 10v5M6 3l14 7-14 7"/><path d="M2 12v7"/></svg>` },
]

const features = [
  { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="9"/></svg>`, text: 'AI 错题分析与举一反三' },
  { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3v18h18"/><path d="M7 16l4-9 3 5 3-7"/></svg>`, text: '智能学情雷达图 & 趋势预测' },
  { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`, text: 'AI 实时辅导答疑' },
  { icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>`, text: '9 大学科全覆盖' },
]

// 粒子背景
const bgCanvas = ref(null)
let animId = null
onMounted(() => {
  form.username = ''; form.password = ''
  const c = bgCanvas.value; if (!c) return
  const ctx = c.getContext('2d')
  const setSize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
  setSize(); window.addEventListener('resize', setSize)
  const pts = Array.from({ length: 40 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    r: Math.random() * 1.2 + 0.4, a: Math.random() * 0.4 + 0.15,
  }))
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height)
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0 || p.x > c.width) p.vx *= -1
      if (p.y < 0 || p.y > c.height) p.vy *= -1
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(99,102,241,${p.a})`; ctx.fill()
    })
    animId = requestAnimationFrame(draw)
  }
  draw()
})
onBeforeUnmount(() => cancelAnimationFrame(animId))
</script>

<style scoped>
.login-page { display: flex; min-height: 100vh; background: #0A0A1A; position: relative; overflow: hidden; }
.bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

.brand-side { flex: 1; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; padding: 60px; }
.brand-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,.1) 0%, transparent 70%); pointer-events: none; }
.brand-inner { position: relative; z-index: 2; max-width: 380px; }
.bi-logo { display: flex; align-items: center; gap: 10px; font-size: 44px; font-weight: 800; letter-spacing: 6px; color: #fff; margin-bottom: 4px; }
.bi-mark { color: #818CF8; display: flex; align-items: center; }
.bi-sub { font-size: 16px; font-weight: 600; letter-spacing: 8px; color: #818CF8; margin-bottom: 20px; }
.bi-desc { color: #475569; font-size: 14px; margin-bottom: 40px; }
.bi-features { display: flex; flex-direction: column; gap: 14px; }
.bif-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #64748B; opacity: 0; animation: fadeInUp .5s ease forwards; }
@keyframes fadeInUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
.bif-icon { color: #6366F1; display: flex; align-items: center; flex-shrink: 0; }

.login-side { flex: 1; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; }
.ls-card { width: 100%; max-width: 400px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 20px; padding: 36px 36px 28px; backdrop-filter: blur(20px); }
.ls-card h3 { font-size: 26px; font-weight: 700; color: #F1F5F9; margin-bottom: 4px; }
.ls-sub { color: #475569; font-size: 14px; margin-bottom: 20px; }

.login-tabs { display: flex; gap: 0; margin-bottom: 20px; border-radius: 10px; background: rgba(255,255,255,.04); padding: 3px; }
.lt-btn { flex: 1; padding: 8px 12px; border: none; border-radius: 8px; background: transparent; color: #64748B; font-size: 13px; cursor: pointer; transition: all .2s; font-family: inherit; }
.lt-btn.active { background: rgba(99,102,241,.2); color: #A5B4FC; font-weight: 600; }

.role-switch { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; padding: 4px; border-radius: 10px; background: rgba(255,255,255,.04); margin-bottom: 20px; }
.rs-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border: none; border-radius: 8px; background: transparent; color: #475569; font-size: 12px; cursor: pointer; transition: all .2s; font-family: inherit; }
.rs-btn.active { background: rgba(99,102,241,.2); color: #A5B4FC; font-weight: 600; }
.rs-icon { color: inherit; display: flex; align-items: center; justify-content: center; }

.login-input :deep(.el-input__wrapper) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: none !important; border-radius: 10px !important; }
.login-input :deep(.el-input__wrapper:hover), .login-input :deep(.el-input__wrapper.is-focus) { border-color: rgba(99,102,241,.4) !important; background: rgba(255,255,255,.06) !important; }
.login-input :deep(input) { color: #E2E8F0 !important; }
.login-input :deep(input:-webkit-autofill) { -webkit-text-fill-color: #E2E8F0 !important; -webkit-box-shadow: 0 0 0 1000px #14142B inset !important; caret-color: #E2E8F0; transition: background-color 9999s; }
.login-input :deep(.el-input__prefix) { color: #475569; }
.login-input :deep(.el-input__suffix) { color: #475569; }

.login-select :deep(.el-input__wrapper) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.08) !important; border-radius: 10px !important; box-shadow: none !important; }
.login-select :deep(.el-input__wrapper:hover) { border-color: rgba(99,102,241,.4) !important; }
.login-select :deep(input) { color: #E2E8F0 !important; }

.code-input :deep(input) { text-align: center; letter-spacing: 12px; font-size: 22px !important; }

.resend-row { text-align: right; margin-bottom: 16px; font-size: 13px; color: #475569; }
.resend-link { color: #818CF8; cursor: pointer; }
.step-back { text-align: center; margin-top: 12px; font-size: 13px; }
.step-back a { color: #475569; cursor: pointer; }

.submit-btn { width: 100%; height: 48px; border: none; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: 4px; transition: all .3s; box-shadow: 0 4px 20px rgba(99,102,241,.35); display: flex; align-items: center; justify-content: center; gap: 8px; }
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,.45); }
.submit-btn:disabled { opacity: .6; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.sms-btn { height: 48px; border: 1px solid rgba(99,102,241,.3); border-radius: 10px; background: rgba(99,102,241,.1); color: #A5B4FC; font-size: 13px; cursor: pointer; font-family: inherit; white-space: nowrap; padding: 0 14px; flex-shrink: 0; min-width: 90px; }
.sms-btn:hover:not(:disabled) { background: rgba(99,102,241,.2); border-color: rgba(99,102,241,.5); }
.sms-btn:disabled { opacity: .4; cursor: not-allowed; }

.ls-extra { margin-top: 20px; text-align: center; }
.ls-register { color: #64748B; font-size: 13px; text-decoration: none; }
.ls-register:hover { color: #818CF8; }
.ls-copy { color: #334155; font-size: 12px; margin-top: 36px; }

/* 移动端：隐藏左侧品牌区，只保留登录表单，收窄内边距 */
@media (max-width: 768px) {
  .brand-side { display: none; }
  .login-side { padding: 20px 16px; }
  .ls-card { padding: 28px 20px 24px; }
  .bi-logo { font-size: 36px; }
}
</style>
