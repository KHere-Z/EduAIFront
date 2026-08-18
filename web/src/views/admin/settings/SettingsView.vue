<template>
  <div class="set-page">
    <div class="set-hero"><h2>⚙️ 系统设置</h2><p>AI 模型 · 功能配置</p></div>

    <!-- ═══ 模型管理 ═══ -->
    <section class="set-block">
      <div class="sb-head">
        <div><h3>🤖 模型管理</h3><p>集中管理所有 AI 模型，功能只需选择</p></div>
        <el-button type="primary" size="small" @click="openModelForm()" round>+ 新增</el-button>
      </div>
      <div class="model-grid" v-if="models.length">
        <div v-for="m in models" :key="m.value" class="m-card">
          <div class="mc-top">
            <span class="mc-icon">{{ providerIcon(m.provider) }}</span>
            <div class="mc-info">
              <span class="mc-name">{{ m.name }}</span>
              <span class="mc-desc">{{ m.description }}</span>
            </div>
            <div class="mc-actions">
              <el-button size="small" text @click="openModelForm(m)">✏️</el-button>
              <el-button size="small" text type="danger" @click="delModel(m)">🗑</el-button>
            </div>
          </div>
          <div class="mc-meta">
            <span class="mc-tag">{{ m.provider }}</span>
            <span class="mc-dot">{{ m.apiKey ? '🔑' : '⚪' }}{{ m.apiKey ? '已配置' : '未配置Key' }}</span>
            <span class="mc-url" :title="m.apiUrl">{{ (m.apiUrl||'').replace(/^https?:\/\//,'') }}</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无模型" :image-size="60"/>
    </section>

    <!-- ═══ AI 功能配置 ═══ -->
    <section class="set-block">
      <div class="sb-head"><div><h3>🎯 功能配置</h3><p>为每项 AI 功能选择使用的模型</p></div></div>
      <div class="feat-cards">
        <div v-for="item in aiFeatures" :key="item.key" class="f-card">
          <span class="fc-emoji">{{ item.icon }}</span>
          <span class="fc-label">{{ item.label }}</span>
          <el-select v-model="form[item.modelKey]" placeholder="选择模型" size="small" style="width:220px">
            <el-option v-for="m in models" :key="m.value" :label="m.name + ' · ' + m.provider" :value="m.value"/>
          </el-select>
        </div>
      </div>
      <div class="block-actions">
        <el-button type="primary" :loading="saving" @click="saveFeatures" round>保存功能配置</el-button>
      </div>
    </section>

    <!-- ═══ 系统配置 ═══ -->
    <section class="set-block">
      <div class="sb-head"><div><h3>⚙️ 系统参数</h3></div></div>
      <div class="sys-form">
        <div class="sf-item"><label>系统名称</label><el-input v-model="form.systemName" placeholder="智学AI教育" size="small" style="width:260px"/></div>
        <div class="sf-item"><label>最大并发</label><el-input-number v-model="form.maxConcurrency" :min="1" :max="100" size="small"/></div>
      </div>
      <div class="block-actions">
        <el-button type="primary" :loading="saving" @click="saveSystem" round>保存</el-button>
      </div>
    </section>

    <!-- 模型编辑弹窗 -->
    <el-dialog v-model="showModelForm" :title="editingModel?'编辑模型':'新增模型'" width="440px" destroy-on-close>
      <el-form :model="modelForm" label-width="72px" size="small">
        <el-form-item label="标识"><el-input v-model="modelForm.value" placeholder="如 deepseek-chat" :disabled="!!editingModel"/></el-form-item>
        <el-form-item label="名称"><el-input v-model="modelForm.name" placeholder="如 DeepSeek-V3"/></el-form-item>
        <el-form-item label="供应商"><el-input v-model="modelForm.provider" placeholder="如 DeepSeek"/></el-form-item>
        <el-form-item label="描述"><el-input v-model="modelForm.description" placeholder="简短说明"/></el-form-item>
        <el-form-item label="API地址"><el-input v-model="modelForm.apiUrl" placeholder="https://api.deepseek.com/v1"/></el-form-item>
        <el-form-item label="API Key"><el-input v-model="modelForm.apiKey" type="password" show-password placeholder="sk-xxx"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="showModelForm=false" round>取消</el-button><el-button type="primary" @click="saveModelForm" round>确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminSettings, updateAdminSettings, getModels, createModel, updateModel, deleteModel } from '@/api/common/admin'

const saving = ref(false)
const showModelForm = ref(false)
const editingModel = ref(null)
const modelForm = reactive({ value:'', name:'', description:'', provider:'', apiUrl:'', apiKey:'' })

const aiFeatures = [
  { key:'wrong', icon:'🔬', label:'AI 错题分析', modelKey:'wrongAnalysisModel' },
  { key:'exam', icon:'📄', label:'AI 试卷分析', modelKey:'examAnalysisModel' },
]

const form = reactive({
  wrongAnalysisModel:'', examAnalysisModel:'',
  systemName:'智学AI教育', maxConcurrency:10
})

function providerIcon(p) {
  const map = { DeepSeek:'🟢', OpenAI:'⚫', 字节跳动:'🔵', 百度:'🟡', 阿里:'🟠', 腾讯:'🔷' }
  return map[p] || '🟣'
}

const defaultModels = [
  { value:'deepseek-chat', name:'DeepSeek-V3', description:'高性价比通用模型', provider:'DeepSeek', apiUrl:'https://api.deepseek.com/v1', apiKey:'' },
  { value:'deepseek-reasoner', name:'DeepSeek-R1', description:'深度推理·数学/逻辑', provider:'DeepSeek', apiUrl:'https://api.deepseek.com/v1', apiKey:'' },
  { value:'doubao-seed-2-1-pro-260628', name:'Doubao Seed 2.1', description:'视觉理解·试卷识图', provider:'字节跳动', apiUrl:'https://ark.cn-beijing.volces.com/api/v3/responses', apiKey:'' },
  { value:'gpt-4o', name:'GPT-4o', description:'综合能力最强', provider:'OpenAI', apiUrl:'https://api.openai.com/v1', apiKey:'' },
]
const models = ref([...defaultModels])

function openModelForm(row) {
  editingModel.value = row||null
  Object.assign(modelForm, row ? { ...row } : { value:'', name:'', description:'', provider:'', apiUrl:'', apiKey:'' })
  showModelForm.value = true
}

async function saveModelForm() {
  if (!modelForm.value || !modelForm.name) { ElMessage.warning('标识和名称不能为空'); return }
  try {
    if (editingModel.value) {
      await updateModel(editingModel.value.id, { ...modelForm })
    } else {
      await createModel({ ...modelForm })
    }
    showModelForm.value = false
    ElMessage.success(editingModel.value?'已更新':'已添加')
    loadModels()
  } catch (e) { ElMessage.error(e.message||'保存失败') }
}

async function delModel(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '删除模型', { type:'warning' })
    await deleteModel(row.id)
    ElMessage.success('已删除')
    loadModels()
  } catch (e) { if (e !== 'cancel') ElMessage.error(e.message||'删除失败') }
}

