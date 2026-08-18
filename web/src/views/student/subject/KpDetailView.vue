<template>
  <div class="kd-page">
    <router-link :to="`/student/subject/${subject}/knowledge-points`" class="kd-back">← 返回知识点</router-link>

    <div class="kd-hero">
      <h2>{{ kp?.name || '知识点' }}</h2>
      <p>{{ kp?.gradeLevel || '' }} · {{ resList.length }} 份资料</p>
    </div>

    <div class="kd-list" v-if="resList.length">
      <div v-for="r in resList" :key="r.id" class="kd-item">
        <div class="kdi-left">
          <div class="kdi-icon" :class="r.fileName?.endsWith('.pdf')?'pdf':'doc'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="kdi-info">
            <span class="kdi-name">{{ r.fileName }}</span>
            <span class="kdi-meta">
              <el-tag size="small" :type="r.tag==='学案'?'success':r.tag==='讲义'?'primary':r.tag==='习题'?'warning':'danger'" effect="plain">{{ r.tag }}</el-tag>
              <span>{{ formatSize(r.fileSize) }}</span>
            </span>
          </div>
        </div>
        <el-button size="small" type="primary" plain @click="downloadRes(r)">下载</el-button>
      </div>
    </div>

    <div class="kd-empty" v-else>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>暂无讲义资源</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { getKnowledgePoints, getKpResources } from '@/api/common/knowledge'

const route = useRoute()
const auth = useAuthStore()
const kpId = +route.params.kpId
const subject = computed(() => route.params.subject || 'math')
const kp = ref(null)
const resList = ref([])

async function loadData() {
  try { const r = await getKnowledgePoints({ subject: subject.value, pageSize: 500 }); kp.value = (r?.list||[]).find(k => k.id === kpId) || null } catch {}
  try { resList.value = await getKpResources(kpId) || [] } catch {}
}

async function downloadRes(r) {
  const token = auth.token
  const res = await fetch(`/api/v1/knowledge-points/resources/${r.id}/download`, { headers:{ Authorization:`Bearer ${token}` } })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = r.fileName; a.click()
  URL.revokeObjectURL(url)
}

function formatSize(bytes) { if (!bytes) return ''; if (bytes < 1024) return bytes + 'B'; if (bytes < 1024*1024) return (bytes/1024).toFixed(1)+'KB'; return (bytes/(1024*1024)).toFixed(1)+'MB' }

onMounted(loadData)
</script>

<style scoped>
.kd-page{max-width:600px;margin:0 auto;padding:24px 16px 48px}
.kd-back{display:inline-block;font-size:13px;color:var(--color-primary);margin-bottom:20px;text-decoration:none}
.kd-hero{margin-bottom:20px}.kd-hero h2{font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:4px}.kd-hero p{font-size:13px;color:var(--text-muted)}

.kd-list{display:flex;flex-direction:column;gap:8px}
.kd-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-radius:12px;border:1px solid var(--color-border-light);transition:all .15s}
.kd-item:hover{border-color:var(--color-primary-light)}
.kdi-left{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.kdi-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.kdi-icon.pdf{background:#FEF2F2;color:#EF4444}.kdi-icon.doc{background:#EEF2FF;color:#6366F1}
.kdi-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.kdi-name{font-size:14px;color:var(--text-primary);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kdi-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text-muted)}

.kd-empty{text-align:center;padding:60px 20px;color:var(--text-muted)}.kd-empty p{font-size:14px;margin-top:12px}
</style>
