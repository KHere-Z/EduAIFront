import http from '@/api/request'
export function getKnowledgePoints(params) { return http.get('/knowledge-points', { params }) }
export function createKnowledgePoint(data) { return http.post('/knowledge-points', data) }
export function updateKnowledgePoint(id, data) { return http.put(`/knowledge-points/${id}`, data) }
export function deleteKnowledgePoint(id) { return http.delete(`/knowledge-points/${id}`) }

// 知识点资源
export function getKpResources(kpId) { return http.get(`/knowledge-points/${kpId}/resources`) }
export function uploadKpResource(kpId, formData) { return http.post(`/knowledge-points/${kpId}/resources`, formData) }
export function deleteKpResource(id) { return http.delete(`/knowledge-points/resources/${id}`) }
export function getKpDownloadUrl(id) { return `/api/v1/knowledge-points/resources/${id}/download` }
