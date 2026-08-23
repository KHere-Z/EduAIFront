<template>
  <div class="up-page">
    <div class="up-back"><el-button text @click="$router.back()">← 返回</el-button></div>

    <div class="up-card" v-if="profile">
      <div class="upc-avatar" :style="{background: hashColor(profile.name)}">
        <img v-if="profile.avatar" :src="profile.avatar" class="upc-photo" alt="头像" />
        <template v-else>{{ profile.name?.[0] }}</template>
      </div>
      <h2>{{ profile.name }}</h2>
      <p class="upc-role">{{ profile.role==='teacher'?'老师':'学生' }} · UID {{ String(profile.uid||'').padStart(8,'0') }}</p>

      <div class="upc-bio" v-if="profile.bio">
        <div class="upcb-label">个人简介</div>
        <p>{{ profile.bio }}</p>
      </div>

      <div class="upc-subjects" v-if="profile.subjects?.length">
        <div class="upcb-label">学科</div>
        <el-tag v-for="s in profile.subjects" :key="s" size="small" type="primary" effect="plain" style="margin:2px">{{ s }}</el-tag>
      </div>

      <div class="upc-actions" v-if="!isSelf">
        <el-button v-if="!profile.isRelated" type="primary" size="small" @click="sendReq">发送关联请求</el-button>
        <el-tag v-else type="success" size="small">已关联</el-tag>
      </div>
    </div>

    <el-empty v-else description="用户不存在" :image-size="100"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '@/api/request'

const route = useRoute()
const uid = route.params.uid
const profile = ref(null)
const isSelf = ref(false)

function hashColor(s) { const h = (s||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0); return `hsl(${h%360},50%,60%)` }

async function sendReq() {
  try { await http.post('/relations/request', { targetUid: String(uid).padStart(8,'0') }); ElMessage.success('请求已发送') } catch (e) { ElMessage.error(e.message||'发送失败') }
}

onMounted(async () => {
  try {
    const r = await http.get(`/users/${uid}`)
    profile.value = r
    try { const me = await http.get('/auth/me'); isSelf.value = me?.id === r?.id } catch {}
  } catch {}
})
</script>

<style scoped>
.up-page{max-width:480px;margin:0 auto;padding:20px 14px 40px}
.up-back{margin-bottom:16px}
.up-card{background:#fff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.04);border:1px solid var(--color-border)}
.upc-avatar{width:72px;height:72px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#fff;margin-bottom:14px;overflow:hidden}
.upc-photo{width:100%;height:100%;object-fit:cover;display:block}
.up-card h2{font-size:22px;font-weight:700;margin-bottom:4px;color:var(--text-primary)}
.upc-role{font-size:13px;color:var(--text-muted);margin-bottom:20px}
.upcb-label{font-size:12px;color:var(--text-muted);margin-bottom:6px}
.upc-bio{margin-bottom:20px;text-align:left}.upc-bio p{font-size:14px;line-height:1.8;color:var(--text-secondary);white-space:pre-wrap}
.upc-subjects{margin-bottom:20px}.upc-actions{margin-top:12px}
</style>
