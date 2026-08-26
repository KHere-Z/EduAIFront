<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="title"
    width="92%"
    :close-on-click-modal="false"
    class="pv-dialog"
  >
    <div class="pv-body" v-loading="loading">
      <!-- PDF 逐页预览 -->
      <template v-if="mode === 'pdf'">
        <div class="pv-pages">
          <img v-for="(src, i) in pages" :key="i" :src="src" class="pv-page" alt="预览页" />
        </div>
        <div v-if="pages.length" class="pv-meta">共 {{ pages.length }} 页</div>
      </template>

      <!-- 图片预览 -->
      <img v-else-if="mode === 'image'" :src="imageUrl" class="pv-image" alt="预览图" />

      <!-- 无可预览内容 -->
      <div v-else-if="mode === 'none'" class="pv-none">🙈 该资源暂无预览</div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { getResourcePreview } from '@/api/common/resources'
// pdf.js：本地依赖，不走外网 CDN
import * as pdfjsImport from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
const pdfjsLib = pdfjsImport.getDocument ? pdfjsImport : (pdfjsImport.default || pdfjsImport)

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  resource: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const auth = useAuthStore()
const loading = ref(false)
const mode = ref(null) // 'pdf' | 'image' | 'none' | null
const pages = ref([])
const imageUrl = ref('')
const title = computed(() => props.resource?.title || props.resource?.fileName || '资源预览')

watch(
  () => props.modelValue,
  (v) => { if (v) load() },
)

function reset() {
  mode.value = null
  pages.value = []
  if (imageUrl.value) { URL.revokeObjectURL(imageUrl.value); imageUrl.value = '' }
}

// 带鉴权头 fetch（预览文件接口需要登录态）
async function authFetch(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
  if (!res.ok) throw new Error('预览加载失败')
  return res
}

async function load() {
  reset()
  loading.value = true
  try {
    const r = props.resource

    // —— 后端 preview 接口优先 ——
    if (r?.id) {
      const meta = await getResourcePreview(r.id)
      if (meta?.type === 'pdf') {
        await renderPdfBuffer(await (await authFetch(meta.url)).arrayBuffer())
        loading.value = false
        return
      }
      if (meta?.type === 'image') {
        const blob = await (await authFetch(meta.url)).blob()
        imageUrl.value = URL.createObjectURL(blob)
        mode.value = 'image'
        loading.value = false
        return
      }
      mode.value = 'none'
      loading.value = false
      return
    }

    // —— localStorage 兜底：base64 直读（后端未就绪时仍可预览）——
    if (r?.data) {
      if (r.data.startsWith('data:application/pdf')) {
        const bin = base64ToArrayBuffer(r.data.split(',')[1])
        await renderPdfBuffer(bin)
      } else if (r.data.startsWith('data:image/')) {
        imageUrl.value = r.data
        mode.value = 'image'
      } else {
        mode.value = 'none'
      }
      loading.value = false
      return
    }

    mode.value = 'none'
  } catch {
    mode.value = 'none'
  } finally {
    loading.value = false
  }
}

function base64ToArrayBuffer(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

async function renderPdfBuffer(buffer) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const out = []
  const scale = 2.0
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const vp = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = vp.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    out.push(canvas.toDataURL())
  }
  pages.value = out
  mode.value = 'pdf'
}
</script>

<style scoped>
.pv-body{min-height:200px;max-height:82vh;overflow:auto}
.pv-pages{display:flex;flex-direction:column;gap:12px;align-items:center}
.pv-page{width:100%;box-shadow:0 1px 8px rgba(0,0,0,.12);border-radius:4px;display:block}
.pv-meta{text-align:center;font-size:12px;color:var(--text-muted);margin-top:10px}
.pv-image{max-width:100%;display:block;margin:0 auto;border-radius:4px}
.pv-none{text-align:center;color:var(--text-muted);font-size:14px;padding:40px 0}
</style>
