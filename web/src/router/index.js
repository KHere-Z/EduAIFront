import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/',        name: 'Home',     component: () => import('@/views/home/HomeView.vue'),      meta: { title: '智学AI教育' } },
  { path: '/login',   name: 'Login',    component: () => import('@/views/login/LoginView.vue'),     meta: { title: '登录' } },
  { path: '/register',name: 'Register', component: () => import('@/views/login/RegisterView.vue'), meta: { title: '注册' } },

  // ===== 老师端 =====
  {
    path: '/teacher', component: () => import('@/layouts/TeacherLayout.vue'), meta: { role: 'teacher' },
    children: [
      { path: '', redirect: '/teacher/dashboard' },
      { path: 'dashboard', name: 'TeacherDashboard', component: () => import('@/views/teacher/dashboard/DashboardView.vue'), meta: { title: '工作台' } },
      // 学生管理
      { path: 'students', name: 'TeacherStudents', component: () => import('@/views/teacher/students/StudentsView.vue'), meta: { title: '学生信息管理' } },
      // 老师端学科管理
      { path: 'subject/math/manage', component: () => import('@/views/teacher/subject/pages/MathManage.vue'), meta: { title: '数学学科管理' } },
      { path: 'subject/math/batch-upload', component: () => import('@/views/teacher/subject/pages/BatchUpload.vue'), meta: { title: '批量上传题目' } },
      { path: 'subject/math/kp-resources/:kpId', component: () => import('@/views/teacher/subject/pages/KpResourcesView.vue'), meta: { title: '资源管理' } },
      { path: 'subject/math/exam-builder', component: () => import('@/views/teacher/subject/pages/MathExamBuilder.vue'), meta: { title: '出卷' } },
      // 英语首页
      { path: 'english/home', component: () => import('@/views/teacher/english/EnglishHome.vue'), meta: { title: '英语学科中心' } },
      { path: 'english/word-progress', component: () => import('@/views/teacher/english/WordProgress.vue'), meta: { title: '单词学习进度' } },
      // 英语功能页
      { path: 'classroom',   component: () => import('@/views/teacher/english/ClassroomView.vue'),   meta: { title: '课堂管理' } },
      { path: 'vocab-test',  component: () => import('@/views/teacher/english/VocabTestView.vue'),   meta: { title: '词汇测试' } },
      { path: 'word-memorize',component: () => import('@/views/teacher/english/WordMemorize.vue'),   meta: { title: '单词记忆' } },
      { path: 'ai-reading',  component: () => import('@/views/teacher/english/AIReadingView.vue'),   meta: { title: 'AI阅读理解' } },
      { path: 'ai-dialogue', component: () => import('@/views/teacher/english/AIDialogueView.vue'),  meta: { title: 'AI情境口语' } },
      { path: 'grammar',     component: () => import('@/views/teacher/english/GrammarView.vue'),      meta: { title: '语法体系' } },
      { path: 'sentence-practice', component: () => import('@/views/teacher/english/SentencePractice.vue'), meta: { title: '造句练习' } },
      { path: 'profile',     component: () => import('@/views/profile/ProfileView.vue'),               meta: { title: '个人中心' } },
      { path: 'profile/:uid',component: () => import('@/views/profile/UserProfileView.vue'),          meta: { title: '用户主页' } },
      { path: 'recharge',    component: () => import('@/views/recharge/RechargeView.vue'),            meta: { title: '智学点充值' } },
      { path: 'revenue',     component: () => import('@/views/teacher/revenue/RevenueView.vue'),     meta: { title: '收益中心' } },
      { path: 'messages',    component: () => import('@/views/teacher/messages/TeacherMessages.vue'), meta: { title: '消息中心' } },
      { path: 'feedback',    component: () => import('@/views/teacher/english/FeedbackView.vue'),    meta: { title: '学习反馈' } },
      { path: 'paper-reformat', component: () => import('@/views/teacher/paper/PaperReformat.vue'), meta: { title: 'PDF转Word' } },
      // 学科中心 — 动态路由 9 学科
      {
        path: 'subject/:subject',
        component: () => import('@/views/teacher/subject/SubjectCenter.vue'),
      },
      // 学科功能页（只保留数学4个核心功能）
      { path: 'subject/math/wrong-analysis', component: () => import('@/views/student/subject/WrongAnalysis.vue'), meta: { title: 'AI错题分析' } },
      { path: 'subject/math/exam-analysis',  component: () => import('@/views/student/subject/ExamAnalysis.vue'),  meta: { title: 'AI试卷分析' } },
      { path: 'subject/math/ai-animation',   component: () => import('@/views/student/subject/AIAnimation.vue'),   meta: { title: 'AI动图' } },
      { path: 'subject/math/ai-animation-history', component: () => import('@/views/student/subject/AIAnimationHistory.vue'), meta: { title: '动图历史' } },
      { path: 'subject/math/resources',       component: () => import('@/views/student/subject/ResourcesView.vue'), meta: { title: '学习资源' } },
    ]
  },

  // ===== 学生端 =====
  {
    path: '/student', component: () => import('@/layouts/StudentLayout.vue'), meta: { role: 'student' },
    children: [
      { path: '', redirect: '/student/dashboard' },
      { path: 'profile',         component: () => import('@/views/profile/ProfileView.vue'),               meta: { title: '个人中心' } },
      { path: 'profile/:uid',    component: () => import('@/views/profile/UserProfileView.vue'),          meta: { title: '用户主页' } },
      { path: 'recharge',       component: () => import('@/views/recharge/RechargeView.vue'),            meta: { title: '智学点充值' } },
      { path: 'dashboard',      component: () => import('@/views/student/dashboard/DashboardView.vue'),      meta: { title: '学习中心' } },
      { path: 'schedule',       component: () => import('@/views/student/schedule/ScheduleView.vue'),        meta: { title: '课程表' } },
      // 学科中心
      { path: 'subject/:subject', component: () => import('@/views/student/subject/SubjectHome.vue'), meta: { title: '学科中心' } },
      { path: 'subject/:subject/wrong-analysis',   component: () => import('@/views/student/subject/WrongAnalysis.vue'),   meta: { title: 'AI错题分析' } },
      { path: 'subject/:subject/exam-analysis',    component: () => import('@/views/student/subject/ExamAnalysis.vue'),    meta: { title: 'AI试卷分析' } },
      { path: 'subject/:subject/question-bank',    component: () => import('@/views/student/subject/QuestionBank.vue'),    meta: { title: '题库' } },
      { path: 'subject/:subject/ai-animation',     component: () => import('@/views/student/subject/AIAnimation.vue'),     meta: { title: 'AI动图' } },
      { path: 'subject/:subject/ai-animation-history', component: () => import('@/views/student/subject/AIAnimationHistory.vue'), meta: { title: '动图历史' } },
      { path: 'subject/:subject/knowledge-points', component: () => import('@/views/student/subject/KnowledgePoints.vue'), meta: { title: '知识点' } },
      { path: 'subject/:subject/knowledge-points/:kpId', component: () => import('@/views/student/subject/KpDetailView.vue'), meta: { title: '资源详情' } },
      { path: 'subject/:subject/homework',         component: () => import('@/views/student/subject/Homework.vue'),         meta: { title: '作业' } },
      { path: 'subject/:subject/feedback',         component: () => import('@/views/student/subject/FeedbackView.vue'),     meta: { title: '近期反馈' } },
      { path: 'subject/:subject/resources',       component: () => import('@/views/student/subject/ResourcesView.vue'),    meta: { title: '学习资源' } },
      { path: 'wrong-book',     component: () => import('@/views/student/wrongbook/WrongBook.vue'),          meta: { title: '我的错题本' } },
      { path: 'ai-analysis',    component: () => import('@/views/student/analysis/AIAnalysis.vue'),          meta: { title: 'AI学情分析' } },
      { path: 'scores',         component: () => import('@/views/student/scores/ScoreView.vue'),             meta: { title: '我的成绩' } },
      { path: 'practice',       component: () => import('@/views/student/practice/PracticeView.vue'),        meta: { title: '智能练习' } },
    ]
  },

  // ===== 管理员端 =====
  {
    path: '/admin', component: () => import('@/layouts/AdminLayout.vue'), meta: { role: 'admin' },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('@/views/admin/dashboard/DashboardView.vue'),   meta: { title: '管理后台' } },
      { path: 'students',  component: () => import('@/views/admin/students/StudentsView.vue'),    meta: { title: '学生管理' } },
      { path: 'teachers',  component: () => import('@/views/admin/teachers/TeachersView.vue'),    meta: { title: '老师管理' } },
      { path: 'schedules', component: () => import('@/views/admin/teachers/ScheduleView.vue'),    meta: { title: '排课查看' } },
      { path: 'settings',  component: () => import('@/views/admin/settings/SettingsView.vue'),    meta: { title: '系统设置' } },
      { path: 'resources', component: () => import('@/views/admin/resources/ResourcesUploadView.vue'), meta: { title: '学习资源上传' } },
      { path: 'resource-review', component: () => import('@/views/admin/resources/ResourceReviewView.vue'), meta: { title: '资源审核' } },
      { path: 'withdraws', component: () => import('@/views/admin/withdraws/WithdrawReviewView.vue'), meta: { title: '提现审核' } }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} · 智学AI教育` : '智学AI教育'
  const authStore = useAuthStore()
  const publicPaths = ['/', '/login', '/register']
  if (!publicPaths.includes(to.path) && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

// 懒加载 chunk 404 兜底：部署后浏览器可能缓存旧 index.html（引用旧 chunk 哈希），
// 会话中导航触发动态 import 失败。这里强制整页刷新一次，重新拉取最新 index.html 与 chunk。
router.onError((error) => {
  const msg = error?.message || ''
  const isChunkError = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(msg)
  if (!isChunkError) return
  const last = Number(sessionStorage.getItem('__chunk_reload_ts') || 0)
  if (Date.now() - last < 5000) return // 5 秒内只刷新一次，避免死循环
  sessionStorage.setItem('__chunk_reload_ts', String(Date.now()))
  window.location.reload()
})

export default router
