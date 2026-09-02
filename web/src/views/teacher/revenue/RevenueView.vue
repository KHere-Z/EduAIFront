<template>
  <div class="revenue-page">
    <h2 class="rv-title">💰 收益中心</h2>
    <p class="rv-sub">上传的学习资源被下载后，你将获得 50% 分成（以智学点发放）。</p>

    <!-- 汇总卡片 -->
    <div class="rv-cards">
      <div class="rv-card">
        <div class="rvc-label">累计分成</div>
        <div class="rvc-num">¥ {{ yuan(totalEarnings) }}</div>
      </div>
      <div class="rv-card highlight">
        <div class="rvc-label">可提现余额</div>
        <div class="rvc-num">¥ {{ yuan(availableBalance) }}</div>
      </div>
      <div class="rv-card">
        <div class="rvc-label">待审核提现</div>
        <div class="rvc-num">¥ {{ yuan(pendingWithdraw) }}</div>
      </div>
    </div>

    <!-- 提现表单 -->
    <div class="rv-panel">
      <h3 class="rvp-title">申请提现</h3>
      <el-form :model="form" label-width="96px" class="rv-form">
        <el-form-item label="提现金额(元)">
          <el-input-number v-model="form.amountYuan" :min="1" :precision="2" :step="10" style="width:220px" />
          <span class="rv-hint">最低 1 元，单次不超过可提现余额</span>
        </el-form-item>
        <el-form-item label="开户名">
          <el-input v-model="form.accountName" placeholder="银行卡开户姓名" style="max-width:320px" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="form.bankName" placeholder="如：中国工商银行" style="max-width:320px" />
        </el-form-item>
        <el-form-item label="银行卡号">
          <el-input v-model="form.bankCardNo" placeholder="银行卡号" style="max-width:320px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitWithdraw">提交申请</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 收益流水 -->
    <div class="rv-panel">
      <h3 class="rvp-title">收益流水</h3>
      <el-table :data="earnings" size="small" empty-text="暂无收益">
        <el-table-column prop="resourceTitle" label="资源" min-width="200" />
        <el-table-column label="分成金额" width="140">
          <template #default="{ row }">¥ {{ yuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 提现记录 -->
    <div class="rv-panel">
      <h3 class="rvp-title">提现记录</h3>
      <el-table :data="withdraws" size="small" empty-text="暂无提现记录">
        <el-table-column label="金额" width="120">
          <template #default="{ row }">¥ {{ yuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="bankName" label="开户行" min-width="130" />
        <el-table-column prop="bankCardNo" label="卡号" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="备注" min-width="120" />
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getTeacherRevenue, requestWithdraw } from '@/api/common/revenue'

const totalEarnings = ref(0)
const availableBalance = ref(0)
const pendingWithdraw = ref(0)
const earnings = ref([])
const withdraws = ref([])
const submitting = ref(false)
const form = ref({ amountYuan: 1, accountName: '', bankName: '', bankCardNo: '' })

const statusMap = { pending: '待审核', approved: '已通过', paid: '已打款', rejected: '已驳回' }
const statusTypeMap = { pending: 'warning', approved: 'success', paid: 'success', rejected: 'danger' }

function yuan(fen) { return ((fen || 0) / 100).toFixed(2) }
function fmtTime(t) { return t ? t.replace('T', ' ').substring(0, 16) : '-' }
function statusText(s) { return statusMap[s] || s }
function statusType(s) { return statusTypeMap[s] || 'info' }

async function load() {
  const data = await getTeacherRevenue()
  totalEarnings.value = data.totalEarnings || 0
  availableBalance.value = data.availableBalance || 0
  pendingWithdraw.value = data.pendingWithdraw || 0
  earnings.value = data.earnings || []
  withdraws.value = data.withdraws || []
}

async function submitWithdraw() {
  if (!form.value.accountName || !form.value.bankName || !form.value.bankCardNo) {
    ElMessage.warning('请填写完整银行卡信息')
    return
  }
  submitting.value = true
  try {
    await requestWithdraw({
      amount: Math.round(form.value.amountYuan * 100),
      accountName: form.value.accountName,
      bankName: form.value.bankName,
      bankCardNo: form.value.bankCardNo,
    })
    ElMessage.success('提现申请已提交，等待管理员审核')
    form.value = { amountYuan: 1, accountName: '', bankName: '', bankCardNo: '' }
    await load()
  } catch (e) {
    // 错误提示已由拦截器处理
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.revenue-page { padding: 20px 24px; max-width: 1100px; }
.rv-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.rv-sub { font-size: 13px; color: var(--text-muted); margin: 0 0 20px; }

.rv-cards { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.rv-card { flex: 1; min-width: 180px; background: rgba(255,255,255,.9); border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
.rv-card.highlight { background: linear-gradient(135deg, #FFF7E6, #FFF1D6); }
.rvc-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.rvc-num { font-size: 26px; font-weight: 700; color: var(--text-primary); }
.rv-card.highlight .rvc-num { color: #D97706; }

.rv-panel { background: rgba(255,255,255,.9); border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 8px rgba(0,0,0,.05); margin-bottom: 16px; }
.rvp-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 14px; }
.rv-form { max-width: 640px; }
.rv-hint { font-size: 12px; color: var(--text-muted); margin-left: 10px; }
</style>
