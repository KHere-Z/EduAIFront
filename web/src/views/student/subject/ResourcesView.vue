<template>
  <div class="res-page">
    <router-link :to="subjectHome" class="res-back">← 返回学科中心</router-link>

    <div class="res-layout">
      <!-- ═══ 左侧树形目录（后端动态加载） ═══ -->
      <aside class="res-sidebar">
        <el-select v-model="stage" size="small" style="width:100%;margin-bottom:6px">
          <el-option label="小学" value="primary"/><el-option label="初中" value="junior"/><el-option label="高中" value="senior"/>
        </el-select>
        <el-select v-model="version" size="small" style="width:100%;margin-bottom:10px">
          <el-option v-for="v in versionOptions" :key="v.value" :label="v.label" :value="v.value"/>
        </el-select>
        <div class="rs-tree-title">📂 教材目录</div>
        <el-tree
          :key="treeKey"
          lazy
          :load="loadNode"
          :props="{ children:'children', label:'label', isLeaf:'isLeaf' }"
          node-key="id"
          highlight-current
          :expand-on-click-node="true"
          @node-click="onTreeClick"
          class="rs-tree"
        >
          <template #default="{ data }">
            <span class="rs-node">{{ data.label }}</span>
          </template>
        </el-tree>
      </aside>

      <!-- ═══ 右侧主内容 ═══ -->
      <main class="res-main">
        <!-- 定位面包屑 -->
        <div class="res-crumbs" v-if="currentLoc.length">
          <span v-for="(c, i) in currentLoc" :key="i">{{ c }}<span v-if="i < currentLoc.length - 1" class="res-crumb-sep"> / </span></span>
        </div>

        <!-- 筛选区 -->
        <div class="res-filter-bar">
          <div class="rfb-row">
            <span class="rfb-label">类型</span>
            <el-radio-group v-model="filterType" size="small" @change="loadResList()">
              <el-radio-button value="">不限</el-radio-button>
              <el-radio-button value="课件">课件</el-radio-button>
              <el-radio-button value="学案">学案</el-radio-button>
              <el-radio-button value="作业">作业</el-radio-button>
              <el-radio-button value="试卷">试卷</el-radio-button>
            </el-radio-group>
            <el-select v-model="filterYear" placeholder="年份" size="small" clearable style="width:100px;margin-left:12px" @change="loadResList()">
              <el-option v-for="y in yearOptions" :key="y" :label="y + ' 年'" :value="y"/>
            </el-select>
          </div>
        </div>

        <!-- 资源列表区 -->
        <div class="res-list-area">
          <div class="resl-toolbar">
            <span class="resl-total">共 {{ resTotal }} 个结果</span>
          </div>

          <div class="resl-list" v-if="resList.length">
            <div v-for="r in resList" :key="r.id" class="resl-item">
              <div class="resli-left">
                <span class="resli-icon">{{ (r.fileName||'').endsWith('.pdf')?'📕':'📝' }}</span>
                <div class="resli-info">
                  <span class="resli-title">{{ r.title || r.fileName }}</span>
                  <div class="resli-tags">
                    <el-tag size="small" :type="tagType(r.type || r.tag)" effect="plain">{{ r.type || r.tag || '资料' }}</el-tag>
                    <span class="resli-meta">{{ r.year ? r.year + ' 年 · ' : '' }}{{ fmtSize(r.fileSize) }}<span v-if="r.author"> · {{ r.author }}</span></span>
                    <el-tag size="small" type="warning" effect="plain" v-if="r.price != null">{{ r.price }} 资源点</el-tag>
                  </div>
                </div>
              </div>
              <div class="resli-right">
                <el-button size="small" @click="openPreview(r)">预览</el-button>
                <el-button size="small" type="primary" @click="downloadRes(r)">下载</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else :description="currentNode ? '本级暂无资源' : '请在左侧目录中选择节点查看资源'" :image-size="80"/>
          <div class="res-pagination" v-if="resTotal > pageSize">
            <el-pagination v-model:current-page="page" :page-size="pageSize" :total="resTotal" layout="total, prev, pager, next" background @current-change="fetchPage"/>
          </div>
        </div>
      </main>
    </div>

    <PreviewModal v-model="previewVisible" :resource="previewResource" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { usePointsStore } from '@/store/points'
