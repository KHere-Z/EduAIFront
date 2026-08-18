import http from '@/api/request'

// 密码登录（保留兼容）
export function login(username, password) {
  return http.post('/auth/login', { username, password })
}

// 发送短信验证码
export function sendSmsCode(phone) {
  return http.post('/auth/send-sms', { phone })
}

// 手机号+验证码登录（新用户自动注册）
export function loginBySms(phone, code, role) {
  return http.post('/auth/login-sms', { phone, code, role })
}

// 微信登录
export function loginByWechat(openid, unionid) {
  return http.post('/auth/wechat-login', { openid, unionid })
}

// 微信绑定手机号
export function bindPhone(openid, unionid, phone, code) {
  return http.post('/auth/bind-phone', { openid, unionid, phone, code })
}

// 已登录用户绑定微信
export function bindWechat(openid, unionid) {
  return http.post('/auth/bind-wechat', { openid, unionid })
}

// 已登录用户解绑微信
export function unbindWechat() {
  return http.delete('/auth/unbind-wechat')
}

// 获取当前用户信息
export function getUserInfo() {
  return http.get('/auth/me')
}

// 注册
export function register(data) {
  return http.post('/auth/register', data)
}
