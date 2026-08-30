// 日志采集器：必须在最顶部 import（副作用式覆盖 console，生产环境拦截并上报）
import './utils/logger'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoading } from 'element-plus'
import {
  ArrowLeft, ArrowRight, Avatar, Bell, Calendar, ChatLineSquare, Check,
  CircleCheckFilled, CircleCloseFilled, Close, Coin, Collection, DataAnalysis,
  Document, Edit, EditPen, Files, FolderOpened, Grid, InfoFilled, MagicStick,
  Notebook, Plus, Reading, Search, SetUp, Star, SuccessFilled, SwitchButton,
  TrendCharts, UploadFilled, User, Wallet, Warning
} from '@element-plus/icons-vue'
// Element Plus 基础变量 / reset（模板组件样式由 unplugin-vue-components 按需引入）
import 'element-plus/theme-chalk/base.css'
// 程序化 API（ElMessage/ElMessageBox）与 v-loading 指令的样式需手动引入
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'
import router from './router'
import App from './App.vue'
import './assets/styles/global.css'

// ============================================================
// Edge 最小化「闪一下又弹回」修复
// Vue Router 4.6.x 在 visibilitychange→hidden 时会调用 history.replaceState
// 保存滚动位置；Edge 在 hidden 状态下执行 history 更新会错误触发「页面激活」，
// 导致窗口最小化后闪一下、无法最小化（Chrome 等浏览器不受影响）。
// 这里拦截：页面隐藏时禁止执行任何 history 操作。
// ============================================================
const _origPushState = window.history.pushState.bind(window.history)
const _origReplaceState = window.history.replaceState.bind(window.history)
window.history.pushState = function (...args) {
  if (document.visibilityState === 'hidden') return
  return _origPushState(...args)
}
window.history.replaceState = function (...args) {
  if (document.visibilityState === 'hidden') return
  return _origReplaceState(...args)
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElLoading)

// 全局注册实际用到的图标（仅这些，避免整包 ~170KB）
const iconComponents = {
  ArrowLeft, ArrowRight, Avatar, Bell, Calendar, ChatLineSquare, Check,
  CircleCheckFilled, CircleCloseFilled, Close, Coin, Collection, DataAnalysis,
  Document, Edit, EditPen, Files, FolderOpened, Grid, InfoFilled, MagicStick,
  Notebook, Plus, Reading, Search, SetUp, Star, SuccessFilled, SwitchButton,
  TrendCharts, UploadFilled, User, Wallet, Warning
}
for (const [key, component] of Object.entries(iconComponents)) {
  app.component(key, component)
}

app.mount('#app')
