<template>
  <div class="login-container">
    <div class="login-card">
      <h1>📖 阅读云英语</h1>
      <p class="subtitle">AI 智能英语学习平台</p>
      <el-tabs v-model="loginType" class="login-tabs">
        <el-tab-pane label="教练登录" name="coach" />
        <el-tab-pane label="机构登录" name="agency" />
      </el-tabs>
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" type="password" show-password :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" native-type="submit" class="login-btn">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <p class="register-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loginType = ref('coach')
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  username: 'coach',
  password: 'coach123'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await authStore.login(form.username, form.password)
    ElMessage.success(`欢迎回来，${res.user.real_name || form.username}！`)
    const role = res.user.role_type
    if (role === 3) router.push('/coach/dashboard')
    else if (role === 2) router.push('/agency/dashboard')
    else if (role === 1) router.push('/platform/dashboard')
    else router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
h1 { text-align: center; color: #303133; font-size: 28px; margin-bottom: 4px; }
.subtitle { text-align: center; color: #909399; margin-bottom: 24px; }
.login-tabs { margin-bottom: 20px; }
.login-btn { width: 100%; }
.register-link { text-align: center; color: #909399; margin-top: 16px; }
</style>
