import http from '@/api/request'

// ============================================================
// 站内消息 API（老师端接收资源审核反馈等）
// ============================================================

export function getMessages(params) { // { page, pageSize }
  return http.get('/user/messages', { params })
}
export function getUnreadCount() {
  return http.get('/user/messages/unread-count')
}
export function markMessageRead(id) {
  return http.put(`/user/messages/${id}/read`)
}
export function markAllMessagesRead() {
  return http.put('/user/messages/read-all')
}
export function deleteMessage(id) {
  return http.delete(`/user/messages/${id}`)
}
