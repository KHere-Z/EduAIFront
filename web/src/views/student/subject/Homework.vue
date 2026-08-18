<template>
  <div class="hw-page">
    <router-link :to="`/student/subject/${subject}`" class="back-link">← 返回学科中心</router-link>
    <div class="hw-hero"><div class="hw-emoji">✏️</div><h2>课后作业</h2><p>老师布置 · 拍照上传 · 查看批改</p></div>

    <div v-if="homeworks.length" class="hw-list">
      <div class="hw-card" v-for="h in homeworks" :key="h.id" :class="subStat(h)">
        <div class="hw-header">
          <div><h4>{{ h.title }}</h4><p class="hw-desc">{{ h.description||'暂无描述' }}</p></div>
          <el-tag :type="subStat(h)==='corrected'?'success':subStat(h)==='submitted'?'warning':'info'" size="small">
            {{ subStat(h)==='corrected'?'✅ 已批改':subStat(h)==='submitted'?'⏳ 待批改':'📝 未提交' }}
          </el-tag>
        </div>
        <div class="hw-body">
          <!-- 未提交 / 待批改编辑中：上传多图 -->
          <div v-if="subStat(h)==='pending'||h._editing">
            <div class="hw-imgs">
              <div v-for="(img,i) in (h._uploadImgs||[])" :key="i" class="hw-img-item" @click="preview=img.url;showPreview=true">
                <img :src="img.url"/><span class="hw-img-del" @click.stop="h._uploadImgs.splice(i,1);h._uploadFiles.splice(i,1)">✕</span>
              </div>
              <div class="hw-img-add" @click="triggerUp(h)"><span>+</span><p>添加</p><input :ref="el=>h._input=el" type="file" accept="image/*" multiple hidden @change="onUpload(h,$event)"/></div>
            </div>
            <div class="hw-actions">
              <el-button size="small" type="primary" @click="submitWork(h)">✅ 提交</el-button>
              <el-button size="small" @click="h._uploadImgs=[];h._uploadFiles=[];h._editing=false">取消</el-button>
            </div>
          </div>
          <!-- 已提交/已批改：查看图片 -->
          <div v-if="subStat(h)!=='pending'&&!h._editing" class="hw-view">
            <!-- 我的作业 -->
            <div class="hw-section" v-if="(h.submittedImages||[]).length||h.submittedImageUrl">
              <div class="hw-section-label">📤 我的作业</div>
              <div class="hw-imgs">
                <div v-for="(img,i) in (h.submittedImages||(h.submittedImageUrl?[{url:h.submittedImageUrl}]:[]))" :key="i" class="hw-img-item" @click="preview=imgUrl(img.url||img);showPreview=true">
                  <img :src="imgUrl(img.url||img)"/>
                </div>
              </div>
              <el-button v-if="subStat(h)==='submitted'" size="small" text type="warning" class="hw-modify-btn" @click="startEdit(h)">✏️ 修改</el-button>
            </div>
            <!-- 老师批改 -->
            <div class="hw-section" v-if="(h.correctedImages||[]).length||h.correctedImageUrl">
              <div class="hw-section-label">✏️ 老师批改</div>
              <div class="hw-imgs">
                <div v-for="(img,i) in (h.correctedImages||(h.correctedImageUrl?[{url:h.correctedImageUrl}]:[]))" :key="i" class="hw-img-item" @click="preview=imgUrl(img.url||img);showPreview=true">
                  <img :src="imgUrl(img.url||img)"/>
                </div>
              </div>
            </div>
            <!-- 答案解析 -->
            <div class="hw-section" v-if="h.answerImages.length">
              <div class="hw-section-label">📖 答案解析</div>
              <div class="hw-imgs">
                <div v-for="(img,i) in h.answerImages" :key="i" class="hw-img-item" @click="preview=imgUrl(img.url);showPreview=true">
                  <img :src="imgUrl(img.url)"/>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="hw-footer" v-if="h.createdAt"><span>{{ h.createdAt?.slice(0,10) }}</span></div>
      </div>
    </div>
    <el-empty v-else description="暂无作业" :image-size="100"/>

    <el-dialog v-model="showPreview" title="图片预览" width="90%" :append-to-body="true" destroy-on-close>
      <img :src="preview" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px"/>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '@/api/request'
import { resolveStaticUrl } from '@/utils/url'

const route = useRoute()
const subject = computed(() => route.params.subject || 'math')
const homeworks = ref([])
const showPreview = ref(false); const preview = ref('')

function imgUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) return url.includes(',') ? url : ''
  if (url.startsWith('http')) return url
  // 相对路径（/uploads/xxx 等）→ 由反代处理
  if (url.startsWith('/9j/')||url.startsWith('iVBOR')) return 'data:image/jpeg;base64,'+url
  if (url.startsWith('/')) return resolveStaticUrl(url)
  return url
}

