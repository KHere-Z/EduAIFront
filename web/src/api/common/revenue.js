import http from '@/api/request'

// ============================================================
// 老师资源下载分成 + 提现
// 金额单位统一为「分」（1元 = 100分），前端展示时 /100
// ============================================================

// ---- 老师收益中心 ----
export function getTeacherRevenue() {
  return http.get('/teacher/revenue')
}
export function requestWithdraw(data) { // { amount(分), bankName, bankCardNo, accountName }
  return http.post('/teacher/revenue/withdraw', data)
}

// ---- 管理员提现审核 ----
export function getAdminWithdraws() {
  return http.get('/admin/revenue/withdraws')
}
export function reviewWithdraw(id, data) { // { approved, note }
  return http.post(`/admin/revenue/withdraws/${id}/review`, data)
}
