import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/login',  name: 'Login',    component: () => import('@/views/login/LoginView.vue'),    meta: { title: '登录' } },
  { path: '/register', name: 'Register', component: () => import('@/views/register/RegisterView.vue'), meta: { title: '注册' } },
  { path: '/', name: 'Home', component: () => import('@/views/home/HomeView.vue'), meta: { title: '安文AI教育' } },

  // ===== 教练端 =====
  {
    path: '/coach', component: () => import('@/layouts/CoachLayout.vue'), meta: { role: 'coach' },
    children: [
      { path: '', redirect: '/coach/dashboard' },
      { path: 'dashboard', name: 'CoachDashboard', component: () => import('@/views/coach/dashboard/CoachDashboard.vue'), meta: { title: '工作台' } },
      // 英语
      { path: 'classroom', name: 'CoachClassroom', component: () => import('@/views/coach/classroom/ClassroomView.vue'), meta: { title: '课堂管理' } },
      { path: 'vocab-test', name: 'CoachVocabTest', component: () => import('@/views/coach/vocabTest/VocabTestView.vue'), meta: { title: '词汇测试' } },
      { path: 'word-memorize', name: 'WordMemorize', component: () => import('@/views/coach/wordMemorize/WordMemorize.vue'), meta: { title: '单词记忆' } },
      { path: 'core-words', name: 'CoachCoreWords', component: () => import('@/views/coach/coreWords/CoreWordsView.vue'), meta: { title: '核心词汇' } },
      { path: 'ai-reading', name: 'CoachAIReading', component: () => import('@/views/coach/aiReading/AIReadingView.vue'), meta: { title: 'AI阅读理解' } },
      { path: 'deep-reading', name: 'CoachDeepReading', component: () => import('@/views/coach/deepReading/DeepReadingView.vue'), meta: { title: '深度阅读' } },
      { path: 'ai-dialogue', name: 'CoachAIDialogue', component: () => import('@/views/coach/aiDialogue/AIDialogueView.vue'), meta: { title: 'AI情境口语' } },
      { path: 'grammar', name: 'CoachGrammar', component: () => import('@/views/coach/grammar/GrammarView.vue'), meta: { title: '语法体系' } },
      { path: 'sentence-practice', name: 'SentencePractice', component: () => import('@/views/coach/sentencePractice/SentencePractice.vue'), meta: { title: '造句练习' } },
      { path: 'reading-classroom', name: 'ReadingClassroom', component: () => import('@/views/coach/readingClassroom/ReadingClassroom.vue'), meta: { title: '阅读课堂' } },
      { path: 'completed-classes', name: 'CompletedClasses', component: () => import('@/views/coach/completedClasses/CompletedClasses.vue'), meta: { title: '已完成课堂' } },
      { path: 'feedback', name: 'CoachFeedback', component: () => import('@/views/coach/feedback/FeedbackView.vue'), meta: { title: '学习反馈' } },
      { path: 'tools', name: 'CoachTools', component: () => import('@/views/coach/tools/ToolsView.vue'), meta: { title: '工具箱' } },
      // 学科通用 — 动态路由
      {
        path: 'subject/:subject',
        component: () => import('@/views/coach/subject/SubjectLayout.vue'),
        children: [
          { path: '', redirect: to => `/coach/subject/${to.params.subject}/wrong-questions` },
          { path: 'wrong-questions',  component: () => import('@/views/coach/subject/WrongQuestions.vue'),  meta: { title: '错题整理' } },
          { path: 'wrong-analysis',   component: () => import('@/views/coach/subject/WrongAnalysis.vue'),   meta: { title: '错题分析' } },
          { path: 'knowledge-points', component: () => import('@/views/coach/subject/KnowledgePoints.vue'), meta: { title: '知识点' } },
          { path: 'exam-points',      component: () => import('@/views/coach/subject/ExamPoints.vue'),      meta: { title: '考点整理' } },
          { path: 'solution-models',  component: () => import('@/views/coach/subject/SolutionModels.vue'),  meta: { title: '解题模型' } },
          { path: 'question-bank',    component: () => import('@/views/coach/subject/QuestionBank.vue'),    meta: { title: '题库' } },
          { path: 'ai-feedback',      component: () => import('@/views/coach/subject/AIFeedback.vue'),      meta: { title: 'AI课堂反馈' } },
          { path: 'ai-analysis',      component: () => import('@/views/coach/subject/AIAnalysis.vue'),      meta: { title: 'AI综合分析' } },
          { path: 'score-statistics', component: () => import('@/views/coach/subject/ScoreStats.vue'),      meta: { title: '成绩统计' } }
        ]
      }
    ]
  },

  // ===== 机构端 =====
  {
    path: '/agency', component: () => import('@/layouts/AgencyLayout.vue'), meta: { role: 'agency' },
    children: [
      { path: '', redirect: '/agency/dashboard' },
      { path: 'dashboard',  component: () => import('@/views/agency/dashboard/DashboardView.vue'),  meta: { title: '机构工作台' } },
      { path: 'students',   component: () => import('@/views/agency/students/StudentsView.vue'),    meta: { title: '学员管理' } },
      { path: 'coaches',    component: () => import('@/views/agency/coaches/CoachesView.vue'),      meta: { title: '教练管理' } },
      { path: 'coaches/:id',component: () => import('@/views/agency/coaches/CoachDetailView.vue'),  meta: { title: '教练详情' } },
      { path: 'courses',    component: () => import('@/views/agency/courses/CoursesView.vue'),      meta: { title: '课程管理' } },
      { path: 'schedule',   component: () => import('@/views/agency/schedule/ScheduleView.vue'),    meta: { title: '排课管理' } },
      { path: 'crm',        component: () => import('@/views/agency/crm/CRMView.vue'),              meta: { title: '销售中心' } },
      { path: 'crm/:id',    component: () => import('@/views/agency/crm/LeadDetailView.vue'),       meta: { title: '线索详情' } },
      { path: 'records',    component: () => import('@/views/agency/records/RecordsView.vue'),      meta: { title: '学习记录' } },
      { path: 'study-plan', component: () => import('@/views/agency/studyPlan/StudyPlanView.vue'),  meta: { title: '学习规划' } },
      { path: 'feedback',   component: () => import('@/views/agency/feedback/FeedbackView.vue'),    meta: { title: '学习反馈' } },
      { path: 'certificate',component: () => import('@/views/agency/certificate/CertificateView.vue'), meta: { title: '证书管理' } },
      { path: 'referral',   component: () => import('@/views/agency/referral/ReferralView.vue'),    meta: { title: '转介绍' } },
      { path: 'poster',     component: () => import('@/views/agency/posterResources/PosterView.vue'), meta: { title: '宣传物料' } },
      { path: 'tools',      component: () => import('@/views/agency/tools/ToolsView.vue'),          meta: { title: '工具箱' } }
    ]
  },

  // ===== 平台端 =====
  {
    path: '/platform', component: () => import('@/layouts/PlatformLayout.vue'), meta: { role: 'admin' },
    children: [
      { path: '', redirect: '/platform/dashboard' },
      { path: 'dashboard',        component: () => import('@/views/platform/dashboard/DashboardView.vue'),           meta: { title: '平台概览' } },
      { path: 'organizations',    component: () => import('@/views/platform/organizations/OrganizationsView.vue'),   meta: { title: '机构管理' } },
      { path: 'coaches',          component: () => import('@/views/platform/coaches/CoachesView.vue'),               meta: { title: '教练管理' } },
      { path: 'students',         component: () => import('@/views/platform/students/StudentsView.vue'),             meta: { title: '学员管理' } },
      { path: 'word-libraries',   component: () => import('@/views/platform/wordLibraries/WordLibrariesView.vue'),   meta: { title: '词库管理' } },
      { path: 'grammar-libraries',component: () => import('@/views/platform/grammarLibraries/GrammarLibrariesView.vue'), meta: { title: '语法库' } },
      { path: 'book-libraries',   component: () => import('@/views/platform/bookLibraries/BookLibrariesView.vue'),   meta: { title: '书库管理' } },
      { path: 'referral',         component: () => import('@/views/platform/referral/ReferralView.vue'),             meta: { title: '转介绍' } },
      { path: 'poster',           component: () => import('@/views/platform/posterResources/PosterView.vue'),        meta: { title: '宣传物料' } }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} · 安文AI教育` : '安文AI教育'
  const authStore = useAuthStore()
  if (to.path !== '/login' && to.path !== '/register' && to.path !== '/' && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
