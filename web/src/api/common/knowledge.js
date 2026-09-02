import http from '@/api/request'
export function getKnowledgePoints(params) { return http.get('/knowledge-points', { params }) }
export function createKnowledgePoint(data) { return http.post('/knowledge-points', data) }
export function updateKnowledgePoint(id, data) { return http.put(`/knowledge-points/${id}`, data) }
export function deleteKnowledgePoint(id) { return http.delete(`/knowledge-points/${id}`) }
