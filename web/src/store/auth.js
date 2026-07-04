import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginAPI, getUserInfo } from '@/api/common/auth'

export const useAuthStore = defineStore('auth', () => {
  // 从 URL 路径推断当前 tab 角色，登录页则尝试所有 key
  function detectRole() {
    const p = window.location.pathname
    if (p.startsWith('/student')) return 4
    if (p.startsWith('/teacher')) return 3
    if (p.startsWith('/admin')) return 1
    // 登录页：尝试读取所有角色 key，取有数据的
    for (const r of [4,3,1]) { if (localStorage.getItem(`eduai_token_${r}`)) return r }
    return null
  }
  const pathRole = detectRole()
  const tokenKey = pathRole ? `eduai_token_${pathRole}` : 'eduai_token'
  const userKey = pathRole ? `eduai_user_${pathRole}` : 'eduai_user'
  const token = ref(localStorage.getItem(tokenKey) || '')
  const user = ref(JSON.parse(localStorage.getItem(userKey) || 'null'))
  const permissions = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.roleType)
  const isTeacher = computed(() => role.value === 3)
  const isStudent = computed(() => role.value === 4)
  const isAdmin = computed(() => role.value === 1)

  async function login(username, password) {
    const res = await loginAPI(username, password)
    token.value = res.token
    user.value = res.user
    const rt = res.user.roleType
    // 按角色隔离存储 — 不同角色不会互相覆盖
    localStorage.setItem(`eduai_token_${rt}`, res.token)
    localStorage.setItem(`eduai_user_${rt}`, JSON.stringify(res.user))
    return res
  }

  async function fetchUserInfo() {
    const res = await getUserInfo()
    user.value = res
    localStorage.setItem(userKey, JSON.stringify(res))
  }

  function demoLogin(username, roleType, roleName) {
    const fakeToken = 'demo-token-' + Date.now()
    const fakeUsers = {
      'coach':   { name: '李老师', subjects: ['math','physics'] },
      'english': { name: '王老师', subjects: ['english'] },
      'math':    { name: '张老师', subjects: ['math'] },
      'multi':   { name: '陈老师', subjects: ['math','physics','chemistry'] },
      'admin':   { name: '系统管理员', subjects: ['math','physics','chemistry','biology','chinese','english','history','politics','geography'] }
    }
    const info = fakeUsers[username] || { name: username, subjects: ['math','physics'] }
    const fakeUser = { id: roleType * 100, username, realName: info.name, roleType, subjects }
    token.value = fakeToken; user.value = fakeUser
    
    localStorage.setItem(`eduai_token_${roleType}`, fakeToken)
    localStorage.setItem(`eduai_user_${roleType}`, JSON.stringify(fakeUser))
  }

  async function enrichStudentSubjects() {
    if (user.value?.roleType !== 4) return
    try {
      const { default: http } = await import('@/api/request')
      const res = await http.get('/student/enrollments')
      const courses = res?.courses || []
      const allSubjects = [...new Set(courses.map(c => c.subject))]
      const grade = courses[0]?.grade || ''
      user.value = { ...user.value, enrolledSubjects: allSubjects, grade }
      localStorage.setItem(`eduai_user_${user.value.roleType}`, JSON.stringify(user.value))
    } catch {}
  }

  function logout() {
    const rt = user.value?.roleType
    token.value = ''; user.value = null
    
    if (rt) { localStorage.removeItem(`eduai_token_${rt}`); localStorage.removeItem(`eduai_user_${rt}`) }
  }

  return { token, user, permissions, isLoggedIn, role, isTeacher, isStudent, isAdmin, login, demoLogin, logout, fetchUserInfo, enrichStudentSubjects }
})
