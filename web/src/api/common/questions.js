import http from '@/api/request'
// 老师端
export function getTeacherQuestions(params) { return http.get('/teacher/questions', { params }) }
export function getTeacherQuestionDetail(id) { return http.get(`/teacher/questions/${id}`) }
export function updateTeacherQuestion(id, data) { return http.put(`/teacher/questions/${id}`, data) }
export function uploadTeacherQuestion(data) { return http.post('/teacher/questions/upload', data) }
export function deleteTeacherQuestion(id) { return http.delete(`/teacher/questions/${id}`) }
// 老师端：查看已绑定学生的错题（未绑定返回 403）
export function getTeacherStudentWrongQuestions(studentId, params) { return http.get(`/teacher/students/${studentId}/wrong-questions`, { params }) }
// 学生端
export function getStudentWrongQuestions(params) { return http.get('/student/questions/wrong', { params }) }
export function getStudentNewQuestions(params) { return http.get('/student/questions/new', { params }) }
export function getSimilarQuestions(params) { return http.get('/student/questions/similar', { params }) }
