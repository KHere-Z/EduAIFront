import * as api from '@/api/common/resources'

// ============================================================
// 学习资源运行时服务：API 优先，后端 /resource/* 未就绪时回退 localStorage。
// 与 ResourcesView.vue 共用 `eduai_learning_resources` 键，管理员上传后学生/老师端立即可见。
// ============================================================

const K = {
  textbooks: 'eduai_resource_textbooks',
  chapters: 'eduai_resource_chapters',
  sections: 'eduai_resource_sections',
  resources: 'eduai_learning_resources', // 与 ResourcesView.vue 保持一致
}

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => 'lr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// API 成功即用 API 结果；失败（含后端未实现 404/500）回退 fallback
const withFallback = async (apiFn, fallbackFn) => {
  try { const r = await apiFn(); if (r !== undefined && r !== null) return r } catch {}
  return fallbackFn()
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

// ---- 教材 ----
export async function listTextbooks(subject = 'math') {
  return withFallback(() => api.getTextbooks(subject), () => read(K.textbooks).filter(t => t.subject === subject))
}
export async function createTextbook(data) {
  return withFallback(() => api.createTextbook(data), () => {
    const list = read(K.textbooks)
    const item = { id: uid(), subject: data.subject || 'math', stage: data.stage || 'junior', version: data.version || 'suke', name: data.name, createdAt: Date.now() }
    list.push(item); write(K.textbooks, list); return item
  })
}

// ---- 章节 ----
export async function listChapters(textbookId) {
  return withFallback(() => api.getChapters(textbookId), () => read(K.chapters).filter(c => c.textbookId === textbookId))
}
export async function createChapter(textbookId, data) {
  return withFallback(() => api.createChapter(textbookId, data), () => {
    const list = read(K.chapters)
    const item = { id: uid(), textbookId, name: data.name, createdAt: Date.now() }
    list.push(item); write(K.chapters, list); return item
  })
}

// ---- 小节 ----
export async function listSections(chapterId) {
  return withFallback(() => api.getSections(chapterId), () => read(K.sections).filter(s => s.chapterId === chapterId))
}
export async function createSection(chapterId, data) {
  return withFallback(() => api.createSection(chapterId, data), () => {
    const list = read(K.sections)
    const item = { id: uid(), chapterId, name: data.name, createdAt: Date.now() }
    list.push(item); write(K.sections, list); return item
  })
}

// ---- 资源 ----
export async function listResources(sectionId) {
  return withFallback(() => api.getResources({ sectionId }), () => read(K.resources).filter(r => r.sectionId === sectionId))
}
export async function addResources(sectionId, subject, tag, year, price, shared, files) {
  return withFallback(
    () => {
      const fd = new FormData()
      fd.append('sectionId', sectionId)
      fd.append('subject', subject)
      fd.append('tag', tag)
      fd.append('year', year)
      fd.append('price', price)
      fd.append('shared', shared ? 'true' : 'false')
      files.forEach(f => fd.append('files', f))
      return api.uploadResources(fd)
    },
    async () => {
      const list = read(K.resources)
      const created = []
      for (const f of files) {
        const data = await fileToBase64(f)
        const item = {
          id: uid(), sectionId, subject, type: tag, tag, year, price, shared,
          title: f.name, fileName: f.name, fileSize: f.size,
          data, author: '管理员', createdAt: Date.now(),
        }
        list.push(item); created.push(item)
      }
      write(K.resources, list)
      return created
    }
  )
}
export async function removeResource(id) {
  return withFallback(() => api.deleteResource(id), () => write(K.resources, read(K.resources).filter(r => r.id !== id)))
}
