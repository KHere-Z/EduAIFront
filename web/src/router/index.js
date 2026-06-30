import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/',        name: 'Home',     component: () => import('@/views/home/HomeView.vue'),      meta: { title: '安文AI教育' } },
  { path: '/login',   name: 'Login',    component: () => import('@/views/login/LoginView.vue'),     meta: { title: '登录' } },
  { path: '/register',name: 'Register', component: () => import('@/views/register/RegisterView.vue'), meta: { title: '注册' } },

  // ===== 老师端 =====
  {
    path: '/teacher', component: () => import('@/layouts/TeacherLayout.vue'), meta: { role: 'teacher' },
    children: [
      { path: '', redirect: '/teacher/dashboard' },
      { path: 'dashboard', name: 'TeacherDashboard', component: () => import('@/views/teacher/dashboard/DashboardView.vue'), meta: { title: '工作台' } },
      // 英语
      { path: 'classroom',   component: () => import('@/views/teacher/english/ClassroomView.vue'),   meta: { title: '课堂管理' } },
      { path: 'vocab-test',  component: () => import('@/views/teacher/english/VocabTestView.vue'),   meta: { title: '词汇测试' } },
      { path: 'word-memorize',component: () => import('@/views/teacher/english/WordMemorize.vue'),   meta: { title: '单词记忆' } },
      { path: 'ai-reading',  component: () => import('@/views/teacher/english/AIReadingView.vue'),   meta: { title: 'AI阅读理解' } },
      { path: 'ai-dialogue', component: () => import('@/views/teacher/english/AIDialogueView.vue'),  meta: { title: 'AI情境口语' } },
      { path: 'grammar',     component: () => import('@/views/teacher/english/GrammarView.vue'),      meta: { title: '语法体系' } },
      { path: 'sentence-practice', component: () => import('@/views/teacher/english/SentencePractice.vue'), meta: { title: '造句练习' } },
      { path: 'feedback',    component: () => import('@/views/teacher/english/FeedbackView.vue'),    meta: { title: '学习反馈' } },
      // 学科中心 — 动态路由 9 学科复用
      {
        path: 'subject/:subject',
        component: () => import('@/views/teacher/subject/SubjectLayout.vue'),
        children: [
          { path: '', redirect: to => `/teacher/subject/${to.params.subject}/wrong-questions` },
          { path: 'wrong-questions',  component: () => import('@/views/teacher/subject/WrongQuestions.vue'),  meta: { title: '错题整理' } },
          { path: 'wrong-analysis',   component: () => import('@/views/teacher/subject/WrongAnalysis.vue'),   meta: { title: '错题分析' } },
          { path: 'knowledge-points', component: () => import('@/views/teacher/subject/KnowledgePoints.vue'), meta: { title: '知识点' } },
          { path: 'exam-points',      component: () => import('@/views/teacher/subject/ExamPoints.vue'),      meta: { title: '考点' } },
          { path: 'solution-models',  component: () => import('@/views/teacher/subject/SolutionModels.vue'),  meta: { title: '解题模型' } },
          { path: 'question-bank',    component: () => import('@/views/teacher/subject/QuestionBank.vue'),    meta: { title: '题库' } },
          { path: 'ai-feedback',      component: () => import('@/views/teacher/subject/AIFeedback.vue'),      meta: { title: 'AI课堂反馈' } },
          { path: 'ai-analysis',      component: () => import('@/views/teacher/subject/AIAnalysis.vue'),      meta: { title: 'AI综合分析' } },
          { path: 'score-statistics', component: () => import('@/views/teacher/subject/ScoreStats.vue'),      meta: { title: '成绩统计' } }
        ]
      }
    ]
  },

  // ===== 学生端 =====
  {
    path: '/student', component: () => import('@/layouts/StudentLayout.vue'), meta: { role: 'student' },
    children: [
      { path: '', redirect: '/student/dashboard' },
      { path: 'dashboard',      component: () => import('@/views/student/dashboard/DashboardView.vue'),      meta: { title: '学习中心' } },
      { path: 'wrong-book',     component: () => import('@/views/student/wrongbook/WrongBook.vue'),          meta: { title: '我的错题本' } },
      { path: 'ai-analysis',    component: () => import('@/views/student/analysis/AIAnalysis.vue'),          meta: { title: 'AI学情分析' } },
      { path: 'scores',         component: () => import('@/views/student/scores/ScoreView.vue'),             meta: { title: '我的成绩' } },
      { path: 'practice',       component: () => import('@/views/student/practice/PracticeView.vue'),        meta: { title: '智能练习' } },
      // 学生学科入口（只读）
      { path: 'subject/:subject',  component: () => import('@/views/student/subject/SubjectView.vue'),       meta: { title: '学科学习' } }
    ]
  },

  // ===== 管理员端 =====
  {
    path: '/admin', component: () => import('@/layouts/AdminLayout.vue'), meta: { role: 'admin' },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard',       component: () => import('@/views/admin/dashboard/DashboardView.vue'),         meta: { title: '管理后台' } },
      { path: 'teachers',        component: () => import('@/views/admin/teachers/TeachersView.vue'),           meta: { title: '老师管理' } },
      { path: 'students',        component: () => import('@/views/admin/students/StudentsView.vue'),           meta: { title: '学生管理' } },
      { path: 'subjects',        component: () => import('@/views/admin/subjects/SubjectsView.vue'),           meta: { title: '学科管理' } },
      { path: 'word-libraries',  component: () => import('@/views/admin/resources/WordLibrariesView.vue'),     meta: { title: '词库管理' } },
      { path: 'grammar-libraries',component: () => import('@/views/admin/resources/GrammarLibrariesView.vue'),meta: { title: '语法库' } },
      { path: 'question-bank',   component: () => import('@/views/admin/resources/QuestionBankView.vue'),      meta: { title: '题库总管理' } }
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} · 安文AI教育` : '安文AI教育'
  const authStore = useAuthStore()
  const publicPaths = ['/', '/login', '/register']
  if (!publicPaths.includes(to.path) && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
