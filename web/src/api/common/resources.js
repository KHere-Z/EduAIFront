import http from '@/api/request'

// ============================================================
// 学习资源 API 契约（教材 → 章节 → 小节 三级目录 + 资源文件）
// 前端运行时经 @/utils/resourceService.js 调用：API 优先，后端未就绪时回退 localStorage。
// 约定：
//   - 所有 GET 均返回 data: [ ... ] 扁平数组（暂不分页）
//   - 创建接口返回 data: { id, ... } 单个实体
//   - subject 当前仅 'math'（仅数学）
// ============================================================

// ---- 教材 textbook ----
export function getTextbooks(subject = 'math') {
  return http.get('/resource/textbooks', { params: { subject } })
}
export function createTextbook(data) { // { subject, name }
  return http.post('/resource/textbooks', data)
}
export function deleteTextbook(id) {
  return http.delete(`/resource/textbooks/${id}`)
}

// ---- 章节 chapter ----
export function getChapters(textbookId) {
  return http.get(`/resource/textbooks/${textbookId}/chapters`)
}
export function createChapter(textbookId, data) { // { name }
  return http.post(`/resource/textbooks/${textbookId}/chapters`, data)
}
export function deleteChapter(id) {
  return http.delete(`/resource/chapters/${id}`)
}

// ---- 小节 section ----
export function getSections(chapterId) {
  return http.get(`/resource/chapters/${chapterId}/sections`)
}
export function createSection(chapterId, data) { // { name }
  return http.post(`/resource/chapters/${chapterId}/sections`, data)
}
export function deleteSection(id) {
  return http.delete(`/resource/sections/${id}`)
}

// ---- 更新 / 排序 ----
export function updateTextbook(id, data) { return http.put(`/resource/textbooks/${id}`, data) } // { name?, version?, sortOrder? }
export function updateChapter(id, data) { return http.put(`/resource/chapters/${id}`, data) } // { name?, sortOrder? }
export function updateSection(id, data) { return http.put(`/resource/sections/${id}`, data) } // { name?, sortOrder? }
export function reorderTextbooks(orderedIds) { return http.put('/resource/textbooks/reorder', { orderedIds }) }
export function reorderChapters(orderedIds) { return http.put('/resource/chapters/reorder', { orderedIds }) }
export function reorderSections(orderedIds) { return http.put('/resource/sections/reorder', { orderedIds }) }

// ---- 资源 ----
export function getResources(params) { // { sectionId, subject }
  return http.get('/resource/resources', { params })
}
// FormData: sectionId, subject, tag(课件/学案/作业/试卷), year(年份), price(资源点), files[](多文件)
export function uploadResources(formData) {
  return http.post('/resource/resources/upload', formData)
}
export function deleteResource(id) {
  return http.delete(`/resource/resources/${id}`)
}
export function getResourceDownloadUrl(id) {
  return `/api/v1/resource/resources/${id}/download`
}
// 预览：返回 { type: 'pdf'|'image'|'none', url }；后端未实现 404/500 时由调用方兜底
export function getResourcePreview(id) {
  return http.get(`/resource/resources/${id}/preview`)
}
// 解压 zip 内部清单（仅 zip，rar 由后端拒绝）：返回 { files: [{ path, name, size, previewable }] }
export function inspectArchive(file) {
  const fd = new FormData()
  fd.append('file', file)
  return http.post('/resource/archive/inspect', fd)
}

// ---- 资源审核（管理员端） ----
export function getPendingResources() {
  return http.get('/resource/review/pending')
}
export function reviewResource(id, data) { // { approved, price?, reason? }
  return http.post(`/resource/review/${id}`, data)
}
