<template>
  <div class="reg-page">
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
        <p class="bi-desc">创建您的账号，开始智慧学习之旅</p>
      </div>
    </div>

    <div class="reg-side">
      <div class="rs-card">
        <h3>注册账号</h3>
        <p class="rs-sub">选择身份，填写信息完成注册</p>

        <div class="role-switch">
          <button v-for="r in roles" :key="r.value" :class="['rs-btn', { active: role === r.value }]" @click="role = r.value">
            <span class="rs-icon" v-html="r.icon" /><span>{{ r.label }}</span>
          </button>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleRegister" autocomplete="off">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" size="large" class="reg-input" autocomplete="off"/>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" placeholder="密码" type="password" size="large" show-password class="reg-input" autocomplete="new-password"/>
          </el-form-item>
          <el-form-item prop="phone">
            <el-input v-model="form.phone" placeholder="手机号" size="large" class="reg-input" maxlength="11"/>
          </el-form-item>
          <el-form-item>
            <div style="display:flex;gap:8px">
              <el-input v-model="smsCode" placeholder="验证码" size="large" class="reg-input" maxlength="6" style="flex:1"/>
              <el-button size="large" @click="sendCode" :disabled="!form.phone||sending||countdown>0" class="sms-btn">
                {{ countdown > 0 ? countdown+'s' : sending ? '…' : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"/><span>注 册</span>
          </button>
        </el-form>

        <div class="rs-extra">已有账号？<router-link to="/login">返回登录</router-link></div>
      </div>
      <p class="rs-copy">© 2026 智学AI教育</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register, sendSmsCode } from '@/api/common/auth'

const router = useRouter()
const role = ref('teacher')
const loading = ref(false)
const sending = ref(false)
const formRef = ref(null)
const smsCode = ref('')
const countdown = ref(0)

const form = reactive({ username: '', password: '', phone: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}
const roles = [
  { label: '老师', value: 'teacher', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6M17 11h6"/></svg>` },
  { label: '学生', value: 'student', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 10v5M6 3l14 7-14 7"/><path d="M2 12v7"/></svg>` },
]

async function sendCode() {
  if (!/^1\d{10}$/.test(form.phone)) { ElMessage.warning('请输入正确的手机号'); return }
  sending.value = true
  try {
    await sendSmsCode(form.phone)
    countdown.value = 60
    const t = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(t) }, 1000)
    ElMessage.success('验证码已发送')
  } catch (e) { ElMessage.error(e.response?.data?.message || '发送失败') }
  sending.value = false
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!smsCode.value || smsCode.value.length < 4) { ElMessage.warning('请输入验证码'); return }
  loading.value = true
  try {
    await register({
      username: form.username, password: form.password,
      phone: form.phone, code: smsCode.value,
      roleType: role.value==='teacher'?3:4
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) { ElMessage.error(e.response?.data?.message || '注册失败') }
  loading.value = false
}

// 粒子背景
const bgCanvas = ref(null)
onMounted(() => {
  const c = bgCanvas.value; if (!c) return
  c.width = window.innerWidth; c.height = window.innerHeight
  const ctx = c.getContext('2d')
  const pts = Array.from({ length: 30 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.35 + 0.1,
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
    requestAnimationFrame(draw)
  }
  draw()
})
</script>

<style scoped>
.reg-page { display: flex; min-height: 100vh; background: #0A0A1A; position: relative; overflow: hidden; }
.bg-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

.brand-side { flex: 1; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; padding: 60px; }
.brand-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,.1) 0%, transparent 70%); }
.brand-inner { position: relative; z-index: 2; max-width: 380px; }
.bi-logo { display: flex; align-items: center; gap: 10px; font-size: 44px; font-weight: 800; letter-spacing: 6px; color: #fff; margin-bottom: 4px; }
.bi-mark { color: #818CF8; display: flex; align-items: center; }
.bi-sub { font-size: 16px; font-weight: 600; letter-spacing: 8px; color: #818CF8; margin-bottom: 20px; }
.bi-desc { color: #475569; font-size: 14px; }

.reg-side { flex: 1; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; }
.rs-card { width: 100%; max-width: 420px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 20px; padding: 32px 36px 28px; backdrop-filter: blur(20px); }
.rs-card h3 { font-size: 26px; font-weight: 700; color: #F1F5F9; margin-bottom: 4px; }
.rs-sub { color: #475569; font-size: 14px; margin-bottom: 18px; }

.role-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: 10px; background: rgba(255,255,255,.04); margin-bottom: 18px; }
.rs-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border: none; border-radius: 8px; background: transparent; color: #475569; font-size: 12px; cursor: pointer; transition: all .2s; font-family: inherit; }
.rs-btn.active { background: rgba(99,102,241,.2); color: #A5B4FC; font-weight: 600; }
.rs-icon { color: inherit; display: flex; align-items: center; justify-content: center; }

.reg-input :deep(.el-input__wrapper) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: none !important; border-radius: 10px !important; }
.reg-input :deep(.el-input__wrapper:hover), .reg-input :deep(.el-input__wrapper.is-focus) { border-color: rgba(99,102,241,.4) !important; }
.reg-input :deep(input) { color: #E2E8F0 !important; }
.reg-select :deep(.el-input__wrapper) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.08) !important; border-radius: 10px !important; box-shadow: none !important; }
.reg-select :deep(input) { color: #E2E8F0 !important; }

.sms-btn { height: 48px; border: 1px solid rgba(99,102,241,.3); border-radius: 10px; background: rgba(99,102,241,.1); color: #A5B4FC; font-size: 13px; cursor: pointer; font-family: inherit; white-space: nowrap; padding: 0 14px; flex-shrink: 0; min-width: 90px; }
.sms-btn:hover:not(:disabled) { background: rgba(99,102,241,.2); border-color: rgba(99,102,241,.5); }
.sms-btn:disabled { opacity: .4; cursor: not-allowed; }

.submit-btn { width: 100%; height: 48px; border: none; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: 4px; transition: all .3s; box-shadow: 0 4px 20px rgba(99,102,241,.35); display: flex; align-items: center; justify-content: center; gap: 8px; }
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,.45); }
.submit-btn:disabled { opacity: .6; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rs-extra { margin-top: 20px; text-align: center; font-size: 13px; color: #64748B; }
.rs-extra a { color: #818CF8; text-decoration: none; }
.rs-copy { color: #334155; font-size: 12px; margin-top: 36px; }
</style>