async function loadModels() {
  try {
    const res = await getModels()
    if (res && Array.isArray(res)) models.value = res
    else if (res?.list) models.value = res.list
  } catch {}
}

async function saveFeatures() {
  saving.value = true
  try {
    await updateAdminSettings({
      wrongAnalysisModel: form.wrongAnalysisModel,
      examAnalysisModel: form.examAnalysisModel
    })
    ElMessage.success('AI 功能配置已保存')
  } catch (e) { ElMessage.error(e.message||'保存失败') }
  finally { saving.value = false }
}

async function saveSystem() {
  saving.value = true
  try {
    await updateAdminSettings({ systemName: form.systemName, maxConcurrency: form.maxConcurrency })
    ElMessage.success('系统配置已保存')
  } catch (e) { ElMessage.error(e.message||'保存失败') }
  finally { saving.value = false }
}

onMounted(async () => {
  // 加载模型列表
  await loadModels()

  // 加载已保存的功能配置
  try {
    const cfg = await getAdminSettings()
    if (cfg) {
      // 如果配置的模型不在模型列表中，用 ModelName 补一个临时选项
      const ensureOption = (value, name) => {
        if (value && !models.value.find(m => m.value === value)) {
          models.value.push({ value, name: name || value, description: '', provider: '' })
        }
      }
      ensureOption(cfg.wrongAnalysisModel, cfg.wrongAnalysisModelName)
      ensureOption(cfg.examAnalysisModel, cfg.examAnalysisModelName)
      Object.assign(form, cfg)
    }
  } catch (e) { console.error('设置加载失败:', e) }

  // 兜底：未配置时默认选第一个模型
  if (models.value.length) {
    if (!form.wrongAnalysisModel) form.wrongAnalysisModel = models.value[0]?.value || ''
    if (!form.examAnalysisModel) {
      form.examAnalysisModel = models.value.find(m => (m.value||'').includes('doubao'))?.value || models.value[0]?.value || ''
    }
  }
})
</script>

<style scoped>
.set-page{max-width:760px;margin:0 auto;padding:24px 16px 48px}
.set-hero{text-align:center;padding:8px 0 20px}
.set-hero h2{font-size:22px;font-weight:800;margin-bottom:2px;color:var(--text-primary)}
.set-hero p{font-size:13px;color:var(--text-muted)}

/* block */
.set-block{background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:16px;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.sb-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.sb-head h3{font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:2px}
.sb-head p{font-size:12px;color:var(--text-muted)}

/* model cards */
.model-grid{display:flex;flex-direction:column;gap:8px}
.m-card{padding:14px 16px;border-radius:10px;border:1px solid var(--color-border-light);transition:all .15s;background:var(--color-bg)}
.m-card:hover{box-shadow:var(--shadow-sm);border-color:var(--color-primary-light)}
.mc-top{display:flex;align-items:center;gap:10px}
.mc-icon{font-size:24px;flex-shrink:0}
.mc-info{flex:1;min-width:0;display:flex;flex-direction:column}
.mc-name{font-size:14px;font-weight:600;color:var(--text-primary)}
.mc-desc{font-size:12px;color:var(--text-muted)}
.mc-actions{display:flex;gap:2px;flex-shrink:0}
.mc-meta{display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:var(--text-muted)}
.mc-tag{padding:2px 8px;border-radius:10px;background:var(--color-primary-bg);color:var(--color-primary);font-weight:500}
.mc-dot{white-space:nowrap}
.mc-url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* feature cards */
.feat-cards{display:flex;flex-direction:column;gap:8px}
.f-card{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;background:var(--color-bg);border:1px solid var(--color-border-light)}
.fc-emoji{font-size:22px;flex-shrink:0}
.fc-label{font-size:14px;font-weight:500;color:var(--text-primary);width:100px;flex-shrink:0}

/* system */
.sys-form{display:flex;flex-direction:column;gap:10px}
.sf-item{display:flex;align-items:center;gap:12px}
.sf-item label{font-size:13px;color:var(--text-secondary);width:80px;flex-shrink:0}

.block-actions{margin-top:14px;display:flex;justify-content:flex-end}
</style>