import { listTextbooks, listChapters, listSections, listResources } from '@/utils/resourceService'
import { getResourceDownloadUrl } from '@/api/common/resources'
import PreviewModal from '@/components/PreviewModal.vue'

const route = useRoute()
const auth = useAuthStore()
const subject = computed(() => route.params.subject || 'math')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const subjectHome = computed(() => isTeacher.value ? `/teacher/subject/${subject.value}` : `/student/subject/${subject.value}`)

const stage = ref('junior')
const version = ref('') // 默认选第一个教材版本
const treeKey = computed(() => `${subject.value}-${stage.value}-${version.value}`)
const versionMap = { suke: '苏科版', renjiao: '人教版', bsd: '北师大版', zj: '浙教版', hk: '沪科版' }
const versionOptions = ref([])
async function loadVersions() {
  const list = await listTextbooks(subject.value)
  const keys = [...new Set((list || []).map(t => t.version).filter(Boolean))]
  versionOptions.value = keys.map(k => ({ value: k, label: versionMap[k] || k }))
  version.value = keys[0] || '' // 默认第一个教材版本
}
onMounted(loadVersions)
watch(subject, loadVersions)

const filterType = ref('')
const filterYear = ref('')
const yearOptions = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']

const resList = ref([])
const resTotal = ref(0)
const currentNode = ref(null)
const currentLoc = ref([])
const page = ref(1)
const pageSize = ref(20)

// el-tree 懒加载：教材 → 章节 → 小节
function loadNode(node, resolve) {
  if (node.level === 0) {
    listTextbooks(subject.value).then(list => {
      const filtered = (list || []).filter(t => t.stage === stage.value && t.version === version.value)
      resolve(filtered.map(t => ({ id: 'tb_' + t.id, textbookId: t.id, label: t.name })))
    }).catch(() => resolve([]))
  } else if (node.data && node.data.textbookId) {
    listChapters(node.data.textbookId).then(chs => {
      resolve((chs || []).map(c => ({ id: 'ch_' + c.id, chapterId: c.id, label: c.name })))
    }).catch(() => resolve([]))
  } else if (node.data && node.data.chapterId) {
    listSections(node.data.chapterId).then(secs => {
      resolve((secs || []).map(s => ({ id: 'sec_' + s.id, sectionId: s.id, label: s.name, isLeaf: true })))
    }).catch(() => resolve([]))
  } else {
    resolve([])
  }
}

function onTreeClick(data, node) {
  if (!data) return
  let type, id
  if (data.sectionId) { type = 'section'; id = data.sectionId }
  else if (data.chapterId) { type = 'chapter'; id = data.chapterId }
  else if (data.textbookId) { type = 'textbook'; id = data.textbookId }
  else return
  currentNode.value = { type, id }
  const crumbs = []
  let n = node
  while (n) {
    if (n.data && n.data.label) crumbs.unshift(n.data.label)
    n = n.parent
  }
  currentLoc.value = crumbs
  loadResList()
}

async function loadResList() {
  const node = currentNode.value
  if (!node) { resList.value = []; resTotal.value = 0; return }
  page.value = 1
  await fetchPage()
}

async function fetchPage() {
  const node = currentNode.value
  if (!node) { resList.value = []; resTotal.value = 0; return }
  const r = await listResources(node.type, node.id, {
    page: page.value, pageSize: pageSize.value,
    type: filterType.value || undefined,
    year: filterYear.value || undefined,
  })
  if (Array.isArray(r)) {
    resList.value = r
    resTotal.value = r.length
  } else {
    resList.value = r?.list ?? []
    resTotal.value = r?.total ?? resList.value.length
  }
}

function fmtSize(n) {
  if (!n && n !== 0) return '-'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}
