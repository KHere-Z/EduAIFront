<template>
  <div class="pf-page">
    <div class="pf-hero"><h2>👤 个人中心</h2></div>

    <div class="pf-cards">
      <!-- 基本信息卡片 -->
      <div class="pf-card">
        <div class="pfc-head">基本信息</div>
        <div class="pfc-avatar">
          <div class="pfca-img" :style="{background: avatarColor}">{{ userInitial }}</div>
          <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onAvatarChange" class="pfca-upload">
            <el-button size="small" text>📷 更换头像</el-button>
          </el-upload>
        </div>
        <div class="pfc-info">
          <div class="pfci-row"><span class="pfci-label">用户名</span><span>{{ user?.username || '-' }}</span></div>
          <div class="pfci-row"><span class="pfci-label">姓名</span><span>{{ user?.nickname || user?.realName || '-' }}</span></div>
          <div class="pfci-row"><span class="pfci-label">UID</span><span class="pfci-uid">{{ uidDisplay }}</span><el-button size="small" text @click="copyUid" style="margin-left:4px">📋</el-button></div>
          <div class="pfci-row"><span class="pfci-label">角色</span><span>{{ roleLabel }}</span></div>
          <div class="pfci-row" v-if="isTeacher"><span class="pfci-label">简介</span><span class="pfci-bio" contenteditable @blur="saveBio" @keydown.enter.prevent>{{ editBio || '点击填写个人简介…' }}</span></div>
        </div>
      </div>

      <!-- 学科管理 -->
      <div class="pf-card">
        <div class="pfc-head">学科设置</div>
        <div class="pfc-subjects">
          <el-checkbox-group v-model="editSubjects" size="small">
            <el-checkbox v-for="s in allSubjects" :key="s" :value="s" style="margin-right:12px">{{ s }}</el-checkbox>
          </el-checkbox-group>
        </div>
        <el-button size="small" type="primary" @click="saveSubjects" :loading="saving">保存学科</el-button>
      </div>

      <!-- 师生关系 -->
      <div class="pf-card">
        <div class="pfc-head">{{ isTeacher ? '我的学生' : '我的老师' }}</div>
        <div class="pfc-rel-list" v-if="relations.length">
          <div v-for="r in relations" :key="r.id" class="pfcr-item">
            <span class="pfcr-avatar" :style="{background: hashColor(r.name)}" @click="viewProfile(r)" style="cursor:pointer" :title="'查看'+r.name+'的主页'">{{ r.name?.[0] }}</span>
            <span class="pfcr-name" @click="viewProfile(r)" style="cursor:pointer">{{ r.name }}</span>
            <el-tag size="small" :type="r.status==='accepted'?'success':'warning'">{{ r.status==='accepted'?'已关联':'待确认' }}</el-tag>
            <el-button v-if="r.status==='accepted'" size="small" text type="danger" @click="removeRelation(r)">移除</el-button>
          </div>
        </div>
        <el-empty v-else description="暂无关联" :image-size="60"/>
      </div>

      <!-- 添加师生 -->
      <div class="pf-card">
        <div class="pfc-head">{{ isTeacher ? '添加学生' : '添加老师' }}</div>
        <div style="display:flex;gap:8px">
          <el-input v-model="addUid" placeholder="输入对方UID" size="small" style="width:160px"/>
          <el-button size="small" @click="searchUid">🔍 查看</el-button>
          <el-button size="small" type="primary" @click="sendRequest" :loading="reqSending">发送请求</el-button>
        </div>
        <div class="pfc-requests" v-if="incoming.length">
          <div class="pfcr-title">收到的请求</div>
          <div v-for="r in incoming" :key="r.id" class="pfcr-item">
            <span class="pfcr-avatar" :style="{background: hashColor(r.name)}">{{ r.name?.[0] }}</span>
            <span class="pfcr-name">{{ r.name }} ({{ r.uid }})</span>
            <el-button size="small" type="success" @click="approveReq(r)">同意</el-button>
            <el-button size="small" type="danger" @click="rejectReq(r)">拒绝</el-button>
          </div>
        </div>
      </div>

      <!-- 同事关系（仅老师） -->
      <div class="pf-card" v-if="isTeacher">
        <div class="pfc-head">我的同事</div>
        <div class="pfc-rel-list" v-if="colleagues.length">
          <div v-for="r in colleagues" :key="r.id" class="pfcr-item">
            <span class="pfcr-avatar" :style="{background: hashColor(r.name)}" @click="viewColleague(r)" style="cursor:pointer" :title="'查看'+r.name+'的主页'">{{ r.name?.[0] }}</span>
            <span class="pfcr-name" @click="viewColleague(r)" style="cursor:pointer">{{ r.name }}</span>
            <el-tag size="small" type="success">已关联</el-tag>
            <el-button size="small" text type="danger" @click="removeColleague(r)">移除</el-button>
          </div>
        </div>
        <el-empty v-else description="暂无同事" :image-size="60"/>
        <div class="pfc-colleague-hint">💡 关联同事后，可相互查看、共同管理彼此上传的知识点和讲义</div>
      </div>

      <!-- 添加同事（仅老师） -->
      <div class="pf-card" v-if="isTeacher">
        <div class="pfc-head">添加同事</div>
        <div style="display:flex;gap:8px">
          <el-input v-model="addColleagueUid" placeholder="输入同事UID" size="small" style="width:160px"/>
          <el-button size="small" @click="searchColleague">🔍 查看</el-button>
          <el-button size="small" type="primary" @click="sendColleagueRequest" :loading="colleagueSending">发送请求</el-button>
        </div>
        <div class="pfc-requests" v-if="colleagueIncoming.length">
          <div class="pfcr-title">收到的同事请求</div>
          <div v-for="r in colleagueIncoming" :key="r.id" class="pfcr-item">
            <span class="pfcr-avatar" :style="{background: hashColor(r.name)}">{{ r.name?.[0] }}</span>
            <span class="pfcr-name">{{ r.name }} ({{ r.uid }})</span>
            <el-button size="small" type="success" @click="approveColleague(r)">同意</el-button>
            <el-button size="small" type="danger" @click="rejectColleague(r)">拒绝</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import http from '@/api/request'

