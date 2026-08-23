<template>
  <el-popover placement="right" :width="300" trigger="click" :show-arrow="false" popper-class="up-pop">
    <template #reference>
      <span class="up-ref" :title="'查看 ' + displayName">
        <span class="up-avatar" :style="{ background: color }">
          <img v-if="info?.avatar" :src="info.avatar" class="up-img" alt="" />
          <template v-else>{{ initial }}</template>
        </span>
        <span class="up-name">{{ displayName }}</span>
      </span>
    </template>

    <UserInfoCard :info="info" :name="name" :uid="uid" :loading="loading" />
  </el-popover>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '@/api/request'
import UserInfoCard from '@/components/UserInfoCard.vue'

const props = defineProps({
  uid: { type: [String, Number], default: '' },
  name: { type: String, default: '' },
})

const info = ref(null)
const loading = ref(false)

const displayName = computed(() => info.value?.name || props.name || '用户')
const initial = computed(() => displayName.value[0] || '?')
const color = computed(() => hashColor(displayName.value))

function hashColor(s) { const h = (s || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0); return `hsl(${h % 360}, 50%, 60%)` }

async function load() {
  if (info.value || loading.value || !props.uid) return
  loading.value = true
  try {
    info.value = await http.get(`/users/${props.uid}`)
  } catch { /* 加载失败时保留初始首字母展示 */ }
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.up-ref { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer; }
.up-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; }
.up-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.up-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; color: var(--text-primary); }
</style>
