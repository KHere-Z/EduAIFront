<template>
  <div class="withdraw-page">
    <h2 class="wv-title">🏦 提现审核</h2>
    <p class="wv-sub">审核老师的提现申请，通过后需线下打款到其银行卡。</p>

    <div class="wv-panel">
      <el-table :data="list" size="small" v-loading="loading" empty-text="暂无提现申请">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="teacherId" label="老师ID" width="80" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">¥ {{ yuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="accountName" label="开户名" width="100" />
        <el-table-column prop="bankName" label="开户行" min-width="130" />
        <el-table-column prop="bankCardNo" label="银行卡号" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="备注" min-width="110" />
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" @click="review(row, true)">通过</el-button>
              <el-button size="small" type="danger" @click="review(row, false)">驳回</el-button>
            </template>
            <span v-else class="wv-done">已处理</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminWithdraws, reviewWithdraw } from '@/api/common/revenue'

const list = ref([])
const loading = ref(false)

const statusMap = { pending: '待审核', approved: '已通过', paid: '已打款', rejected: '已驳回' }
const statusTypeMap = { pending: 'warning', approved: 'success', paid: 'success', rejected: 'danger' }

function yuan(fen) { return ((fen || 0) / 100).toFixed(2) }
function fmtTime(t) { return t ? t.replace('T', ' ').substring(0, 16) : '-' }
function statusText(s) { return statusMap[s] || s }
function statusType(s) { return statusTypeMap[s] || 'info' }

async function load() {
  loading.value = true
  try {
    list.value = await getAdminWithdraws()
  } catch (e) {
    // 错误提示已由拦截器处理
  } finally {
    loading.value = false
  }
}

async function review(row, approved) {
  const action = approved ? '通过' : '驳回'
  try {
    const { value } = await ElMessageBox.prompt(
      `确认${action}该提现申请（¥${yuan(row.amount)}）？`,
      `${action}提现`,
      {
        confirmButtonText: action,
        cancelButtonText: '取消',
        inputPlaceholder: approved ? '打款备注（可选）' : '驳回原因',
      }
    )
    await reviewWithdraw(row.id, { approved, note: value || '' })
    ElMessage.success(`已${action}`)
    await load()
  } catch (e) {
    // 取消或错误
  }
}

onMounted(load)
</script>

<style scoped>
.withdraw-page { padding: 20px 24px; max-width: 1200px; }
.wv-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.wv-sub { font-size: 13px; color: var(--text-muted); margin: 0 0 20px; }
.wv-panel { background: rgba(255,255,255,.9); border-radius: 14px; padding: 18px 20px; box-shadow: 0 1px 8px rgba(0,0,0,.05); }
.wv-done { font-size: 12px; color: var(--text-muted); }
</style>
