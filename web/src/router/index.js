import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/HomeView.vue'),
        meta: { title: '首页' }
      },
      // ===== 教练端 =====
      {
        path: 'coach',
        component: () => import('@/layouts/CoachLayout.vue'),
        meta: { role: 'coach' },
        children: [
          {
            path: 'dashboard',
            name: 'CoachDashboard',
            component: () => import('@/views/coach/dashboard/CoachDashboard.vue'),
            meta: { title: '教练工作台' }
          },
          {
            path: 'classroom',
            name: 'CoachClassroom',
            component: () => import('@/views/coach/classroom/ClassroomView.vue'),
            meta: { title: '课堂管理' }
          },
          {
            path: 'vocab-test',
            name: 'CoachVocabTest',
            component: () => import('@/views/coach/vocabTest/VocabTestView.vue'),
            meta: { title: '词汇测试' }
          },
          {
            path: 'completed-classes',
            name: 'CompletedClasses',
            component: () => import('@/views/coach/completedClasses/CompletedClasses.vue'),
            meta: { title: '已完成课堂' }
          },
          {
            path: 'tools',
            name: 'CoachTools',
            component: () => import('@/views/coach/tools/ToolsView.vue'),
            meta: { title: '工具箱' }
          },
          {
            path: 'feedback',
            name: 'CoachFeedback',
            component: () => import('@/views/coach/feedback/FeedbackView.vue'),
            meta: { title: '学习反馈' }
          },
          {
            path: 'lexile',
            name: 'CoachLexile',
            component: () => import('@/views/coach/lexileReport/LexileReport.vue'),
            meta: { title: '蓝思值报告' }
          },
          {
            path: 'ai-reading',
            name: 'CoachAIReading',
            component: () => import('@/views/coach/aiReading/AIReadingView.vue'),
            meta: { title: 'AI 阅读理解' }
          },
          {
            path: 'ai-dialogue',
            name: 'CoachAIDialogue',
            component: () => import('@/views/coach/aiDialogue/AIDialogueView.vue'),
            meta: { title: 'AI 情境口语' }
          },
          {
            path: 'grammar',
            name: 'CoachGrammar',
            component: () => import('@/views/coach/grammar/GrammarView.vue'),
            meta: { title: '语法体系' }
          },
          {
            path: 'core-words',
            name: 'CoachCoreWords',
            component: () => import('@/views/coach/coreWords/CoreWordsView.vue'),
            meta: { title: '核心词汇' }
          },
          {
            path: 'deep-reading',
            name: 'CoachDeepReading',
            component: () => import('@/views/coach/deepReading/DeepReadingView.vue'),
            meta: { title: '深度阅读' }
          },
          {
            path: 'reading-classroom',
            name: 'ReadingClassroom',
            component: () => import('@/views/coach/readingClassroom/ReadingClassroom.vue'),
            meta: { title: '阅读课堂' }
          },
          {
            path: 'core1000-classroom',
            name: 'Core1000Classroom',
            component: () => import('@/views/coach/core1000Classroom/Core1000Classroom.vue'),
            meta: { title: '核心1000词课堂' }
          },
          {
            path: 'book-preview',
            name: 'BookPreview',
            component: () => import('@/views/coach/bookPreview/BookPreviewView.vue'),
            meta: { title: '书籍预览' }
          },
          {
            path: 'student-reading',
            name: 'StudentReadingData',
            component: () => import('@/views/coach/studentReadingData/StudentReadingData.vue'),
            meta: { title: '学生阅读数据' }
          },
          {
            path: 'sentence-practice',
            name: 'SentencePractice',
            component: () => import('@/views/coach/sentencePractice/SentencePractice.vue'),
            meta: { title: '造句练习' }
          },
          {
            path: 'word-memorize',
            name: 'WordMemorize',
            component: () => import('@/views/coach/wordMemorize/WordMemorize.vue'),
            meta: { title: '单词记忆' }
          }
        ]
      },
      // ===== 机构端 =====
      {
        path: 'agency',
        component: () => import('@/layouts/AgencyLayout.vue'),
        meta: { role: 'agency' },
        children: [
          {
            path: 'dashboard',
            name: 'AgencyDashboard',
            component: () => import('@/views/agency/dashboard/DashboardView.vue'),
            meta: { title: '机构工作台' }
          },
          {
            path: 'students',
            name: 'AgencyStudents',
            component: () => import('@/views/agency/students/StudentsView.vue'),
            meta: { title: '学员管理' }
          },
          {
            path: 'coaches',
            name: 'AgencyCoaches',
            component: () => import('@/views/agency/coaches/CoachesView.vue'),
            meta: { title: '教练管理' }
          },
          {
            path: 'coaches/:id',
            name: 'AgencyCoachDetail',
            component: () => import('@/views/agency/coaches/CoachDetailView.vue'),
            meta: { title: '教练详情' }
          },
          {
            path: 'courses',
            name: 'AgencyCourses',
            component: () => import('@/views/agency/courses/CoursesView.vue'),
            meta: { title: '课程管理' }
          },
          {
            path: 'schedule',
            name: 'AgencySchedule',
            component: () => import('@/views/agency/schedule/ScheduleView.vue'),
            meta: { title: '排课管理' }
          },
          {
            path: 'crm',
            name: 'AgencyCRM',
            component: () => import('@/views/agency/crm/CRMView.vue'),
            meta: { title: '销售中心' }
          },
          {
            path: 'crm/:id',
            name: 'AgencyCRMLeadDetail',
            component: () => import('@/views/agency/crm/LeadDetailView.vue'),
            meta: { title: '线索详情' }
          },
          {
            path: 'records',
            name: 'AgencyRecords',
            component: () => import('@/views/agency/records/RecordsView.vue'),
            meta: { title: '学习记录' }
          },
          {
            path: 'tools',
            name: 'AgencyTools',
            component: () => import('@/views/agency/tools/ToolsView.vue'),
            meta: { title: '工具箱' }
          },
          {
            path: 'study-plan',
            name: 'AgencyStudyPlan',
            component: () => import('@/views/agency/studyPlan/StudyPlanView.vue'),
            meta: { title: '学习规划' }
          },
          {
            path: 'lexile',
            name: 'AgencyLexile',
            component: () => import('@/views/agency/lexileInterpret/LexileView.vue'),
            meta: { title: '蓝思值解读' }
          },
          {
            path: 'feedback',
            name: 'AgencyFeedback',
            component: () => import('@/views/agency/feedback/FeedbackView.vue'),
            meta: { title: '学习反馈' }
          },
          {
            path: 'certificate',
            name: 'AgencyCertificate',
            component: () => import('@/views/agency/certificate/CertificateView.vue'),
            meta: { title: '证书管理' }
          },
          {
            path: 'referral',
            name: 'AgencyReferral',
            component: () => import('@/views/agency/referral/ReferralView.vue'),
            meta: { title: '转介绍' }
          },
          {
            path: 'poster',
            name: 'AgencyPoster',
            component: () => import('@/views/agency/posterResources/PosterView.vue'),
            meta: { title: '宣传物料' }
          }
        ]
      },
      // ===== 平台端 =====
      {
        path: 'platform',
        component: () => import('@/layouts/PlatformLayout.vue'),
        meta: { role: 'admin' },
        children: [
          {
            path: 'dashboard',
            name: 'PlatformDashboard',
            component: () => import('@/views/platform/dashboard/DashboardView.vue'),
            meta: { title: '平台概览' }
          },
          {
            path: 'organizations',
            name: 'PlatformOrganizations',
            component: () => import('@/views/platform/organizations/OrganizationsView.vue'),
            meta: { title: '机构管理' }
          },
          {
            path: 'coaches',
            name: 'PlatformCoaches',
            component: () => import('@/views/platform/coaches/CoachesView.vue'),
            meta: { title: '教练管理' }
          },
          {
            path: 'students',
            name: 'PlatformStudents',
            component: () => import('@/views/platform/students/StudentsView.vue'),
            meta: { title: '学员管理' }
          },
          {
            path: 'word-libraries',
            name: 'PlatformWordLibraries',
            component: () => import('@/views/platform/wordLibraries/WordLibrariesView.vue'),
            meta: { title: '词库管理' }
          },
          {
            path: 'grammar-libraries',
            name: 'PlatformGrammarLibraries',
            component: () => import('@/views/platform/grammarLibraries/GrammarLibrariesView.vue'),
            meta: { title: '语法库管理' }
          },
          {
            path: 'book-libraries',
            name: 'PlatformBookLibraries',
            component: () => import('@/views/platform/bookLibraries/BookLibrariesView.vue'),
            meta: { title: '书库管理' }
          },
          {
            path: 'referral',
            name: 'PlatformReferral',
            component: () => import('@/views/platform/referral/ReferralView.vue'),
            meta: { title: '转介绍' }
          },
          {
            path: 'poster',
            name: 'PlatformPoster',
            component: () => import('@/views/platform/posterResources/PosterView.vue'),
            meta: { title: '宣传物料' }
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/RegisterView.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 阅读云英语` : '阅读云英语'
  const authStore = useAuthStore()
  if (to.path !== '/login' && to.path !== '/register' && !authStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
