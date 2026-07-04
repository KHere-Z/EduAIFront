import http from '@/api/request'

// === 学生管理 ===
export function getAdminStudents(params) { return http.get('/admin/students', { params }) }
export function createAdminStudent(data)    { return http.post('/admin/students', data) }
export function updateAdminStudent(id, data){ return http.put(`/admin/students/${id}`, data) }
export function deleteAdminStudent(id)      { return http.delete(`/admin/students/${id}`) }

// === 老师管理 ===
export function getAdminTeachers(params)    { return http.get('/admin/teachers', { params }) }
export function getAdminTeacher(userId)      { return http.get(`/admin/teachers/${userId}`) }
export function createAdminTeacher(data)     { return http.post('/admin/teachers', data) }
export function updateAdminTeacher(id, data) { return http.put(`/admin/teachers/${id}`, data) }
export function deleteAdminTeacher(id)       { return http.delete(`/admin/teachers/${id}`) }

// === 排课查看 ===
export function getAdminSchedules(params)    { return http.get('/admin/schedules', { params }) }

// === 概览统计 ===
export function getAdminStats()              { return http.get('/admin/stats') }

// === 老师学生 ===
export function getTeacherMathStudents()     { return http.get('/teacher/math-students') }

// === 系统设置 ===
export function getAdminSettings()           { return http.get('/admin/settings') }
export function updateAdminSettings(data)    { return http.put('/admin/settings', data) }
