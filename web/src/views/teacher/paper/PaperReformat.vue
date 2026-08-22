<template>
  <div class="pr-page">
    <div class="pr-hero">
      <h2>📄 PDF转Word</h2>
      <p>上传 PDF 试卷，一键转换为可编辑的 Word 文档，数学公式可编辑、版式尽量还原</p>
    </div>

    <div class="pr-card">
      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        accept=".pdf"
        :on-change="onFileChange"
        :disabled="converting"
      >
        <el-icon class="pr-upload-icon"><UploadFilled /></el-icon>
        <div class="pr-upload-text">拖拽 PDF 到此处，或<em>点击选择</em></div>
        <div class="pr-upload-tip">仅支持 .pdf 格式，转换后自动下载 .docx</div>
      </el-upload>

      <div v-if="fileName" class="pr-file">
        <span class="pr-file-name">📎 {{ fileName }}</span>
        <el-button v-if="!converting" size="small" text type="danger" @click="clearFile">移除</el-button>
      </div>

      <el-button class="pr-submit" type="primary" size="large" :loading="converting" :disabled="!file" @click="convert">
        {{ converting ? '转换中…' : '开始转换' }}
      </el-button>

      <div v-if="converting" class="pr-status">⏳ 转换中，请稍候… 含公式或图片的试卷可能需要 1～2 分钟，请勿关闭页面</div>
      <div v-if="done" class="pr-done">✅ 转换完成，已开始下载 Word 文档</div>
      <div v-if="error" class="pr-error">⚠️ {{ error }}</div>
    </div>

    <div class="pr-note">
      <h3>使用说明</h3>
      <ul>
        <li>转换引擎会尽量保留原试卷的文字、表格与图片排版。</li>
        <li>数学公式、特殊字体可能无法 100% 还原，转换后请人工校对。</li>
        <li>转换在后台进行，大文件耗时较长，请耐心等待。</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const file = ref(null)
const fileName = ref('')
const converting = ref(false)
const done = ref(false)
const error = ref('')

function onFileChange(f) {
  const raw = f.raw
  if (!raw) return
  if (!raw.name.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning('请选择 PDF 文件')
    return
  }
  file.value = raw
  fileName.value = raw.name
  done.value = false
  error.value = ''
}

function clearFile() {
  file.value = null
  fileName.value = ''
  done.value = false
  error.value = ''
}

async function convert() {
  if (!file.value || converting.value) return
  converting.value = true
  done.value = false
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    const res = await fetch('/pdf2docx/convert', { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`转换服务返回 ${res.status}`)
    const blob = await res.blob()
    // 服务返回 JSON 错误（Content-Type: application/json）时解析错误信息
    if (blob.type.includes('application/json')) {
      const j = JSON.parse(await blob.text())
      throw new Error(j.error || '转换失败')
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.value.replace(/\.pdf$/i, '') + '.docx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    done.value = true
    ElMessage.success('转换完成，已下载 Word 文档')
  } catch (e) {
    error.value = e.message || '转换失败，请重试'
    ElMessage.error(error.value)
  } finally {
    converting.value = false
  }
}
</script>

<style scoped>
.pr-page { min-height: 100vh; background: var(--color-bg); }
.pr-hero { text-align: center; padding: 44px 20px 28px; background: #fff; border-bottom: 1px solid var(--color-border); }
.pr-hero h2 { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
.pr-hero p { font-size: 13px; color: var(--text-muted); }

.pr-card { max-width: 560px; margin: 24px auto 0; padding: 24px; background: #fff; border-radius: 14px; border: 1px solid var(--color-border); box-shadow: 0 1px 6px rgba(0,0,0,.04); }
.pr-upload-icon { font-size: 48px; color: var(--color-primary); margin: 8px 0; }
.pr-upload-text { font-size: 14px; color: var(--text-primary); }
.pr-upload-text em { color: var(--color-primary); font-style: normal; }
.pr-upload-tip { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

.pr-file { display: flex; align-items: center; justify-content: space-between; margin: 14px 0 4px; padding: 10px 14px; background: rgba(99,102,241,.06); border-radius: 10px; }
.pr-file-name { font-size: 13px; color: var(--text-primary); }

.pr-submit { width: 100%; margin-top: 16px; }

.pr-status { margin-top: 14px; font-size: 13px; color: #F59E0B; text-align: center; }
.pr-done { margin-top: 14px; font-size: 13px; color: #10B981; text-align: center; }
.pr-error { margin-top: 14px; font-size: 13px; color: #EF4444; text-align: center; }

.pr-note { max-width: 560px; margin: 16px auto 40px; padding: 18px 24px; background: #fff; border-radius: 14px; border: 1px solid var(--color-border); }
.pr-note h3 { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.pr-note ul { padding-left: 18px; margin: 0; }
.pr-note li { font-size: 13px; color: var(--text-secondary); line-height: 1.8; }
</style>
