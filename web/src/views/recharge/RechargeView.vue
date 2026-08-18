<template>
  <div class="rc-page">
    <div class="rc-hero">
      <h2>💰 智学点</h2>
      <p>会员享折扣 · 1元 = 100智学点</p>
    </div>

    <div class="rc-balance">
      <div class="rcb-card">
        <span class="rcb-label">当前余额</span>
        <span class="rcb-num">{{ balance }}</span>
        <span class="rcb-unit">智学点</span>
      </div>
      <div class="rcb-card" v-if="member.active">
        <span class="rcb-label">{{ member.plan }}</span>
        <span class="rcb-num">{{ member.discount*10 }}折</span>
        <span class="rcb-unit">资源折扣</span>
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
            <div>资源 {{ p.discount }}折</div>
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
          <el-input-number v-model="customPoints" :min="100" :step="100" size="small" style="width:100px" @click.stop/>
          <span class="rcpo-price">¥{{ (customPoints/100).toFixed(2) }}</span>
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
          <span class="rccs-price">¥{{ chargePoints===-1?(customPoints/100).toFixed(2):(chargePoints/100) }}</span>
        </div>
        <div class="rccs-total">
          <span>合计</span>
          <span class="rccst-price">¥{{ totalAmount }}</span>
        </div>
      </div>

      <div class="rc-pay-channels">
        <button :class="['rcpc-btn',{active:payChannel==='alipay'}]" @click="payChannel='alipay'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/></svg>
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

      <!-- 支付状态 -->
      <div class="rc-qr" v-if="qrUrl">
        <img :src="qrUrl" class="rcqr-img" v-if="qrUrl.startsWith('http')"/>
        <div class="rcqr-mock" v-else>
          <div class="rcqrm-qr">{{ qrUrl }}</div>
        </div>
        <el-tag v-if="paid" type="success">✅ 支付成功</el-tag>
        <el-tag v-else type="warning">⏳ 等待支付…</el-tag>
        <el-button size="small" @click="mockPay" style="margin-top:8px">🧪 模拟支付(开发)</el-button>
      </div>
    </div>

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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/request'

const balance = ref(0)
const member = ref({ active: false, plan: '', discount: 1.0 })
const selectedPlan = ref(null)
const chargePoints = ref(null)
const customPoints = ref(100)
const payChannel = ref('alipay')
const qrUrl = ref('')
const orderId = ref('')
const paying = ref(false)
const paid = ref(false)
const history = ref([])
const historyPage = ref(1)
const historyTotal = ref(0)

const memberPlans = [
  { id:'month', name:'月卡', price:199, period:'月', points:5000, discount:9 },
  { id:'quarter', name:'季卡', price:399, period:'季', points:12000, discount:7 },
  { id:'year', name:'年卡', price:599, period:'年', points:25000, discount:5 },
]
const pointsOptions = [
  { points:1000, price:10 }, { points:3000, price:30 },
  { points:5000, price:50 }, { points:10000, price:100 },
]

const totalAmount = computed(() => {
  let sum = 0
  if (selectedPlan.value) sum += memberPlans.find(p=>p.id===selectedPlan.value)?.price||0
  if (chargePoints.value) sum += chargePoints.value===-1 ? +(customPoints.value/100).toFixed(2) : chargePoints.value/100
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
    const r = await http.post('/payment/create', body)
    orderId.value = r?.orderId || r?.data?.orderId || ''
    qrUrl.value = r?.qrCode || r?.data?.qrCode || ''
    paid.value = false
    ElMessage.success('订单已创建')
    pollPayment()
  } catch (e) { ElMessage.error(e.message||'创建失败') }
  paying.value = false
}

function pollPayment() {
  const timer = setInterval(async () => {
    if (paid.value) { clearInterval(timer); return }
    try {
      const r = await http.get(`/payment/status/${orderId.value}`)
      if ((r?.status||r?.data?.status)==='paid') { paid.value=true; clearInterval(timer); ElMessage.success('支付成功！'); loadData() }
    } catch {}
  }, 2000)
}

async function mockPay() {
  try { await http.post(`/payment/mock-pay/${orderId.value}`); paid.value=true; ElMessage.success('模拟支付成功'); loadData() } catch {}
}

onMounted(loadData)
</script>

<style scoped>
.rc-page{max-width:720px;margin:0 auto;padding:24px 14px 48px}
.rc-hero{text-align:center;margin-bottom:20px}.rc-hero h2{font-size:22px;font-weight:800;margin-bottom:2px}.rc-hero p{font-size:13px;color:var(--text-muted)}

.rc-balance{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.rcb-card{text-align:center;padding:18px 16px;background:#fff;border-radius:14px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.rcb-label{font-size:12px;color:var(--text-muted);display:block}.rcb-num{font-size:32px;font-weight:800;color:var(--color-primary);margin:4px 0;display:block}.rcb-unit{font-size:12px;color:var(--text-muted)}

.rc-section{margin-bottom:24px;background:#fff;border-radius:14px;padding:20px;border:1px solid var(--color-border);box-shadow:0 1px 4px rgba(0,0,0,.03)}
.rcs-head{display:flex;align-items:center;gap:8px;margin-bottom:14px}.rcs-head h3{font-size:15px;font-weight:700;color:var(--text-primary)}.rcs-tag{font-size:11px;color:var(--text-muted);background:var(--color-bg);padding:2px 8px;border-radius:6px}

.rc-plans{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
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

.rcc-submit{width:100%;height:48px;border:none;border-radius:12px;background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}.rcc-submit:disabled{opacity:.6;cursor:not-allowed}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

.rc-qr{text-align:center;padding:16px;margin-top:16px;background:var(--color-bg);border-radius:10px}.rcqr-img{width:160px;height:160px;border-radius:8px}
.rcqr-mock{text-align:center;padding:12px}.rcqrm-qr{padding:20px;background:#fff;border:1px dashed var(--color-border);border-radius:8px;font-family:monospace;font-size:12px;color:var(--text-muted);word-break:break-all}

.rc-history{display:flex;flex-direction:column;gap:6px}
.rch-item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:8px;background:var(--color-bg)}.rch-amount{font-weight:700;width:60px}.rch-amount.plus{color:#10B981}.rch-amount.minus{color:#EF4444}.rch-desc{flex:1;font-size:13px;color:var(--text-secondary)}.rch-time{font-size:11px;color:var(--text-muted)}
.rch-pagination{display:flex;justify-content:center;margin-top:14px}
</style>
