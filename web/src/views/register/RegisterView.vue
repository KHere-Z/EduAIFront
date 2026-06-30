<template>
  <div class="register-container">
    <div class="register-card">
      <h1>📖 注册账号</h1>
      <el-form :model="form" label-position="top">
        <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio :value="3">教练</el-radio>
            <el-radio :value="2">机构</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-button type="primary" class="register-btn">注册</el-button>
      </el-form>
      <p class="login-link">已有账号？<router-link to="/login">去登录</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const form = reactive({ username: '', password: '', role: 3 })
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.register-card {
  width: 420px; padding: 40px; background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
h1 { text-align: center; margin-bottom: 24px; }
.register-btn { width: 100%; }
.login-link { text-align: center; margin-top: 16px; color: #909399; }
</style>
