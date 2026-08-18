<template>
  <div class="kpr-page">
    <div class="kpr-hero">
      <el-button text class="kpr-back" @click="$router.back()">← 返回</el-button>
      <h2>{{ kpName }}</h2>
      <p>知识点资源管理 · 讲义 · 学案 · 习题 · 试卷</p>
      <span class="kpr-count">{{ resList.length }} 个资源</span>
    </div>

    <div class="kpr-body">
      <div class="kpr-upload-area">
        <el-select v-model="resTag" size="small" style="width:100px">
          <el-option label="学案" value="学案"/><el-option label="讲义" value="讲义"/>
          <el-option label="习题" value="习题"/><el-option label="试卷" value="试卷"/>
        </el-select>
        <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="onUpload" accept=".pdf,.doc,.docx" class="kpr-upload-btn">
          <el-button type="primary" size="small" round>📁 上传文件</el-button>
        </el-upload>
        <span class="kpr-hint">支持 PDF、DOC、DOCX</span>
      </div>

      <div class="kpr-grid" v-if="resList.length">
        <div v-for="r in resList" :key="r.id" class="kpr-card-item">
          <div class="kpci-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" :stroke="r.tag==='讲义'?'#6366F1':r.tag==='学案'?'#10B981':r.tag==='习题'?'#F59E0B':'#EF4444'" stroke-width="1.5" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="kpci-info">
            <span class="kpci-name">{{ r.fileName }}</span>
            <span class="kpci-meta">{{ r.tag }} · {{ formatSize(r.fileSize) }}</span>
          </div>
          <el-tag :type="isOwnRes(r) ? 'success' : 'info'" size="small" effect="plain">{{ isOwnRes(r) ? '我上传' : '同事' }}</el-tag>
          <el-button v-if="isOwnRes(r)" size="small" text type="danger" @click="delRes(r.id)">🗑</el-button>
        </div>
      </div>

      <div class="kpr-empty" v-else>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1" stroke-linecap="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>暂无资源，上传讲义、学案或习题</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getKnowledgePoints, getKpResources, uploadKpResource, deleteKpResource } from '@/api/common/knowledge'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const auth = useAuthStore()
const kpId = +route.params.kpId
const kpName = ref('')
const resTag = ref('讲义')
const resList = ref([])
const myUid = computed(() => String(auth.user?.uid ?? auth.user?.id ?? '').padStart(8, '0'))
// 资源对象返回 teacherId（上传者 8 位 uid）：自己上传的可删，同事上传的只读
function isOwnRes(r) {
  if (r.teacherId == null) return false
  return String(r.teacherId).padStart(8, '0') === myUid.value
}

async function loadRes() {
  try { resList.value = await getKpResources(kpId) || [] } catch { resList.value = [] }
}

async function onUpload(file) {
  const fd = new FormData(); fd.append('file', file.raw); fd.append('tag', resTag.value)
  try { await uploadKpResource(kpId, fd); ElMessage.success('上传成功'); loadRes() } catch { ElMessage.error('上传失败') }
}

async function delRes(id) {
  try { await deleteKpResource(id); resList.value = resList.value.filter(r => r.id !== id) } catch {}
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

onMounted(async () => {
  try {
    const r = await getKnowledgePoints({ subject:'math', pageSize:500 })
    kpName.value = (r?.list||[]).find(k => k.id === kpId)?.name || ''
  } catch {}
  loadRes()
})
</script>

<style scoped>
.kpr-page{min-height:100vh;background:var(--color-bg);display:flex;flex-direction:column}

.kpr-hero{text-align:center;padding:48px 20px 32px;background:#fff;border-bottom:1px solid var(--color-border);position:relative}
.kpr-back{position:absolute;left:20px;top:20px}
.kpr-hero h2{font-size:26px;font-weight:800;color:var(--text-primary);margin-bottom:4px}
.kpr-hero p{font-size:13px;color:var(--text-muted);margin-bottom:12px}
.kpr-count{display:inline-block;padding:2px 14px;border-radius:12px;background:var(--color-primary-bg);color:var(--color-primary);font-size:12px;font-weight:600}

.kpr-body{flex:1;max-width:720px;margin:0 auto;padding:24px 20px 60px;width:100%}

.kpr-upload-area{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding:16px 20px;background:#fff;border-radius:14px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.kpr-hint{font-size:12px;color:var(--text-muted);margin-left:auto}

.kpr-grid{display:flex;flex-direction:column;gap:8px}
.kpr-card-item{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-radius:12px;border:1px solid var(--color-border-light);transition:all .15s;box-shadow:0 1px 3px rgba(0,0,0,.02)}
.kpr-card-item:hover{border-color:var(--color-primary-light);box-shadow:0 2px 8px rgba(99,102,241,.06)}
.kpci-icon{flex-shrink:0}
.kpci-info{flex:1;min-width:0;display:flex;flex-direction:column}
.kpci-name{font-size:14px;color:var(--text-primary);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kpci-meta{font-size:12px;color:var(--text-muted);margin-top:2px}

.kpr-empty{text-align:center;padding:60px 20px;color:var(--text-muted)}
.kpr-empty p{font-size:13px;margin-top:12px}
</style>
