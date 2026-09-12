<template>
  <div class="rc-page">
    <div class="rc-hero">
      <h2>💰 智学点</h2>
      <p>1元 = 10智学点 · 学习资源不打折</p>
    </div>

    <div class="rc-balance">
      <div class="rcb-card">
        <span class="rcb-label">当前余额</span>
        <span class="rcb-num">{{ balance }}</span>
        <span class="rcb-unit">智学点</span>
      </div>
      <div class="rcb-card" v-if="member.active">
        <span class="rcb-label">当前会员</span>
        <span class="rcb-num">{{ member.plan }}</span>
        <span class="rcb-unit">已开通</span>
      </div>
    </div>

    <!-- 会员方案 -->
    <div class="rc-section">
      <div class="rcs-head">
        <h3>🌟 会员方案</h3>
        <span class="rcs-tag">可叠加智学点</span>
      </div>
      <div class="rc-plans">
        <div v-for="p in memberPlans" :key="p.id" class="rcp-card" :class="{active:selectedPlan===p.id}" @click="togglePlan(p.id)">
          <div class="rcpc-badge" v-if="p.id==='year'">推荐</div>
          <div class="rcpc-name">{{ p.name }}</div>
          <div class="rcpc-price">¥{{ p.price }}<span class="rcpc-period">/{{ p.period }}</span></div>
          <div class="rcpc-features">
            <div>送{{ p.points }}点</div>
            <div>会员专享功能</div>
          </div>
          <div class="rcpc-check" v-if="selectedPlan===p.id">✓ 已选</div>
        </div>
      </div>
    </div>

    <!-- 智学点充值 -->
    <div class="rc-section">
      <div class="rcs-head"><h3>📦 智学点充值</h3></div>
      <div class="rc-points">
        <div v-for="o in pointsOptions" :key="o.points" class="rcp-opt" :class="{active:chargePoints===o.points}" @click="chargePoints=o.points">
          <span class="rcpo-points">{{ o.points }}</span>
          <span class="rcpo-price">¥{{ o.price }}</span>
        </div>
        <div class="rcp-custom" :class="{active:chargePoints===-1}" @click="chargePoints=-1">
          <span class="rcpo-label">自定义</span>
          <el-input-number v-model="customPoints" :min="10" :step="10" size="small" style="width:100px" @click.stop/>
          <span class="rcpo-price">¥{{ (customPoints/10).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 结算 -->
    <div class="rc-checkout" v-if="selectedPlan||chargePoints">
      <div class="rcc-summary">
        <div class="rccs-item" v-if="selectedPlan">
          <span>{{ memberPlans.find(p=>p.id===selectedPlan)?.name }}</span>
          <span class="rccs-price">¥{{ memberPlans.find(p=>p.id===selectedPlan)?.price }}</span>
        </div>
        <div class="rccs-item" v-if="chargePoints">
          <span>智学点 {{ chargePoints===-1?customPoints:chargePoints }}</span>
          <span class="rccs-price">¥{{ chargePoints===-1?(customPoints/10).toFixed(2):(chargePoints/10) }}</span>
        </div>
        <div class="rccs-total">
          <span>合计</span>
          <span class="rccst-price">¥{{ totalAmount }}</span>
        </div>
      </div>

      <div class="rc-pay-channels">
        <button :class="['rcpc-btn',{active:payChannel==='alipay'}]" @click="payChannel='alipay'">
          <span class="rcpc-logo alipay">支</span>
          支付宝
        </button>
        <button :class="['rcpc-btn',{active:payChannel==='wechat'}]" @click="payChannel='wechat'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160"><path d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 2C6.48 2 2 6.06 2 11.07c0 2.76 1.42 5.22 3.62 6.8l-.9 2.7a.3.3 0 00.46.33l3.18-1.59c1.15.32 2.37.5 3.64.5 5.52 0 10-4.06 10-9.07S17.52 2 12 2z"/></svg>
          微信
        </button>
      </div>

      <button class="rcc-submit" @click="createOrder" :disabled="paying||paid">
        <span v-if="paying" class="spinner"/><span>💳 立即支付 ¥{{ totalAmount }}</span>
      </button>
    </div>

    <!-- 支付二维码悬浮框：可手动关闭，支付成功后自动关闭 -->
    <el-dialog
      v-model="payDialogVisible"
      width="340px"
      :close-on-click-modal="false"
      @closed="onPayDialogClosed"
    >
      <template #header>
        <div class="pd-head">
          <span class="pd-brand" :class="orderChannel">
            <svg v-if="orderChannel==='wechat'" width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 2C6.48 2 2 6.06 2 11.07c0 2.76 1.42 5.22 3.62 6.8l-.9 2.7a.3.3 0 00.46.33l3.18-1.59c1.15.32 2.37.5 3.64.5 5.52 0 10-4.06 10-9.07S17.52 2 12 2z"/></svg>
            <span v-else class="pd-brand-glyph">支</span>
          </span>
          <span class="pd-title">{{ orderChannel==='wechat' ? '微信支付' : '支付宝支付' }}</span>
        </div>
      </template>

      <div class="pd-body">
        <div class="pd-amount">¥{{ orderAmount }}</div>
        <div class="pd-qr">
          <img :src="qrUrl" class="pd-qr-img" v-if="qrUrl.startsWith('data:') || qrUrl.startsWith('http')"/>
          <div class="pd-qr-mock" v-else>{{ qrUrl }}</div>
        </div>
        <div class="pd-status" :class="{ok:paid}">
          <span class="pd-dot"></span>
          {{ paid ? '支付成功' : '请使用' + (orderChannel==='wechat'?'微信':'支付宝') + '扫码完成支付' }}
        </div>
        <el-button v-if="isDev" size="small" @click="mockPay" style="margin-top:12px">🧪 模拟支付(开发)</el-button>
      </div>
    </el-dialog>

    <!-- 记录 -->
    <div class="rc-section">
      <div class="rcs-head"><h3>📋 记录</h3></div>
      <div class="rc-history" v-if="history.length">
        <div v-for="h in history" :key="h.id" class="rch-item">
          <span :class="['rch-amount', h.amount>0?'plus':'minus']">{{ h.amount>0?'+':'' }}{{ h.amount }}</span>
          <span class="rch-desc">{{ h.description }}</span>
          <span class="rch-time">{{ h.createdAt?.slice(0,10) }}</span>
        </div>
      </div>
      <el-empty v-else description="暂无记录" :image-size="60"/>
      <div class="rch-pagination" v-if="historyTotal > 10">
        <el-pagination
          v-model:current-page="historyPage"
          :page-size="10"
          :total="historyTotal"
          layout="total, prev, pager, next"
          background
          @current-change="loadHistory"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import http from '@/api/request'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const isDev = import.meta.env.DEV
const balance = ref(0)
const member = ref({ active: false, plan: '', discount: 1.0 })
const selectedPlan = ref(null)
const chargePoints = ref(null)
const customPoints = ref(10)
const payChannel = ref('alipay')
const qrUrl = ref('')
const orderId = ref('')
const paying = ref(false)
const paid = ref(false)
const payDialogVisible = ref(false)
const orderChannel = ref('alipay') // 下单时锁定的支付渠道（弹窗图标据此展示）
const orderAmount = ref('0.00')
let pollTimer = null
const history = ref([])
const historyPage = ref(1)
const historyTotal = ref(0)

const memberPlans = [
  { id:'month', name:'月卡', price:29, period:'月', points:80 },
  { id:'quarter', name:'季卡', price:79, period:'季', points:220 },
  { id:'halfyear', name:'半年卡', price:139, period:'半年', points:420 },
  { id:'year', name:'年卡', price:199, period:'年', points:800 },
]
const pointsOptions = [
  { points:100, price:10 }, { points:300, price:30 },
  { points:500, price:50 }, { points:1000, price:100 },
]

const totalAmount = computed(() => {
  let sum = 0
  if (selectedPlan.value) sum += memberPlans.find(p=>p.id===selectedPlan.value)?.price||0
  if (chargePoints.value) sum += chargePoints.value===-1 ? +(customPoints.value/10).toFixed(2) : chargePoints.value/10
  return sum.toFixed(2)
})

function togglePlan(id) { selectedPlan.value = selectedPlan.value===id ? null : id }

async function loadData() {
  try { const r = await http.get('/user/points'); balance.value = r?.points ?? r?.data?.points ?? 0 } catch {}
  try { const r = await http.get('/user/membership'); member.value = r?.data ?? r ?? {} } catch {}
  loadHistory()
}

async function loadHistory() {
  try {
    const r = await http.get('/user/points/history', { params: { page: historyPage.value, pageSize: 10 } })
    const d = r?.data ?? r
    history.value = d?.list ?? d?.records ?? []
    historyTotal.value = d?.total ?? 0
  } catch {}
}

async function createOrder() {
  paying.value = true
  try {
    const body = {}
    if (selectedPlan.value) body.plan = selectedPlan.value
    if (chargePoints.value) body.points = chargePoints.value === -1 ? customPoints.value : chargePoints.value
    body.channel = payChannel.value
    const r = await http.post('/payment/create', body)
    orderId.value = r?.orderId || r?.data?.orderId || ''
    // 锁定本次下单的渠道与金额，弹窗展示用（避免用户中途切换渠道导致图文不符）
    orderChannel.value = payChannel.value
    orderAmount.value = totalAmount.value

    // 支付宝电脑网站支付：后端返回收银台地址 → 直接跳转，不展示二维码弹窗
    const payUrl = r?.payUrl || r?.data?.payUrl
    if (payUrl) {
      paying.value = false
      window.location.href = payUrl
      return
    }

    const qrContent = r?.qrCode || r?.data?.qrCode || ''
    if (qrContent.startsWith('weixin://') || qrContent.startsWith('alipay://')) {
      // 真微信/支付宝 Native 链接 → 渲染成二维码图片
      qrUrl.value = await QRCode.toDataURL(qrContent, { width: 320, margin: 1 })
    } else {
      // 开发环境 mock 字符串 → 保持原样
      qrUrl.value = qrContent
    }
    paid.value = false
    payDialogVisible.value = true
    pollPayment()
  } catch (e) { ElMessage.error(e.message||'创建失败') }
  paying.value = false
}

function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }

function pollPayment() {
  stopPoll()
  pollTimer = setInterval(async () => {
    if (paid.value) { stopPoll(); return }
    try {
      const r = await http.get(`/payment/status/${orderId.value}`)
      const d = r?.data ?? r ?? {}
      // 金额以服务端为准（price 单位为「分」）。支付宝回跳后本地没有锁定的金额，
      // 靠这里恢复，否则悬浮框会显示 ¥0.00。
      if (d.price != null && d.price !== '' && Number.isFinite(Number(d.price))) {
        orderAmount.value = (Number(d.price) / 100).toFixed(2)
      }
      if ((r?.status||r?.data?.status)==='paid') {
        paid.value = true
        stopPoll()
        ElMessage.success('支付成功！')
        loadData()
        // 识别到支付成功 → 自动关闭悬浮框
        setTimeout(() => { payDialogVisible.value = false }, 800)
      }
    } catch {}
  }, 2000)
}

// 悬浮框关闭（手动叉掉或支付成功后自动关闭）→ 停止轮询并复位按钮
function onPayDialogClosed() {
  stopPoll()
  paid.value = false
  qrUrl.value = ''
}

async function mockPay() {
  try {
    await http.post(`/payment/mock-pay/${orderId.value}`)
    paid.value = true
    ElMessage.success('模拟支付成功')
    loadData()
    stopPoll()
    setTimeout(() => { payDialogVisible.value = false }, 800)
  } catch {}
}

// 支付宝收银台回跳：URL 带 out_trade_no → 恢复该订单并轮询支付状态。
// 回跳时异步回调通常还没到，订单仍是 pending，所以用轮询而非直接判定成功。
function resumeAlipayReturn() {
  const returnedOrderId = route.query.out_trade_no
  if (!returnedOrderId) return
  orderId.value = String(returnedOrderId)
  orderChannel.value = 'alipay'
  paid.value = false
  payDialogVisible.value = true
  pollPayment()
  // 清掉 URL 上的订单参数，避免刷新页面重复触发轮询
  router.replace({ path: route.path, query: {} }).catch(() => {})
}

onMounted(() => {
  loadData()
  resumeAlipayReturn()
})
onBeforeUnmount(stopPoll)
</script>

<style scoped>
.rc-page{max-width:720px;margin:0 auto;padding:24px 14px 48px}
.rc-hero{text-align:center;margin-bottom:20px}.rc-hero h2{font-size:22px;font-weight:800;margin-bottom:2px}.rc-hero p{font-size:13px;color:var(--text-muted)}

.rc-balance{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.rcb-card{text-align:center;padding:18px 16px;background:#fff;border-radius:14px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.rcb-label{font-size:12px;color:var(--text-muted);display:block}.rcb-num{font-size:32px;font-weight:800;color:var(--color-primary);margin:4px 0;display:block}.rcb-unit{font-size:12px;color:var(--text-muted)}

.rc-section{margin-bottom:24px;background:#fff;border-radius:14px;padding:20px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.rcs-head{display:flex;align-items:center;gap:8px;margin-bottom:14px}.rcs-head h3{font-size:15px;font-weight:700;color:var(--text-primary)}.rcs-tag{font-size:11px;color:var(--text-muted);background:var(--color-bg);padding:2px 8px;border-radius:6px}

.rc-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rcp-card{position:relative;padding:18px 14px;border-radius:12px;border:2px solid var(--color-border-light);cursor:pointer;transition:all .15s;text-align:center;background:var(--color-bg)}
.rcp-card:hover{border-color:var(--color-primary-light)}.rcp-card.active{border-color:var(--color-primary);background:var(--color-primary-bg)}
.rcpc-badge{position:absolute;top:-8px;right:12px;background:#EF4444;color:#fff;font-size:10px;padding:1px 8px;border-radius:8px}
.rcpc-name{font-size:16px;font-weight:700;color:var(--text-primary)}.rcpc-price{font-size:26px;font-weight:800;color:var(--color-primary);display:block;margin:6px 0}.rcpc-period{font-size:13px;font-weight:400;color:var(--text-muted)}
.rcpc-features{font-size:12px;color:var(--text-secondary);margin-bottom:8px}.rcpc-features div{margin:2px 0}
.rcpc-check{font-size:12px;color:var(--color-primary);font-weight:600}

.rc-points{display:flex;flex-wrap:wrap;gap:8px}
.rcp-opt,.rcp-custom{padding:12px 16px;border-radius:10px;border:1px solid var(--color-border-light);cursor:pointer;text-align:center;transition:all .15s;background:var(--color-bg);min-width:80px}
.rcp-opt:hover,.rcp-custom:hover{border-color:var(--color-primary-light)}.rcp-opt.active,.rcp-custom.active{border-color:var(--color-primary);background:var(--color-primary-bg)}
.rcpo-points{font-size:15px;font-weight:700;display:block;color:var(--text-primary)}.rcpo-price{font-size:12px;color:var(--color-primary);font-weight:500}
.rcpo-label{font-size:13px;display:block;color:var(--text-muted);margin-bottom:4px}

.rc-checkout{padding:20px 24px;background:#fff;border-radius:14px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.rcc-summary{margin-bottom:16px}.rccs-item{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:var(--text-secondary)}.rccs-price{font-weight:600;color:var(--text-primary)}
.rccs-total{display:flex;justify-content:space-between;padding:12px 0 0;border-top:2px solid var(--color-border);margin-top:8px;font-size:16px;font-weight:700;color:var(--text-primary)}.rccst-price{font-size:22px;color:#EF4444}

.rc-pay-channels{display:flex;gap:8px;margin:16px 0}.rcpc-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border:2px solid var(--color-border-light);border-radius:10px;background:#fff;font-size:14px;cursor:pointer;transition:all .15s;font-family:inherit}.rcpc-btn.active{border-color:var(--color-primary);background:var(--color-primary-bg);color:var(--color-primary);font-weight:600}
/* 支付渠道品牌标：与弹窗头部 .pd-brand 同一套视觉（支付宝蓝底「支」字、微信绿底气泡） */
.rcpc-logo{width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:12px;font-weight:700;line-height:1}
.rcpc-logo.alipay{background:#1677FF}

.rcc-submit{width:100%;height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}.rcc-submit:disabled{opacity:.6;cursor:not-allowed}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

/* 支付二维码悬浮框 */
.pd-head{display:flex;align-items:center;gap:8px}
.pd-brand{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pd-brand.alipay{background:#1677FF}.pd-brand.wechat{background:#07C160}
.pd-brand-glyph{color:#fff;font-size:15px;font-weight:700;line-height:1}
.pd-title{font-size:15px;font-weight:600;color:var(--text-primary)}
.pd-body{text-align:center;padding:4px 0 8px}
.pd-amount{font-size:26px;font-weight:800;color:#EF4444;margin-bottom:14px}
.pd-qr{display:inline-flex;align-items:center;justify-content:center;padding:10px;background:#fff;border:1px solid var(--color-border-light);border-radius:10px}
.pd-qr-img{width:180px;height:180px;border-radius:6px;display:block}
.pd-qr-mock{width:180px;padding:14px;font-family:monospace;font-size:11px;color:var(--text-muted);word-break:break-all;text-align:left}
.pd-status{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;font-size:13px;color:var(--text-muted)}
.pd-status .pd-dot{width:7px;height:7px;border-radius:50%;background:#F59E0B;animation:pdPulse 1.4s infinite ease-in-out}
.pd-status.ok{color:#10B981}
.pd-status.ok .pd-dot{background:#10B981;animation:none}
@keyframes pdPulse{0%,100%{opacity:1}50%{opacity:.25}}

.rc-history{display:flex;flex-direction:column;gap:6px}
.rch-item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:8px;background:var(--color-bg)}.rch-amount{font-weight:700;width:60px}.rch-amount.plus{color:#10B981}.rch-amount.minus{color:#EF4444}.rch-desc{flex:1;font-size:13px;color:var(--text-secondary)}.rch-time{font-size:11px;color:var(--text-muted)}
.rch-pagination{display:flex;justify-content:center;margin-top:14px}
</style>
