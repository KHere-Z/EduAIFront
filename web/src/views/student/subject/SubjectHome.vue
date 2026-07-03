<template>
  <div class="sub-home">
    <div class="sub-hero">
      <div class="sh-emoji">{{ icon }}</div>
      <h2>{{ label }} 学科中心</h2>
      <p>选一个功能开始学习吧～</p>
    </div>
    <div class="sub-grid" v-if="isMath">
      <div class="s-card" v-for="f in features" :key="f.path" @click="$router.push(f.path)" :style="{background:f.bg}">
        <span class="sc-emoji">{{ f.emoji }}</span>
        <span class="sc-label">{{ f.title }}</span>
        <span class="sc-desc">{{ f.desc }}</span>
      </div>
    </div>
    <div v-else class="coming-soon">
      <div class="cs-emoji">🚧</div>
      <h3>功能开发中</h3>
      <p>{{ label }}学科中心即将上线，敬请期待～</p>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'; import { useRoute } from 'vue-router'
const r=useRoute()
const icons={math:'📐',chinese:'📝',english:'📖',physics:'⚛️',chemistry:'🧪',biology:'🧬',history:'📜',politics:'⚖️',geography:'🌍'}
const labels={math:'数学',chinese:'语文',english:'英语',physics:'物理',chemistry:'化学',biology:'生物',history:'历史',politics:'政治',geography:'地理'}
const isMath=computed(()=>r.params.subject==='math')
const icon=computed(()=>icons[r.params.subject]||'📚')
const label=computed(()=>labels[r.params.subject]||'学科')
const g=(a,b)=>`linear-gradient(135deg,${a},${b})`
const features=[
  { title:'AI错题分析', emoji:'📸', desc:'拍照上传→AI解析', path:`/student/subject/${r.params.subject}/wrong-analysis`, bg:g('#FFE4E1','#FFCDD2') },
  { title:'AI试卷分析', emoji:'📄', desc:'上传试卷→扣分诊断', path:`/student/subject/${r.params.subject}/exam-analysis`, bg:g('#FFF0DB','#FFE0B2') },
  { title:'题库挑战',   emoji:'🎯', desc:'错题库·计时自习', path:`/student/subject/${r.params.subject}/question-bank`, bg:g('#E8F5E9','#C8E6C9') },
  { title:'AI动图',     emoji:'🎬', desc:'动点题→动态图', path:`/student/subject/${r.params.subject}/ai-animation`, bg:g('#E3F2FD','#BBDEFB') },
  { title:'AI聊天',     emoji:'💬', desc:'智能问答辅导', path:`/student/subject/${r.params.subject}/ai-chat`, bg:g('#F3E5F5','#E1BEE7') },
  { title:'知识点',     emoji:'📖', desc:'本学期知识体系', path:`/student/subject/${r.params.subject}/knowledge-points`, bg:g('#FFF9C4','#FFF176') },
  { title:'作业',       emoji:'✏️', desc:'完成打勾·老师看', path:`/student/subject/${r.params.subject}/homework`, bg:g('#F1F8E9','#DCEDC8') },
  { title:'近期反馈',   emoji:'📊', desc:'学习报告·老师评语', path:`/student/subject/${r.params.subject}/feedback`, bg:g('#EDE7F6','#D1C4E9') },
]
</script>
<style scoped>
.sub-home { max-width: 800px; margin: 0 auto; padding: 20px 12px 40px; }
.sub-hero { text-align: center; padding: 24px 12px; }
.sh-emoji { font-size: 56px; animation: bounce 2s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.sub-hero h2 { font-size: 24px; font-weight: 800; margin: 8px 0 4px; }
.sub-hero p { font-size: 14px; color: #777; }
.sub-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
.s-card { padding: 22px 14px; border-radius: 20px; text-align: center; cursor: pointer; transition: all .2s; box-shadow: 0 2px 12px rgba(0,0,0,.04); display: flex; flex-direction: column; align-items: center; gap: 4px; }
.s-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.sc-emoji { font-size: 36px; }
.sc-label { font-size: 15px; font-weight: 700; color: #333; }
.sc-desc { font-size: 12px; color: #777; }
@media (max-width: 480px) {
  .sub-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .s-card { padding: 16px 8px; }
  .sc-emoji { font-size: 26px; }
  .sc-label { font-size: 12px; }
}
</style>
