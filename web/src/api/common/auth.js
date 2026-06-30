import http from '@/api/request'

export function login(username, password) {
  return http.post('/auth/login', { username, password })
}

export function register(data) {
  return http.post('/auth/register', data)
}

export function getUserInfo() {
  return http.get('/auth/me')
}
