<template>
  <div class="page-container">
    <div class="page-header"><div><h2>👨‍🏫 老师管理</h2><p>老师信息 · 学科 · 学生数</p></div><el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon>新增老师</el-button></div>
    <div class="mb-lg"><el-input v-model="search" placeholder="搜索姓名/学科..." :prefix-icon="Search" style="width:260px" clearable /></div>
    <el-row :gutter="16">
      <el-col :span="8" v-for="t in teachers" :key="t.userId">
        <el-card shadow="hover" class="teacher-card">
          <div class="teacher-top" @click="showDetail(t)"><div class="teacher-avatar">{{ t.realName?.[0] }}</div><div><h3>{{ t.realName }}</h3><span class="teacher-title">{{ t.title||'未设置' }}</span></div></div>
          <div class="teacher-subjects" @click="showDetail(t)"><el-tag v-for="s in (t.subjects||[])" :key="s" size="small" style="margin:2px">{{ s }}</el-tag></div>
          <div class="teacher-footer">
            <span>{{ t.studentCount }}名学生 · {{ t.totalHours }}课时</span>
            <div>
              <el-button size="small" text type="primary" @click.stop="$router.push(`/admin/schedules?teacherId=${t.userId}`)">排课</el-button>
              <el-button size="small" text type="primary" @click.stop="editTeacher(t)">编辑</el-button>
              <el-button size="small" text type="danger" @click.stop="del(t)">删除</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showForm" :title="editingId?'编辑老师':'新增老师'" width="580px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="form.realName"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户名"><el-input v-model="form.username" :disabled="!!editingId"/></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="密码"><el-input v-model="form.password" type="password" show-password :placeholder="editingId?'留空不修改':''"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="职称"><el-input v-model="form.title" placeholder="高级教师"/></el-form-item></el-col>
        </el-row>
        <el-form-item label="任教学科">
          <el-select v-model="form.subjectIds" multiple placeholder="可多选" style="width:100%">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s"/>
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="机构"><el-input v-model="form.orgName" placeholder="输入机构名称"/></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="联系方式"><el-input v-model="form.phone"/></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="showForm=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDlg" :title="selectedTeacher?.realName" width="600px">
      <div v-if="selectedDetail">
        <el-descriptions :column="2" border size="small"><el-descriptions-item label="姓名">{{ selectedDetail.realName }}</el-descriptions-item><el-descriptions-item label="职称">{{ selectedDetail.title||'-' }}</el-descriptions-item><el-descriptions-item label="学科"><el-tag v-for="s in (selectedDetail.subjects||[])" :key="s" size="small" style="margin:1px">{{ s }}</el-tag></el-descriptions-item><el-descriptions-item label="机构">{{ selectedDetail.orgName||'-' }}</el-descriptions-item></el-descriptions>
        <h4 class="mt-lg">关联学生 ({{ selectedDetail.students?.length||0 }}人)</h4>
        <el-table :data="selectedDetail.students" size="small" class="mt-lg"><el-table-column prop="studentName" label="姓名"/><el-table-column label="科目"><template #default="{row}"><el-tag v-for="s in (row.subjects||[])" :key="s" size="small" style="margin:1px">{{ s }}</el-tag></template></el-table-column><el-table-column prop="hoursLeft" label="课时" width="80"/><el-table-column prop="grade" label="年级" width="80"/></el-table>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminTeachers, getAdminTeacher, createAdminTeacher, updateAdminTeacher, deleteAdminTeacher } from '@/api/common/admin'

const subjectList = ['语文','数学','英语','物理','化学','生物','历史','政治','地理']
const search = ref(''); const showForm = ref(false); const showDlg = ref(false); const saving = ref(false)
const editingId = ref(null); const selectedTeacher = ref(null); const selectedDetail = ref(null)
const teachers = ref([])
const form = reactive({ realName:'', username:'', password:'', title:'', subjectIds:[], orgName:'', phone:'' })

async function load() { try { const r = await getAdminTeachers({ page:1, pageSize:100 }); teachers.value = r.list||[] } catch {} }
onMounted(load)

function openAdd() { editingId.value = null; Object.assign(form, { realName:'', username:'', password:'', title:'', subjectIds:[], orgName:'', phone:'' }); showForm.value = true }
function editTeacher(t) {
  editingId.value = t.userId
  Object.assign(form, { realName:t.realName, username:t.username, password:'', title:t.title||'', subjectIds:[...(t.subjects||[])], orgName:t.orgName||'', phone:t.phone||'' })
  showForm.value = true
}
async function save() {
  if (!form.realName) return ElMessage.warning('请输入姓名')
  if (!editingId.value && !form.username) return ElMessage.warning('请输入用户名')
  if (!editingId.value && !form.password) return ElMessage.warning('请输入密码')
  saving.value = true
  try {
    const payload = { realName:form.realName, username:form.username, title:form.title, subjectIds:form.subjectIds, orgName:form.orgName, phone:form.phone }
    if (form.password) payload.password = form.password
    editingId.value ? await updateAdminTeacher(editingId.value, payload) : await createAdminTeacher(payload)
    ElMessage.success(editingId.value ? '已更新' : '已添加'); showForm.value = false; await load()
  } catch (e) { ElMessage.error(e.message||'保存失败') }
  finally { saving.value = false }
}
async function del(t) {
  await ElMessageBox.confirm(`确定删除老师"${t.realName}"？`, '确认', { type:'warning' })
  try { await deleteAdminTeacher(t.userId); ElMessage.success('已删除'); await load() }
  catch (e) { ElMessage.error(e.message||'删除失败') }
}
async function showDetail(t) { selectedTeacher.value = t; showDlg.value = true; try { selectedDetail.value = await getAdminTeacher(t.userId) } catch { selectedDetail.value = t } }
</script>
<style scoped>
.mb-lg{margin-bottom:var(--space-lg)}.mt-lg{margin-top:var(--space-lg)}
.teacher-card{transition:all var(--transition)}.teacher-card:hover{border-color:var(--color-primary-light)}
.teacher-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;cursor:pointer}.teacher-avatar{width:44px;height:44px;border-radius:50%;background:var(--color-primary-bg);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700}
.teacher-top h3{font-size:16px;margin-bottom:2px}.teacher-title{font-size:12px;color:var(--text-muted)}.teacher-subjects{margin-bottom:12px;cursor:pointer}.teacher-footer{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);border-top:1px solid var(--color-border-light);padding-top:10px}
</style>
