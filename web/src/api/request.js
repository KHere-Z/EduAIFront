import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/store/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 600000,  // 10分钟，匹配后端AI超时
  transformRequest: [function(data, headers) {
    if (data instanceof FormData) return data
    // 强制 UTF-8 编码 Blob，避免 Windows 中文环境 GBK 问题
    return new Blob([JSON.stringify(data)], {type: 'application/json;charset=UTF-8'})
  }]
})

http.interceptors.request.use(config => {
  // 文件上传时不覆盖 Content-Type；Blob 自带 type，不用再设
  if (!(config.data instanceof FormData) && !(config.data instanceof Blob)) {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8'
  }
  // 从 Pinia 内存读取 token，避免多 tab 角色切换时 localStorage 覆盖
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// HTTP 状态码 → 用户可读文案（不暴露 "Request failed with status code 400" 这类原始信息）
const STATUS_TEXT = {
  400: '请求参数有误，请检查后重试',
  403: '没有权限执行该操作',
  404: '请求的资源不存在',
  429: '操作过于频繁，请稍后再试',
}

function resolveErrorMessage(error) {
  const status = error.response?.status
  const data = error.response?.data
  // 优先用后端返回的业务文案
  if (data && typeof data === 'object') {
    const m = data.message || data.msg || data.error
    if (typeof m === 'string' && m.trim()) return m
  }
  if (!error.response) return '网络连接失败，请检查网络后重试'
  if (STATUS_TEXT[status]) return STATUS_TEXT[status]
  if (status >= 500) return '服务器开小差了，请稍后重试'
  return '请求失败，请稍后重试'
}

// 请求配置里带 silent: true 时，不弹全局错误提示（由调用方自行提示，避免重复弹窗）
const isSilent = (config) => config?.silent === true

http.interceptors.response.use(
  response => {
    const { data, config } = response
    // 后端统一响应: { code, message, data }
    if (data.code && data.code !== 200) {
      if (!isSilent(config)) ElMessage.error(data.message || '请求失败')
      // 登录类请求（silent）失败不做登出跳转，否则会在登录页自我跳转
      if (data.code === 401 && !isSilent(config)) {
        useAuthStore().logout()
        router.push('/login')
      }
      const err = new Error(data.message || '请求失败')
      err.response = response
      return Promise.reject(err)
    }
    return data.data ?? data
  },
  error => {
    const silent = isSilent(error.config)
    if (error.response?.status === 401 && !silent) {
      useAuthStore().logout()
      router.push('/login')
    }
    if (!silent) ElMessage.error(resolveErrorMessage(error))
    return Promise.reject(error)
  }
)

export default http
