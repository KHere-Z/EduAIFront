<template>
  <div class="page-container">
    <div class="page-header"><div><h2>👨‍🏫 老师管理</h2><p>老师信息 · 学科 · 学生数</p></div><el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon>新增老师</el-button></div>
    <div class="mb-lg"><el-input v-model="search" placeholder="搜索姓名/用户名/手机号..." :prefix-icon="Search" style="width:260px" clearable @keyup.enter="onSearch" @clear="onSearch"/></div>
    <el-card>
      <el-table :data="teachers" stripe size="small" v-loading="loading">
        <el-table-column type="index" label="#" width="50" align="center"/>
        <el-table-column prop="realName" label="姓名" width="100"/>
        <el-table-column prop="username" label="用户名" width="110"/>
        <el-table-column prop="title" label="职称" width="100"><template #default="{row}">{{ row.title || '-' }}</template></el-table-column>
        <el-table-column label="任教学科" min-width="160"><template #default="{row}"><el-tag v-for="s in (row.subjects||[])" :key="s" size="small" style="margin:1px">{{ s }}</el-tag><span v-if="!row.subjects?.length" style="color:var(--text-muted);font-size:12px">未设置</span></template></el-table-column>
        <el-table-column prop="orgName" label="机构" min-width="120"><template #default="{row}">{{ row.orgName || '-' }}</template></el-table-column>
        <el-table-column prop="phone" label="联系方式" width="120"><template #default="{row}">{{ row.phone || '-' }}</template></el-table-column>
        <el-table-column label="学生/课时" width="130"><template #default="{row}">{{ row.studentCount ?? 0 }}名 · {{ row.totalHours ?? 0 }}课时</template></el-table-column>
        <el-table-column label="操作" width="170" align="center"><template #default="{row}"><el-button size="small" text type="primary" @click="showDetail(row)">详情</el-button><el-button size="small" text type="primary" @click="editTeacher(row)">编辑</el-button><el-button size="small" text type="danger" @click="del(row)">删除</el-button></template></el-table-column>
      </el-table>
      <div class="tp-pagination" v-if="total > pageSize">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="total, prev, pager, next" background @current-change="load"/>
      </div>
    </el-card>

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
const teachers = ref([]); const loading = ref(false); const page = ref(1); const pageSize = ref(20); const total = ref(0)
const form = reactive({ realName:'', username:'', password:'', title:'', subjectIds:[], orgName:'', phone:'' })

async function load() {
  loading.value = true
  try {
    const r = await getAdminTeachers({ page: page.value, pageSize: pageSize.value, keyword: search.value })
    const d = r?.data ?? r
    teachers.value = d?.list ?? d?.records ?? []
    total.value = d?.total ?? teachers.value.length
  } catch { teachers.value = [] }
  finally { loading.value = false }
}
function onSearch() { page.value = 1; load() }
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
.tp-pagination{display:flex;justify-content:flex-end;margin-top:14px}
</style>
