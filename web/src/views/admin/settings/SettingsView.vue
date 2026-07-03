<template>
  <div class="page-container">
    <div class="page-header"><div><h2>⚙️ 系统设置</h2><p>AI模型 · 系统配置</p></div></div>
    <el-card class="mb-lg">
      <template #header><span class="card-title">🤖 AI 模型</span></template>
      <el-radio-group v-model="form.aiModel" class="model-group">
        <el-card v-for="m in models" :key="m.value" shadow="hover" class="model-card" :class="{active:form.aiModel===m.value}" @click="form.aiModel=m.value"><h4>{{ m.label }}</h4><p>{{ m.desc }}</p><el-tag size="small" :type="m.tag">{{ m.provider }}</el-tag></el-card>
      </el-radio-group>
    </el-card>
    <el-card class="mb-lg">
      <template #header><span class="card-title">🔗 API 配置</span></template>
      <el-form label-width="100px">
        <el-form-item label="API地址"><el-input v-model="form.aiApiUrl" placeholder="https://api.deepseek.com/v1"/></el-form-item>
        <el-form-item label="API Key"><el-input v-model="form.aiApiKey" type="password" show-password placeholder="sk-xxx"/></el-form-item>
        <el-form-item label="系统名称"><el-input v-model="form.systemName" placeholder="安文AI教育"/></el-form-item>
        <el-form-item label="最大并发"><el-input-number v-model="form.maxConcurrency" :min="1" :max="100"/></el-form-item>
      </el-form>
    </el-card>
    <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminSettings, updateAdminSettings } from '@/api/common/admin'
const saving = ref(false)
const form = reactive({ aiModel:'deepseek-chat', aiApiUrl:'', aiApiKey:'', systemName:'安文AI教育', maxConcurrency:10 })
const models = [
  { value:'deepseek-chat', label:'DeepSeek-V3', desc:'推荐 · 性价比最高', provider:'DeepSeek', tag:'success' },
  { value:'deepseek-reasoner', label:'DeepSeek-R1', desc:'深度推理', provider:'DeepSeek', tag:'warning' },
  { value:'gpt-4o', label:'GPT-4o', desc:'综合能力最强', provider:'OpenAI', tag:'danger' }
]
onMounted(async () => { try { const cfg = await getAdminSettings(); if (cfg?.aiModel) Object.assign(form, cfg) } catch {} })
async function save() {
  saving.value = true
  try { await updateAdminSettings({ ...form }); ElMessage.success('设置已保存') }
  catch (e) { ElMessage.error(e.message||'保存失败') }
  finally { saving.value = false }
}
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.card-title{font-weight:600;font-size:15px}
.model-group{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;width:100%}
.model-card{cursor:pointer;transition:all var(--transition);border:2px solid transparent}.model-card:hover{border-color:var(--color-primary-light)}.model-card.active{border-color:var(--color-primary);background:var(--color-primary-bg)}
.model-card h4{font-size:15px;margin-bottom:4px}.model-card p{font-size:13px;color:var(--text-muted);margin-bottom:8px}
</style>
