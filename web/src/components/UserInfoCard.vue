<template>
  <div class="uic">
    <div class="uic-top">
      <span class="uic-avatar" :style="{ background: color }">
        <img v-if="info?.avatar" :src="info.avatar" class="uic-img" alt="" />
        <template v-else>{{ initial }}</template>
      </span>
      <div class="uic-meta">
        <div class="uic-name">{{ displayName }}</div>
        <div class="uic-sub">{{ roleLabel }} · UID {{ String(info?.uid ?? uid ?? '').padStart(8, '0') }}</div>
      </div>
    </div>

    <div v-if="loading" class="uic-hint">加载中…</div>

    <template v-else-if="info">
      <div v-if="info.bio" class="uic-bio">{{ info.bio }}</div>
      <div v-if="subjects.length" class="uic-subjects">
        <span class="uic-label">学科</span>
        <el-tag v-for="s in subjects" :key="s" size="small" type="primary" effect="plain" style="margin:2px">{{ s }}</el-tag>
      </div>
      <div v-if="!info.bio && !subjects.length" class="uic-hint">暂无更多信息</div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  info: { type: Object, default: null },      // 已加载的用户信息（null=未加载/加载失败）
  name: { type: String, default: '' },        // 姓名兜底
  uid: { type: [String, Number], default: '' }, // UID 兜底显示
  loading: { type: Boolean, default: false },
})

const displayName = computed(() => props.info?.name || props.name || '用户')
const initial = computed(() => displayName.value[0] || '?')
const color = computed(() => hashColor(displayName.value))
const roleLabel = computed(() => {
  const r = props.info?.role
  if (r === 'teacher') return '老师'
  if (r === 'student') return '学生'
  return '用户'
})
const subjects = computed(() => props.info?.subjects || [])

function hashColor(s) { const h = (s || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0); return `hsl(${h % 360}, 50%, 60%)` }
</script>

<style scoped>
.uic-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.uic-avatar { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; }
.uic-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.uic-meta { flex: 1; min-width: 0; }
.uic-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.uic-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.uic-bio { font-size: 13px; line-height: 1.7; color: var(--text-secondary); white-space: pre-wrap; }
.uic-subjects { margin-top: 4px; }
.uic-label { font-size: 12px; color: var(--text-muted); margin-right: 4px; }
.uic-hint { font-size: 13px; color: var(--text-muted); }
</style>
