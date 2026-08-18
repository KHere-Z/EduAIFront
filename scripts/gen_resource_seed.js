// 从前端 ResourcesView.vue 中提取硬编码的教材目录树，生成 MySQL 种子 SQL。
// 用法：node scripts/gen_resource_seed.js
// 输出：docs/spec/08-resource-catalog.sql
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'web/src/views/student/subject/ResourcesView.vue')
const OUT = path.join(ROOT, 'docs/spec/08-resource-catalog.sql')

const src = fs.readFileSync(SRC, 'utf8')
const start = src.indexOf('const mk =')
const end = src.indexOf('const versionTrees')
if (start < 0 || end < 0) throw new Error('未找到目录树定义块')
const block = src.slice(start, end)

// 将顶层 const XxxTree = 改写为 globalThis.__XxxTree =，其余 mk/buildChapter 保持 const
let code = block
for (const name of ['primaryTree', 'juniorTree', 'seniorTree', 'renjiaoTree', 'bsdTree', 'zjTree', 'hkTree']) {
  code = code.replace('const ' + name + ' =', 'globalThis.__' + name + ' =')
}
eval(code) // eslint-disable-line no-eval

const trees = {
  suke:    { primary: globalThis.__primaryTree, junior: globalThis.__juniorTree, senior: globalThis.__seniorTree },
  renjiao: { primary: [], junior: globalThis.__renjiaoTree, senior: [] },
  bsd:     { primary: [], junior: globalThis.__bsdTree, senior: [] },
  zj:      { primary: [], junior: globalThis.__zjTree, senior: [] },
  hk:      { primary: [], junior: globalThis.__hkTree, senior: [] },
}

const esc = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "''")

const textbooks = []
const chapters = []
const sections = []
let tid = 0, cid = 0, sid = 0

for (const [version, stages] of Object.entries(trees)) {
  for (const [stage, list] of Object.entries(stages)) {
    if (!Array.isArray(list)) continue
    for (const node of list) {
      if (!node || !Array.isArray(node.children) || !node.children.length) continue
      if (String(node.label || '').includes('专项')) continue // 跳过「小学专项/高中专项」这类 mock 分类节点
      tid++
      const t = { id: tid, subject: 'math', version, stage, name: node.label, grade: node.grade || '', sort: 0 }
      textbooks.push(t)
      node.children.forEach((ch, ci) => {
        cid++
        const c = { id: cid, textbookId: tid, name: ch.label, chapter: ch.chapter || '', sort: ci + 1 }
        chapters.push(c)
        if (Array.isArray(ch.children)) {
          ch.children.forEach((sec, si) => {
            sid++
            sections.push({ id: sid, chapterId: cid, name: sec.label, sort: si + 1 })
          })
        }
      })
    }
  }
}

// 教材排序：按 version + stage + 插入顺序
textbooks.forEach((t, i) => { t.sort = i + 1 })