function tagType(t) {
  return { 课件: 'primary', 学案: 'success', 作业: 'warning', 试卷: 'danger' }[t] || 'info'
}

// 预览
const previewVisible = ref(false)
const previewResource = ref(null)
function openPreview(r) {
  previewResource.value = r
  previewVisible.value = true
}

async function downloadRes(r) {
  if (r.data) { // localStorage 兜底 base64
    const a = document.createElement('a')
    a.href = r.data; a.download = r.fileName || r.title || '资源'; a.click()
    return
  }
  if (!r.id) return

  // 付费资源二次确认（上传者本人下载后端不扣费）
  if (r.price > 0) {
    try {
      await ElMessageBox.confirm(
        `下载《${r.fileName || r.title || '资源'}》将消耗 ${r.price} 资源点，确认下载？`,
        '付费下载',
        { type: 'warning', confirmButtonText: '确认下载', cancelButtonText: '取消' }
      )
    } catch (e) {
      return // 用户取消
    }
  }

  try {
    const res = await fetch(getResourceDownloadUrl(r.id), { headers: { Authorization: `Bearer ${auth.token}` } })
    const contentType = res.headers.get('content-type') || ''
    // 后端扣费失败/异常会返回 JSON 错误，而非文件流
    if (!res.ok || contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}))
      ElMessage.error(data.message || '下载失败')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = r.fileName || '资源'; a.click()
    URL.revokeObjectURL(url)
    usePointsStore().refresh() // 扣费后刷新余额
  } catch (e) {
    // 网络错误
  }
}
</script>

<style scoped>
.res-page{min-height:100vh;background:linear-gradient(160deg,#fff0f8,#fff6e6)}.res-back{display:inline-block;padding:12px 20px 0;font-size:13px;color:var(--color-primary);text-decoration:none}

.res-layout{display:flex;max-width:1200px;margin:12px auto 0;padding:0 16px 40px;gap:16px}

/* 侧边栏 */
.res-sidebar{width:220px;flex-shrink:0;background:rgba(255,255,255,.9);border-radius:12px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,.04);align-self:flex-start;position:sticky;top:12px}
.rs-tree-title{font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:8px}
.rs-tree{background:transparent}.rs-tree :deep(.el-tree-node__content){height:32px}
.rs-node{font-size:13px}

/* 主区域 */
.res-main{flex:1;min-width:0}
.res-crumbs{font-size:13px;color:var(--text-secondary);margin-bottom:8px;padding:0 4px}
.res-crumb-sep{color:var(--color-border-light)}

/* 筛选 */
.res-filter-bar{background:rgba(255,255,255,.9);border-radius:12px;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.rfb-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rfb-label{font-size:12px;color:var(--text-muted);flex-shrink:0;width:36px}

/* 列表 */
.res-list-area{background:rgba(255,255,255,.9);border-radius:12px;padding:14px 16px;box-shadow:0 1px 6px rgba(0,0,0,.04)}
.resl-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.res-pagination{display:flex;justify-content:flex-end;margin-top:14px}
.resl-total{font-size:12px;color:var(--text-muted)}

.resl-list{display:flex;flex-direction:column;gap:8px}
.resl-item{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;background:var(--color-bg);border:1px solid var(--color-border-light);transition:all .15s}
.resl-item:hover{border-color:var(--color-primary-light)}
.resli-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.resli-icon{font-size:22px;flex-shrink:0}
.resli-info{flex:1;min-width:0}
.resli-title{font-size:14px;color:var(--text-primary);font-weight:500;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.resli-tags{display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap}
.resli-meta{font-size:11px;color:var(--text-muted)}
.resli-right{flex-shrink:0;margin-left:12px}

/* 移动端适配：侧边栏堆叠到顶部，列表项换行 */
@media (max-width: 768px) {
  .res-layout{flex-direction:column;padding:0 10px 40px;gap:10px}
  .res-sidebar{width:100%;position:static;padding:12px}
  .resl-item{flex-wrap:wrap}
  .resli-right{margin-left:0;margin-top:8px}
}
</style>
