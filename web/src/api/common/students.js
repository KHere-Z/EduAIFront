import http from '@/api/request'

// 学生列表
export function getStudents(params) {
  return http.get('/students', { params })
}

// 学生详情
export function getStudent(id) {
  return http.get(`/students/${id}`)
}

// 新增学生 —— 已停用：后端 StudentServiceImpl.create 现在直接抛业务异常。
// 老师这条链路没有 UID，只能按姓名猜，会造出重复空档案（老师收不到试卷）或挂错档案。
// 学生档案一律由学生本人注册时创建，老师通过 UID 关联（POST /relations/request）。
// 保留此函数只为让调用点显式失败，不要再接回 UI。
export function createStudent(data) {
  return http.post('/students', data)
}

// 更新学生
export function updateStudent(id, data) {
  return http.put(`/students/${id}`, data)
}

// 删除学生
export function deleteStudent(id) {
  return http.delete(`/students/${id}`)
}

// 课时加减
export function adjustHours(id, delta) {
  return http.patch(`/students/${id}/hours`, { delta })
}

// 日历查询
export function getCalendar(year, month) {
  return http.get('/students/calendar', { params: { year, month } })
}
