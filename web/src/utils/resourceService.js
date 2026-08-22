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
const bySort = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)

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
  return withFallback(() => api.getTextbooks(subject), () => read(K.textbooks).filter(t => t.subject === subject).sort(bySort))
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
  return withFallback(() => api.getChapters(textbookId), () => read(K.chapters).filter(c => c.textbookId === textbookId).sort(bySort))
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
  return withFallback(() => api.getSections(chapterId), () => read(K.sections).filter(s => s.chapterId === chapterId).sort(bySort))
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

// 级联删除：教材 → 章节 → 小节 → 资源
export async function removeTextbook(id) {
  return withFallback(() => api.deleteTextbook(id), () => {
    const chIds = read(K.chapters).filter(c => c.textbookId === id).map(c => c.id)
    const secIds = read(K.sections).filter(s => chIds.includes(s.chapterId)).map(s => s.id)
    write(K.textbooks, read(K.textbooks).filter(t => t.id !== id))
    write(K.chapters, read(K.chapters).filter(c => c.textbookId !== id))
    write(K.sections, read(K.sections).filter(s => !chIds.includes(s.chapterId)))
    write(K.resources, read(K.resources).filter(r => !secIds.includes(r.sectionId)))
  })
}
export async function removeChapter(id) {
  return withFallback(() => api.deleteChapter(id), () => {
    const secIds = read(K.sections).filter(s => s.chapterId === id).map(s => s.id)
    write(K.chapters, read(K.chapters).filter(c => c.id !== id))
    write(K.sections, read(K.sections).filter(s => s.chapterId !== id))
    write(K.resources, read(K.resources).filter(r => !secIds.includes(r.sectionId)))
  })
}
export async function removeSection(id) {
  return withFallback(() => api.deleteSection(id), () => {
    write(K.sections, read(K.sections).filter(s => s.id !== id))
    write(K.resources, read(K.resources).filter(r => r.sectionId !== id))
  })
}

// ---- 更新（改名等） ----
const patchById = (key, id, patch) => {
  const list = read(key)
  const i = list.findIndex(x => x.id === id)
  if (i < 0) return null
  list[i] = { ...list[i], ...patch }
  write(key, list)
  return list[i]
}
export async function updateTextbook(id, patch) {
  return withFallback(() => api.updateTextbook(id, patch), () => patchById(K.textbooks, id, patch))
}
export async function updateChapter(id, patch) {
  return withFallback(() => api.updateChapter(id, patch), () => patchById(K.chapters, id, patch))
}
export async function updateSection(id, patch) {
  return withFallback(() => api.updateSection(id, patch), () => patchById(K.sections, id, patch))
}

// ---- 排序（手动拖拽后按序持久化） ----
const reorderByIds = (key, orderedIds) => {
  const list = read(key)
  const map = new Map(list.map(x => [x.id, x]))
  const ordered = orderedIds.map(id => map.get(id)).filter(Boolean)
  const rest = list.filter(x => !orderedIds.includes(x.id))
  const result = [...ordered, ...rest].map((x, i) => ({ ...x, sortOrder: i + 1 }))
  write(key, result)
  return result
}
export async function reorderTextbooks(orderedIds) {
  return withFallback(() => api.reorderTextbooks(orderedIds), () => reorderByIds(K.textbooks, orderedIds))
}
export async function reorderChapters(orderedIds) {
  return withFallback(() => api.reorderChapters(orderedIds), () => reorderByIds(K.chapters, orderedIds))
}
export async function reorderSections(orderedIds) {
  return withFallback(() => api.reorderSections(orderedIds), () => reorderByIds(K.sections, orderedIds))
}
