import http from '@/api/request'
// 老师端
export function getTeacherQuestions(params) { return http.get('/teacher/questions', { params }) }
export function getTeacherQuestionDetail(id) { return http.get(`/teacher/questions/${id}`) }
export function updateTeacherQuestion(id, data) { return http.put(`/teacher/questions/${id}`, data) }
export function uploadTeacherQuestion(data) { return http.post('/teacher/questions/upload', data) }
// 学生端
export function getStudentWrongQuestions(params) { return http.get('/student/questions/wrong', { params }) }
export function getStudentNewQuestions(params) { return http.get('/student/questions/new', { params }) }
