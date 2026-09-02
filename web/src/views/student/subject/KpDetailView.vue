<template>
  <div class="kd-page">
    <router-link :to="`/student/subject/${subject}/knowledge-points`" class="kd-back">← 返回知识点</router-link>

    <div class="kd-hero">
      <h2>{{ kp?.name || '知识点' }}</h2>
      <p>{{ kp?.gradeLevel || '' }}</p>
    </div>

    <div class="kd-desc" v-if="kp?.description">
      <div class="kd-desc-title">📖 知识点描述</div>
      <div class="kd-desc-body">{{ kp.description }}</div>
    </div>
    <div class="kd-empty" v-else>
      <p>暂无知识点描述</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getKnowledgePoints } from '@/api/common/knowledge'

const route = useRoute()
const kpId = +route.params.kpId
const subject = computed(() => route.params.subject || 'math')
const kp = ref(null)

async function loadData() {
  try { const r = await getKnowledgePoints({ subject: subject.value, pageSize: 500 }); kp.value = (r?.list || []).find(k => k.id === kpId) || null } catch {}
}

onMounted(loadData)
</script>

<style scoped>
.kd-page{max-width:600px;margin:0 auto;padding:24px 16px 48px}
.kd-back{display:inline-block;font-size:13px;color:var(--color-primary);margin-bottom:20px;text-decoration:none}
.kd-hero{margin-bottom:20px}.kd-hero h2{font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:4px}.kd-hero p{font-size:13px;color:var(--text-muted)}

.kd-desc{background:#fff;border-radius:12px;padding:16px;border:1px solid var(--color-border-light)}
.kd-desc-title{font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:8px}
.kd-desc-body{font-size:14px;line-height:1.8;color:var(--text-secondary);white-space:pre-wrap;word-break:break-word}

.kd-empty{text-align:center;padding:60px 20px;color:var(--text-muted)}.kd-empty p{font-size:14px;margin-top:12px}
</style>