const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const isTeacher = computed(() => auth.isTeacher)
const roleLabel = computed(() => isTeacher.value ? '老师' : auth.isStudent ? '学生' : '管理员')
const userInitial = computed(() => (user.value?.realName || '用')[0])
const avatarColor = computed(() => hashColor(user.value?.realName || 'User'))
const uidDisplay = computed(() => {
  const id = user.value?.uid || user.value?.id || ''
  return String(id).padStart(8, '0')
})

const allSubjects = ['数学','语文','英语','物理','化学','生物','历史','政治','地理']
const editSubjects = ref([])
const editBio = ref('')
const saving = ref(false)
const addUid = ref('')
const reqSending = ref(false)
const relations = ref([])
const incoming = ref([])
const colleagues = ref([])
const colleagueIncoming = ref([])
const addColleagueUid = ref('')
const colleagueSending = ref(false)

async function copyUid() { await navigator.clipboard.writeText(uidDisplay.value); ElMessage.success('UID 已复制') }

function hashColor(s) { const h = (s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0); return `hsl(${h%360},50%,60%)` }

function onAvatarChange(file) {
  // TODO: 上传头像到后端
  ElMessage.info('头像上传功能开发中')
}

async function loadProfile() {
  try { const r = await http.get('/auth/me'); editSubjects.value = r?.subjects || []; editBio.value = r?.bio || '' } catch {}
  try { const r = await http.get('/relations', { params: { type: 'teacher_student' } }); relations.value = r?.list || r || [] } catch {}
  try { const r = await http.get('/relations/incoming', { params: { type: 'teacher_student' } }); incoming.value = r?.list || r || [] } catch {}
  try { const r = await http.get('/relations', { params: { type: 'colleague' } }); colleagues.value = r?.list || r || [] } catch {}
  try { const r = await http.get('/relations/incoming', { params: { type: 'colleague' } }); colleagueIncoming.value = r?.list || r || [] } catch {}
}

async function saveBio(e) {
  try { await http.put('/auth/profile', { bio: e.target.innerText }); editBio.value = e.target.innerText } catch {}
}

