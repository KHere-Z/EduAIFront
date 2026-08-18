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
