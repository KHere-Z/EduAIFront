<template>
  <div class="tm-page">
    <div class="tm-head">
      <div>
        <h2>🔔 消息中心</h2>
        <p>接收资源审核结果等系统通知</p>
      </div>
      <el-button v-if="list.length" size="small" text type="primary" @click="markAll">全部标记已读</el-button>
    </div>

    <div class="tm-body" v-loading="loading">
      <template v-if="list.length">
        <div
          v-for="m in list"
          :key="m.id"
          class="tm-item"
          :class="{ 'is-unread': !m.read }"
          @click="readOne(m)"
        >
          <span class="tm-dot" v-if="!m.read"></span>
          <div class="tm-content">
            <div class="tm-title">{{ m.title }}</div>
            <div class="tm-text">{{ m.content }}</div>
            <div class="tm-time">{{ (m.createdAt || '').slice(0, 16).replace('T', ' ') }}</div>
          </div>
          <el-tag v-if="m.type === 'RESOURCE_REVIEW'" size="small" type="info" effect="plain">资源审核</el-tag>
          <el-button class="tm-del" size="small" text type="danger" title="删除" @click.stop="deleteOne(m)">✕</el-button>
        </div>
      </template>
      <el-empty v-else description="暂无消息" :image-size="80" />
    </div>

    <div class="tm-pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMessages, markMessageRead, markAllMessagesRead, deleteMessage } from '@/api/common/messages'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function load() {
  loading.value = true
  try {
    const r = await getMessages({ page: page.value, pageSize: pageSize.value })
    const d = r?.data ?? r
    list.value = d?.list ?? d?.records ?? []
    total.value = d?.total ?? 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function readOne(m) {
  if (m.read) return
  try {
    await markMessageRead(m.id)
    m.read = true
  } catch {}
}

async function markAll() {
  try {
    await markAllMessagesRead()
    list.value.forEach(m => (m.read = true))
    ElMessage.success('已全部标记已读')
  } catch {}
}

async function deleteOne(m) {
  try {
    await deleteMessage(m.id)
    list.value = list.value.filter(x => x.id !== m.id)
    if (total.value > 0) total.value--
  } catch {}
}

onMounted(load)
</script>

<style scoped>
.tm-page { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
.tm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.tm-head h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.tm-head p { font-size: 13px; color: var(--text-muted); }

.tm-body { display: flex; flex-direction: column; gap: 10px; min-height: 200px; }
.tm-item { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: #fff; border-radius: 12px; border: 1px solid var(--color-border-light); cursor: pointer; transition: all .15s; }
.tm-item:hover { border-color: var(--color-primary-light); }
.tm-item.is-unread { background: var(--color-primary-bg); border-color: var(--color-primary-light); }
.tm-dot { width: 8px; height: 8px; border-radius: 50%; background: #EF4444; flex-shrink: 0; margin-top: 6px; }
.tm-content { flex: 1; min-width: 0; }
.tm-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.tm-text { font-size: 13px; color: var(--text-secondary); margin-top: 4px; line-height: 1.6; }
.tm-time { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
.tm-del { flex-shrink: 0; font-size: 15px; color: var(--text-muted); }
.tm-del:hover { color: #EF4444; }

.tm-pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>
