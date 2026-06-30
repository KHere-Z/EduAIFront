import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/store/auth'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000
})

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
