import http from '@/api/request'
export function getEnrollments()       { return http.get('/student/enrollments') }
export function getSchedule(params)    { return http.get('/student/schedule', { params }) }
export function getStreak()            { return http.get('/student/streak') }
export function doCheckin()            { return http.post('/student/checkin') }
export function submitReschedule(data) { return http.post('/student/reschedule', data) }
