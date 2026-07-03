<template>
  <div class="page-container">
    <div class="page-header"><div><h2>👥 学生管理</h2><p>全局学生档案 · 分配任课老师</p></div><el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon>新增学生</el-button></div>
    <div class="mb-lg"><el-input v-model="search" placeholder="搜索姓名/学校..." :prefix-icon="Search" style="width:260px" clearable /></div>
    <el-card>
      <el-table :data="students" stripe size="small" v-loading="loading">
        <el-table-column type="index" label="#" width="50" align="center"/>
        <el-table-column prop="name" label="姓名" width="90"/>
        <el-table-column prop="gender" label="性别" width="60" align="center"/>
        <el-table-column prop="grade" label="年级" width="80" align="center"/>
        <el-table-column prop="school" label="学校" min-width="140"/>
        <el-table-column prop="contact" label="联系方式" width="130"/>
        <el-table-column label="任课老师" min-width="200">
          <template #default="{row}">
            <el-tag v-for="t in (row.teacherRelations||[])" :key="t.teacherId" size="small" type="success" style="margin:1px">{{ t.teacherName }} · {{ t.subjects?.join(',')||'' }}</el-tag>
            <span v-if="!row.teacherRelations?.length" style="color:var(--text-muted);font-size:12px">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center"><template #default="{row}"><el-button size="small" text type="primary" @click="editStudent(row)">编辑</el-button><el-button size="small" text type="danger" @click="del(row)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="showForm" :title="editingId?'编辑学生':'新增学生'" width="520px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="姓名"><el-input v-model="form.name"/></el-form-item></el-col><el-col :span="12"><el-form-item label="性别"><el-select v-model="form.gender"><el-option label="男" value="男"/><el-option label="女" value="女"/></el-select></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="账号"><el-input v-model="form.username" placeholder="登录用" :disabled="!!editingId"/></el-form-item></el-col><el-col :span="12"><el-form-item label="密码"><el-input v-model="form.password" type="password" show-password :placeholder="editingId?'留空不修改':''"/></el-form-item></el-col></el-row>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="联系方式"><el-input v-model="form.contact"/></el-form-item></el-col><el-col :span="12"><el-form-item label="年级"><el-select v-model="form.grade"><el-option v-for="g in grades" :key="g" :label="g" :value="g"/></el-select></el-form-item></el-col></el-row>
        <el-form-item label="学校"><el-input v-model="form.school"/></el-form-item>
        <el-form-item label="任课老师">
          <el-select v-model="form.teacherIds" multiple placeholder="可多选" style="width:100%">
            <el-option v-for="t in teachers" :key="t.userId" :label="`${t.realName} · ${t.title||''} · ${(t.subjects||[]).join(',')}`" :value="t.userId"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="showForm=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminStudents, createAdminStudent, updateAdminStudent, deleteAdminStudent } from '@/api/common/admin'
import { getAdminTeachers } from '@/api/common/admin'
const grades = ['一年级','二年级','三年级','四年级','五年级','六年级','初一','初二','初三','高一','高二','高三']
const search = ref(''); const loading = ref(false); const saving = ref(false)
const showForm = ref(false); const editingId = ref(null)
const form = reactive({ name:'', gender:'男', username:'', password:'', contact:'', grade:'初一', school:'', teacherIds:[] })
const students = ref([]); const teachers = ref([])

async function loadStudents() {
  loading.value = true
  try { const r = await getAdminStudents({ page:1, pageSize:200, keyword: search.value }); students.value = r.list||[] }
  catch (e) { ElMessage.error(e.message||'加载失败') }
  finally { loading.value = false }
}
async function loadTeachers() { try { const r = await getAdminTeachers({ page:1, pageSize:100 }); teachers.value = r.list||[] } catch {} }
onMounted(() => { loadStudents(); loadTeachers() })

function openAdd() { editingId.value = null; Object.assign(form, { name:'', gender:'男', username:'', password:'', contact:'', grade:'初一', school:'', teacherIds:[] }); showForm.value = true }
function editStudent(row) {
  editingId.value = row.id; form.name = row.name||''; form.gender = row.gender||'男'; form.contact = row.contact||''
  form.grade = row.grade||''; form.school = row.school||''
  form.teacherIds = (row.teacherRelations||[]).map(t => t.teacherId)
  showForm.value = true
}
async function save() {
  if (!form.name) return ElMessage.warning('请输入姓名')
  if (!editingId.value && !form.username) return ElMessage.warning('请输入账号')
  if (!editingId.value && !form.password) return ElMessage.warning('请输入密码')
  saving.value = true
  try {
    const payload = { name:form.name, gender:form.gender, username:form.username, contact:form.contact, grade:form.grade, school:form.school, teacherIds: [...form.teacherIds] }
    if (form.password) payload.password = form.password
    editingId.value ? await updateAdminStudent(editingId.value, payload) : await createAdminStudent(payload)
    ElMessage.success(editingId.value ? '已更新' : '已添加'); showForm.value = false; await loadStudents()
  } catch (e) { ElMessage.error(e.message||'保存失败') }
  finally { saving.value = false }
}
async function del(row) {
  await ElMessageBox.confirm('确定删除？将级联删除该学生的所有排课数据', '确认', { type:'warning' })
  try { await deleteAdminStudent(row.id); ElMessage.success('已删除'); await loadStudents() }
  catch (e) { ElMessage.error(e.message||'删除失败') }
}
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.stat-card{text-align:center;padding:6px 0}.stat-num{font-size:30px;font-weight:700;line-height:1.3}.stat-label{font-size:13px;color:var(--text-muted);margin-top:2px}
</style>