async function loadHomeworks() {
  try {
    const r = await http.get(`/student/homework?subject=${subject.value}`)
    let list = r?.list||(Array.isArray(r)?r:[])
    list = list.map(h => ({...h, id:h.id||h.homeworkId})).filter(h=>h.id)
    const parseImageList = (val) => {
      if (!val) return []
      if (Array.isArray(val)) return val.map(u => ({ url: u })).filter(i => i.url)
      const str = String(val)
      // data URL 含逗号（data:image/jpeg;base64,/9j/...），不能简单 split
      if (str.startsWith('data:')) return [{ url: str }]
      // 逗号分隔的普通 URL 列表
      return str.split(',').map(u => ({ url: u.trim() })).filter(i => i.url)
    }
    list.forEach(h => {
      h.submittedImages = parseImageList(h.submittedImageUrl)
      h.correctedImages = parseImageList(h.correctedImageUrl)
      // 答案解析：\n 分隔多张图
      h.answerImages = h.answerFileUrl
        ? h.answerFileUrl.split('\n').filter(Boolean).map(u => ({ url: u.trim() })).filter(i => i.url)
        : []
    })
    homeworks.value = list.map(h => ({...h, _uploadImgs:[], _uploadFiles:[], _editing:false}))
  } catch(e) { console.warn('作业加载失败:', e.message) }
}

function subStat(h) { return h.submitStatus||'pending' }
function startEdit(h) {
  h._editing = true
  h._uploadFiles = []
  h._uploadImgs = (h.submittedImages||[]).map(img => ({ url: img.url||img, keep: true }))
}
function triggerUp(h) { h._input?.click?.() }
function onUpload(h, e) {
  const files = Array.from(e.target.files||[])
  if (!h._uploadImgs) h._uploadImgs = []
  if (!h._uploadFiles) h._uploadFiles = []
  files.forEach(f => {
    h._uploadImgs.push({ url: URL.createObjectURL(f) })
    h._uploadFiles.push(f)
  })
  e.target.value = ''
}

async function submitWork(hw) {
  const hid = hw?.id
  if (!hid) { ElMessage.error('作业信息异常，请刷新重试'); return }
  // 收集保留的图片 URL + 新上传的文件
  const keptUrls = (hw._uploadImgs||[]).filter(img => img.keep).map(img => img.url)
  const newFiles = hw?._uploadFiles || []
  if (!keptUrls.length && !newFiles.length) return
  // 新文件转 base64
  const newImgs = await Promise.all(newFiles.map(f => new Promise(resolve => {
    const r = new FileReader(); r.onload = () => {
      const img = new Image(); img.onload = () => {
        const maxW=1024, maxH=1024; let w=img.width, h=img.height
        if(w>maxW||h>maxH){const r2=Math.min(maxW/w,maxH/h);w=Math.round(w*r2);h=Math.round(h*r2)}
        const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h)
        resolve(c.toDataURL('image/jpeg',0.7))
      }; img.src = r.result
    }; r.readAsDataURL(f)
  })))
  const allImgs = [...keptUrls, ...newImgs]
  try {
    await http.post(`/student/homework/${hid}/submit`, { imageUrl: allImgs })
    ElMessage.success('已提交')
    hw.submitStatus = 'submitted'; hw.submittedImages = allImgs.map(u=>({url:u}))
    hw.submittedImageUrl = allImgs
    hw._uploadImgs = []; hw._uploadFiles = []; hw._editing = false
  } catch(e) { ElMessage.error('提交失败') }
}

onMounted(loadHomeworks)
</script>

<style scoped>
.hw-page{max-width:680px;margin:0 auto;padding:20px 14px 40px}
.hw-hero{text-align:center;padding:16px 0 8px}.hw-emoji{font-size:44px;animation:bounce 2s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.hw-hero h2{font-size:22px;font-weight:800;margin:6px 0 2px}.hw-hero p{font-size:13px;color:#999}
.hw-list{display:flex;flex-direction:column;gap:12px}
.hw-card{background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 1px 8px rgba(0,0,0,.04);border:1px solid #eee}
.hw-card.corrected{border-left:4px solid #10B981}
.hw-card.submitted{border-left:4px solid #F59E0B}
.hw-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.hw-header h4{font-size:16px;font-weight:700;color:#333}.hw-desc{font-size:13px;color:#888;margin-top:4px}
.hw-imgs{display:flex;flex-wrap:wrap;gap:8px}.hw-img-item{position:relative;width:90px;height:90px;cursor:pointer}.hw-img-item img{width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid #eee}.hw-img-item:hover img{opacity:.85}
.hw-img-del{position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#EF4444;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1}
.hw-img-add{width:90px;height:90px;border:2px dashed #ccc;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#999;font-size:20px}.hw-img-add:hover{border-color:var(--color-primary);color:var(--color-primary)}.hw-img-add p{font-size:11px;margin-top:2px}
.hw-actions{margin-top:8px;display:flex;gap:8px}
.hw-view{display:flex;gap:8px}
.hw-section{flex:1;min-width:0;padding:8px 10px;background:var(--color-bg);border-radius:10px}
.hw-section-label{font-size:13px;font-weight:600;color:#555;margin-bottom:6px}
.hw-modify-btn{margin-top:4px}
.hw-footer{text-align:right;font-size:11px;color:#ccc;margin-top:8px}
</style>
