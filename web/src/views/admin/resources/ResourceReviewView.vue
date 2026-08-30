<template>
  <div class="rrv-page">
    <div class="rrv-head">
      <div>
        <h2>📋 学习资源审核</h2>
        <p>老师上传的资源经审核通过后，才会在学习资源中正常显示</p>
      </div>
      <el-tag v-if="list.length" type="warning" size="large">{{ list.length }} 条待审核</el-tag>
    </div>

    <div class="rrv-body" v-loading="loading">
      <template v-if="list.length">
        <div v-for="r in list" :key="r.id" class="rrv-card">
          <div class="rrvc-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="1.5" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="rrvc-info">
            <div class="rrvc-name">{{ r.fileName }}</div>
            <div class="rrvc-meta">
              <el-tag size="small" effect="plain">{{ r.tag || '-' }}</el-tag>
              <span>{{ r.year ? r.year + ' 年' : '' }}</span>
              <span>上传：{{ r.uploaderName || r.uploaderId || '-' }}</span>
              <span>{{ (r.createdAt || '').slice(0, 16).replace('T', ' ') }}</span>
              <span v-if="r.subject" class="rrvc-subj">{{ subjLabel(r.subject) }}</span>
            </div>
          </div>
          <div class="rrvc-price">
            <span class="rrvc-price-label">资源点</span>
            <span class="rrvc-price-num">{{ r.price ?? 0 }}</span>
          </div>
          <div class="rrvc-actions">
            <el-button size="small" @click="openPreview(r)">👁 预览</el-button>
            <el-button size="small" type="success" @click="openApprove(r)">✓ 通过</el-button>
            <el-button size="small" type="danger" plain @click="openReject(r)">✗ 驳回</el-button>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无待审核资源" :image-size="80" />
    </div>

    <!-- 通过（可改价） -->
    <el-dialog v-model="approveVisible" title="审核通过" width="420px">
      <div class="rrv-dlg-row">
        <span class="rrv-dlg-label">资源</span>
        <span class="rrv-dlg-name">{{ current?.fileName }}</span>
      </div>
      <div class="rrv-dlg-row">
        <span class="rrv-dlg-label">资源点定价</span>
        <el-input-number v-model="approvePrice" :min="0" :step="1" size="small" />
      </div>
      <div class="rrv-dlg-tip">通过后资源将按上方定价在学习资源中显示；不改则维持原价。</div>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="success" :loading="submitting" @click="doApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 驳回 -->
    <el-dialog v-model="rejectVisible" title="驳回资源" width="420px">
      <div class="rrv-dlg-row">
        <span class="rrv-dlg-label">资源</span>
        <span class="rrv-dlg-name">{{ current?.fileName }}</span>
      </div>
      <div class="rrv-dlg-row" style="align-items:flex-start">
        <span class="rrv-dlg-label">驳回理由</span>
        <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回理由（必填）" />
      </div>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" :disabled="!rejectReason.trim()" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <PreviewModal v-model="previewVisible" :resource="previewResource" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingResources, reviewResource } from '@/api/common/resources'
import PreviewModal from '@/components/PreviewModal.vue'

const list = ref([])
const loading = ref(false)
const submitting = ref(false)

const approveVisible = ref(false)
const rejectVisible = ref(false)
const current = ref(null)
const approvePrice = ref(0)
const rejectReason = ref('')

const previewVisible = ref(false)
const previewResource = ref(null)

const subjMap = { math: '数学', chinese: '语文', english: '英语', physics: '物理', chemistry: '化学', biology: '生物', history: '历史', politics: '政治', geography: '地理' }
function subjLabel(s) { return subjMap[s] || s || '' }

async function load() {
  loading.value = true
  try {
    const r = await getPendingResources()
    list.value = r?.data ?? r ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openPreview(r) {
  previewResource.value = r
  previewVisible.value = true
}

function openApprove(r) {
  current.value = r
  approvePrice.value = r.price ?? 0
  rejectReason.value = ''
  approveVisible.value = true
}

function openReject(r) {
  current.value = r
  rejectReason.value = ''
  rejectVisible.value = true
}

async function doApprove() {
  if (!current.value) return
  submitting.value = true
  try {
    await reviewResource(current.value.id, { approved: true, price: approvePrice.value })
    ElMessage.success('已通过审核')
    approveVisible.value = false
    load()
  } catch {
    load() // 重复审核等失败时刷新列表（错误提示由拦截器统一弹出）
  } finally {
    submitting.value = false
  }
}

async function doReject() {
  if (!current.value || !rejectReason.value.trim()) return
  submitting.value = true
  try {
    await reviewResource(current.value.id, { approved: false, reason: rejectReason.value.trim() })
    ElMessage.success('已驳回')
    rejectVisible.value = false
    load()
  } catch {
    load()
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.rrv-page { max-width: 900px; margin: 0 auto; padding: 24px 16px 48px; }
.rrv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.rrv-head h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.rrv-head p { font-size: 13px; color: var(--text-muted); }

.rrv-body { min-height: 200px; display: flex; flex-direction: column; gap: 10px; }
.rrv-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: #fff; border-radius: 12px; border: 1px solid var(--color-border-light); box-shadow: 0 1px 3px rgba(0,0,0,.02); }
.rrv-card:hover { border-color: var(--color-primary-light); }
.rrvc-icon { flex-shrink: 0; }
.rrvc-info { flex: 1; min-width: 0; }
.rrvc-name { font-size: 14px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rrvc-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; }
.rrvc-subj { color: var(--color-primary); }
.rrvc-price { text-align: center; min-width: 60px; }
.rrvc-price-label { display: block; font-size: 11px; color: var(--text-muted); }
.rrvc-price-num { font-size: 18px; font-weight: 700; color: #6366F1; }
.rrvc-actions { display: flex; gap: 6px; flex-shrink: 0; }

.rrv-dlg-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.rrv-dlg-label { width: 72px; font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.rrv-dlg-name { font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rrv-dlg-tip { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
</style>