function viewProfile(r) {
  const role = isTeacher.value ? 'student' : 'teacher'
  router.push(`/${role}/profile/${r.uid}`)
}

async function saveSubjects() {
  saving.value = true
  try {
    await http.put('/auth/profile', { subjects: editSubjects.value })
    // 同步更新本地 auth.user.subjects，dashboard「我的学科」立即反映
    auth.setUser({ ...(auth.user || {}), subjects: [...editSubjects.value] })
    ElMessage.success('已保存')
  } catch { ElMessage.error('保存失败') }
  saving.value = false
}

function searchUid() {
  if (!addUid.value) { ElMessage.warning('请输入UID'); return }
  const role = isTeacher.value ? 'student' : 'teacher'
  router.push(`/${role}/profile/${addUid.value}`)
}

async function sendRequest() {
  if (!addUid.value) { ElMessage.warning('请输入UID'); return }
  reqSending.value = true
  try { await http.post('/relations/request', { targetUid: String(addUid.value).padStart(8,'0') }); ElMessage.success('请求已发送'); addUid.value = '' } catch (e) { ElMessage.error(e.message||'发送失败') }
  reqSending.value = false
}

async function approveReq(r) {
  try { await http.put(`/relations/${r.id}/approve`); loadProfile(); ElMessage.success('已同意') } catch {}
}

async function rejectReq(r) {
  try { await http.put(`/relations/${r.id}/reject`); loadProfile() } catch {}
}

async function removeRelation(r) {
  try { await http.delete(`/relations/${r.id}`); loadProfile() } catch {}
}

function viewColleague(r) { router.push(`/teacher/profile/${r.uid}`) }
function searchColleague() {
  if (!addColleagueUid.value) { ElMessage.warning('请输入UID'); return }
  router.push(`/teacher/profile/${addColleagueUid.value}`)
}
async function sendColleagueRequest() {
  if (!addColleagueUid.value) { ElMessage.warning('请输入UID'); return }
  colleagueSending.value = true
  try { await http.post('/relations/request', { targetUid: String(addColleagueUid.value).padStart(8, '0'), type: 'colleague' }); ElMessage.success('请求已发送'); addColleagueUid.value = '' } catch (e) { ElMessage.error(e.message || '发送失败') }
  colleagueSending.value = false
}
async function approveColleague(r) { try { await http.put(`/relations/${r.id}/approve`); loadProfile(); ElMessage.success('已同意') } catch {} }
async function rejectColleague(r) { try { await http.put(`/relations/${r.id}/reject`); loadProfile() } catch {} }
async function removeColleague(r) { try { await http.delete(`/relations/${r.id}`); loadProfile() } catch {} }

onMounted(loadProfile)
</script>

<style scoped>
.pf-page{max-width:720px;margin:0 auto;padding:20px 14px 40px}
.pf-hero{margin-bottom:20px}.pf-hero h2{font-size:20px;font-weight:800}
.pf-cards{display:flex;flex-direction:column;gap:14px}
.pf-card{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.pfc-head{font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:14px}
.pfc-avatar{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.pfca-img{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff}
.pfca-upload{margin-left:0}
.pfci-row{display:flex;gap:12px;align-items:center;padding:6px 0;font-size:14px;color:var(--text-primary)}
.pfci-label{color:var(--text-muted);width:60px;flex-shrink:0}
.pfci-uid{font-family:monospace;color:var(--color-primary);font-size:13px}
.pfci-bio{display:block;font-size:13px;color:var(--text-secondary);min-height:24px;padding:4px 8px;border-radius:6px;outline:none;cursor:text;line-height:1.6}
.pfci-bio:focus{background:rgba(99,102,241,.04)}
.pfci-bio:empty::before{content:'点击填写个人简介…';color:var(--text-muted)}
.pfc-subjects{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}
.pfcr-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--color-border-light)}
.pfcr-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.pfcr-name{flex:1;font-size:14px;color:var(--text-primary)}
.pfcr-title{font-size:13px;font-weight:600;color:var(--text-muted);margin:12px 0 8px}
.pfc-colleague-hint{font-size:12px;color:var(--text-muted);margin-top:10px}
</style>
