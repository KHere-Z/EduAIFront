<template>
  <div class="fb-page">
    <div class="fb-hero"><h2>📝 学习反馈</h2><p>选择学生和学科，记录阶段学习表现</p></div>

    <div class="fb-layout">
      <!-- 左侧：编写反馈 -->
      <div class="fb-write">
        <h3>✍️ 写反馈</h3>
        <el-form label-width="64px" size="small">
          <el-form-item label="学生">
            <el-select v-model="fbForm.studentId" placeholder="选择学生" style="width:100%" filterable>
              <el-option v-for="s in studentList" :key="s.studentId" :label="s.studentName" :value="s.studentId"/>
            </el-select>
          </el-form-item>
          <el-form-item label="学科">
            <el-select v-model="fbForm.subject" placeholder="选择学科" style="width:100%">
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s"/>
            </el-select>
          </el-form-item>
          <el-form-item label="时段">
            <el-input v-model="fbForm.period" placeholder="如：7月第2周 / 期末总结"/>
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="fbForm.content" type="textarea" :rows="6" placeholder="写下对学生的阶段评价、进步点、待改进处…"/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="sendFeedback" :loading="sending">发送反馈</el-button>
            <el-button @click="clearForm">清空</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 右侧：历史反馈 -->
      <div class="fb-history">
        <div class="fbh-head">
          <h3>📋 已发送反馈</h3>
          <el-select v-model="filterSubject" placeholder="学科" clearable size="small" style="width:100px">
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s"/>
          </el-select>
        </div>
        <div class="fbh-list" v-if="filteredFeedbacks.length">
          <div v-for="fb in filteredFeedbacks" :key="fb.id" class="fbh-card">
            <div class="fbhc-top">
              <span class="fbhc-student">{{ fb.studentName }}</span>
              <el-tag size="small">{{ fb.subject }}</el-tag>
              <span class="fbhc-period">{{ fb.period||'未标注时段' }}</span>
              <span class="fbhc-date">{{ fb.createdAt?.slice(0,10) }}</span>
            </div>
            <div class="fbhc-content">{{ fb.content }}</div>
            <div class="fbhc-actions">
              <el-button size="small" text type="danger" @click="delFeedback(fb.id)">删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无反馈记录" :image-size="80"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeacherMathStudents, getTeacherFeedbacks, createTeacherFeedback, deleteTeacherFeedback } from '@/api/common/admin'

const studentList = ref([])
const sending = ref(false)
const filterSubject = ref('')
const feedbacks = ref([])

const subjects = ['数学','语文','英语','物理','化学','生物','历史','政治','地理']

const fbForm = ref({ studentId:null, subject:'数学', period:'', content:'' })

const filteredFeedbacks = computed(() => {
  return feedbacks.value
    .filter(f => !filterSubject.value || f.subject === filterSubject.value)
    .sort((a,b) => b.id - a.id)
})

async function loadFeedbacks() {
  try { feedbacks.value = await getTeacherFeedbacks({}) } catch { feedbacks.value = [] }
}

function clearForm() { fbForm.value = { studentId:null, subject:'数学', period:'', content:'' } }

async function sendFeedback() {
  if (!fbForm.value.studentId) { ElMessage.warning('请选择学生'); return }
  if (!fbForm.value.content.trim()) { ElMessage.warning('请输入反馈内容'); return }
  sending.value = true
  try {
    await createTeacherFeedback(fbForm.value)
    ElMessage.success('反馈已发送')
    clearForm()
    loadFeedbacks()
  } catch (e) { ElMessage.error(e.message||'发送失败') }
  sending.value = false
}

async function delFeedback(id) {
  try {
    await ElMessageBox.confirm('确认删除？','删除',{type:'warning'})
    await deleteTeacherFeedback(id)
    loadFeedbacks()
  } catch {}
}

onMounted(async () => {
  loadFeedbacks()
  try { const r = await getTeacherMathStudents(); studentList.value = r || [] } catch {}
})
</script>

<style scoped>
.fb-page{max-width:1100px;margin:0 auto;padding:20px 14px 40px}
.fb-hero{margin-bottom:20px}.fb-hero h2{font-size:20px;font-weight:800;margin-bottom:2px}.fb-hero p{font-size:13px;color:var(--text-muted)}

.fb-layout{display:flex;gap:16px;align-items:flex-start}
.fb-write{flex:1;min-width:0;background:#fff;border-radius:14px;padding:20px 24px;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.fb-write h3{font-size:15px;margin-bottom:16px;color:var(--text-primary)}

.fb-history{flex:1;min-width:0;background:#fff;border-radius:14px;padding:20px 24px;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.fbh-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.fbh-head h3{font-size:15px;color:var(--text-primary)}

.fbh-list{display:flex;flex-direction:column;gap:10px}
.fbh-card{padding:14px 16px;border-radius:10px;background:var(--color-bg);border:1px solid var(--color-border-light)}
.fbhc-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.fbhc-student{font-size:14px;font-weight:600;color:var(--text-primary)}
.fbhc-period{font-size:12px;color:var(--text-muted)}
.fbhc-date{font-size:12px;color:var(--text-muted);margin-left:auto}
.fbhc-content{font-size:14px;line-height:1.8;color:var(--text-secondary);white-space:pre-wrap}
.fbhc-actions{text-align:right;margin-top:6px}
</style>
