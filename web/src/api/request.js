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

http.interceptors.response.use(
  response => {
    const { data } = response
    // 后端统一响应: { code, message, data }
    if (data.code && data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      if (data.code === 401) {
        useAuthStore().logout()
        router.push('/login')
      }
      return Promise.reject(new Error(data.message))
    }
    return data.data ?? data
  },
  error => {
    if (error.response?.status === 401) {
      useAuthStore().logout()
      router.push('/login')
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default http
