<template>
  <div class="hist-page">
    <router-link :to="backLink" class="back-link">← 返回 AI 动图</router-link>

    <div class="hist-hero">
      <h2>📚 我的 AI 动图</h2>
      <p>历史生成的几何动图，点击卡片重新查看</p>
    </div>

    <div v-if="loading" class="loading">加载中…</div>
    <el-empty v-else-if="!list.length" description="暂无历史记录，去生成一个吧" :image-size="80"/>

    <template v-else>
      <div class="card-grid">
        <div v-for="item in list" :key="item.id" class="h-card" @click="open(item)">
          <div class="hc-cover">
            <img v-if="item.coverUrl || item.coverImage" :src="item.coverUrl || item.coverImage" class="cover-img" alt="封面" />
            <div v-else class="cover-empty">📐</div>
            <button class="hc-del" title="删除" @click.stop="del(item)">🗑</button>
          </div>
          <div class="hc-body">
            <div class="hc-title">{{ item.title || '未命名动图' }}</div>
            <div class="hc-tags" v-if="item.knowledgeTags?.length">
              <span v-for="(t, i) in item.knowledgeTags" :key="t" class="k-tag" :class="'k-tag-' + (i % 5)">{{ t }}</span>
            </div>
            <div class="hc-meta">
              <span>{{ item.grade }} · {{ item.subject }}</span>
              <span class="hc-time">{{ item.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > pageSize" class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="load"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAnimationHistory, deleteAnimation } from '@/api/common/ai'

const route = useRoute()
const router = useRouter()
const subject = computed(() => route.params.subject || 'math')
const SUBJECT_ZH = { math:'数学', chinese:'语文', english:'英语', physics:'物理', chemistry:'化学', biology:'生物', history:'历史', politics:'政治', geography:'地理' }
// 保存历史时 subject 存的是中文（如「数学」），查询须用中文对齐，否则后端按 subject 过滤查不到
const subjectZh = computed(() => SUBJECT_ZH[subject.value] || '数学')
const isTeacher = computed(() => route.path.startsWith('/teacher'))
const backLink = computed(() => (isTeacher.value ? '/teacher/subject/math/ai-animation' : `/student/subject/${subject.value}/ai-animation`))

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 9
const total = ref(0)

function safeTags(t) {
  if (!t) return []
  if (Array.isArray(t)) return t
  if (typeof t === 'string') { try { const p = JSON.parse(t); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

async function load() {
  loading.value = true
  try {
    const res = await getAnimationHistory({ subject: subjectZh.value, page: page.value, pageSize })
    const arr = Array.isArray(res) ? res : (res?.list || res?.records || [])
    total.value = Number(res?.total ?? arr.length)
    list.value = arr.map((it) => ({ ...it, knowledgeTags: safeTags(it.knowledgeTags) }))
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}

function open(item) {
  const base = isTeacher.value ? '/teacher/subject/math/ai-animation' : `/student/subject/${subject.value}/ai-animation`
  router.push({ path: base, query: { id: item.id } })
}

async function del(item) {
  try {
    await ElMessageBox.confirm('确认删除这条动图记录？', '删除', { type: 'warning' })
    await deleteAnimation(item.id)
    ElMessage.success('已删除')
    // 删除后若当前页空了，回退一页
    if (list.value.length === 1 && page.value > 1) page.value -= 1
    load()
  } catch (e) { if (e !== 'cancel') ElMessage.error(e.message || '删除失败') }
}

onMounted(load)
</script>

<style scoped>
.hist-page { max-width: 960px; margin: 0 auto; padding: 12px 14px 40px; }
.back-link { display: inline-block; color: var(--color-primary); font-size: 13px; margin-bottom: 8px; text-decoration: none; }
.hist-hero { text-align: center; padding: 12px 0 20px; }
.hist-hero h2 { font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }
.hist-hero p { font-size: 13px; color: var(--text-muted); }
.loading { text-align: center; color: var(--text-muted); padding: 40px 0; }

/* 三行三列，固定卡片 */
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.h-card { background: #fff; border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden; cursor: pointer; transition: all .15s; box-shadow: 0 1px 4px rgba(0,0,0,.03); display: flex; flex-direction: column; }
.h-card:hover { box-shadow: var(--shadow-sm); border-color: var(--color-primary-light); transform: translateY(-2px); }

.hc-cover { position: relative; height: 150px; background: var(--color-bg); overflow: hidden; flex-shrink: 0; }
.cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cover-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 42px; color: var(--text-muted); }
.hc-del { position: absolute; top: 8px; right: 8px; border: none; background: rgba(0,0,0,.45); color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 13px; line-height: 1; opacity: 0; transition: opacity .15s; }
.h-card:hover .hc-del { opacity: 1; }
.hc-del:hover { background: rgba(220,38,38,.8); }

.hc-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.hc-title { font-size: 14px; font-weight: 700; color: var(--text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px; }
.hc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.hc-meta { display: flex; justify-content: space-between; align-items: center; margin-top: auto; font-size: 12px; color: var(--text-muted); }

.k-tag { font-size: 12px; padding: 3px 10px; border-radius: 12px; font-weight: 500; }
.k-tag-0 { background: #eef2ff; color: #4f46e5; }
.k-tag-1 { background: #fef3c7; color: #b45309; }
.k-tag-2 { background: #dcfce7; color: #15803d; }
.k-tag-3 { background: #fee2e2; color: #b91c1c; }
.k-tag-4 { background: #e0f2fe; color: #0369a1; }

.pager { display: flex; justify-content: center; margin-top: 24px; }

@media (max-width: 720px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