const lines = []
lines.push('-- 学习资源目录种子数据（数学）')
lines.push('-- 由 scripts/gen_resource_seed.js 从 ResourcesView.vue 自动生成，请勿手改本文件。')
lines.push('-- 三级结构：教材(resource_textbook) → 章节(resource_chapter) → 小节(resource_section)')
lines.push('-- 学科 key：math。版本：suke/renjiao/bsd/zj/hk。学段：primary/junior/senior。')
lines.push('')
lines.push('-- ================= DDL =================')
lines.push('CREATE TABLE IF NOT EXISTS resource_textbook (')
lines.push('  id BIGINT NOT NULL AUTO_INCREMENT,')
lines.push("  subject VARCHAR(20) NOT NULL DEFAULT 'math',")
lines.push("  version VARCHAR(20) NOT NULL DEFAULT 'suke' COMMENT '版本 key：suke/renjiao/bsd/zj/hk',")
lines.push("  stage VARCHAR(10) NOT NULL DEFAULT 'junior' COMMENT '学段：primary/junior/senior',")
lines.push('  name VARCHAR(100) NOT NULL COMMENT \'教材名，如：七年级上册 苏科版\',')
lines.push("  grade VARCHAR(20) DEFAULT NULL COMMENT '年级，如：七年级上册 / 高一',")
lines.push('  sort_order INT NOT NULL DEFAULT 0,')
lines.push('  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,')
lines.push('  PRIMARY KEY (id),')
lines.push('  KEY idx_tb_subject (subject), KEY idx_tb_version (version)')
lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
lines.push('')
lines.push('CREATE TABLE IF NOT EXISTS resource_chapter (')
lines.push('  id BIGINT NOT NULL AUTO_INCREMENT,')
lines.push('  textbook_id BIGINT NOT NULL,')
lines.push("  name VARCHAR(100) NOT NULL COMMENT '章节名，如：第1章 有理数',")
lines.push("  chapter VARCHAR(50) DEFAULT NULL COMMENT '章节简称，如：有理数',")
lines.push('  sort_order INT NOT NULL DEFAULT 0,')
lines.push('  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,')
lines.push('  PRIMARY KEY (id),')
lines.push('  KEY idx_ch_tb (textbook_id)')
lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
lines.push('')
lines.push('CREATE TABLE IF NOT EXISTS resource_section (')
lines.push('  id BIGINT NOT NULL AUTO_INCREMENT,')
lines.push('  chapter_id BIGINT NOT NULL,')
lines.push("  name VARCHAR(100) NOT NULL COMMENT '小节名，如：1.1 正数与负数',")
lines.push('  sort_order INT NOT NULL DEFAULT 0,')
lines.push('  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,')
lines.push('  PRIMARY KEY (id),')
lines.push('  KEY idx_sec_ch (chapter_id)')
lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;')
lines.push('')

lines.push('-- ================= 教材 =================')
lines.push('INSERT INTO resource_textbook (id, subject, version, stage, name, grade, sort_order) VALUES')
textbooks.forEach((t, i) => {
  const comma = i === textbooks.length - 1 ? ';' : ','
  lines.push(`(${t.id}, '${t.subject}', '${t.version}', '${t.stage}', '${esc(t.name)}', '${esc(t.grade)}', ${t.sort})${comma}`)
})
lines.push('')

lines.push('-- ================= 章节 =================')
lines.push('INSERT INTO resource_chapter (id, textbook_id, name, chapter, sort_order) VALUES')
chapters.forEach((c, i) => {
  const comma = i === chapters.length - 1 ? ';' : ','
  lines.push(`(${c.id}, ${c.textbookId}, '${esc(c.name)}', '${esc(c.chapter)}', ${c.sort})${comma}`)
})
lines.push('')

lines.push('-- ================= 小节 =================')
if (sections.length) {
  lines.push('INSERT INTO resource_section (id, chapter_id, name, sort_order) VALUES')
  sections.forEach((s, i) => {
    const comma = i === sections.length - 1 ? ';' : ','
    lines.push(`(${s.id}, ${s.chapterId}, '${esc(s.name)}', ${s.sort})${comma}`)
  })
} else {
  lines.push('-- 无小节数据')
}
lines.push('')

// 重置自增
lines.push(`-- 重置自增（显式 id 之后）`)
lines.push(`ALTER TABLE resource_textbook AUTO_INCREMENT = ${textbooks.length + 1};`)
lines.push(`ALTER TABLE resource_chapter AUTO_INCREMENT = ${chapters.length + 1};`)
lines.push(`ALTER TABLE resource_section AUTO_INCREMENT = ${sections.length + 1};`)
lines.push('')

fs.writeFileSync(OUT, lines.join('\n'), 'utf8')

console.log(`✅ 已生成 ${path.relative(ROOT, OUT)}`)
console.log(`   教材 ${textbooks.length} · 章节 ${chapters.length} · 小节 ${sections.length}`)
const byVer = {}
for (const t of textbooks) byVer[t.version] = (byVer[t.version] || 0) + 1
console.log('   教材按版本：', byVer)
