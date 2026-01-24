<template>
  <div class="review-inbox">
    <div class="tabs-nav">
      <button
        :class="['nav-btn', { active: currentTab === 'pending' }]"
        @click="currentTab = 'pending'"
      >
        待审批订单
      </button>

      <button
        :class="['nav-btn', { active: currentTab === 'processed' }]"
        @click="currentTab = 'processed'"
      >
        已处理订单
      </button>
    </div>

    <div class="main-content">
      <div class="toolbar">
        <div class="title-section">
          <h2>{{ currentTab === 'pending' ? '待审批列表' : '历史处理记录' }}</h2>
          <span class="count-badge">共 {{ filteredAndSortedData.length }} 项</span>
        </div>

        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索申请人或客户名称..."
            class="search-input"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="order-table">
          <thead>
            <tr>
              <th @click="handleSort('orderId')">订单号 {{ getSortIcon('orderId') }}</th>
              <th @click="handleSort('customer')">客户名称 {{ getSortIcon('customer') }}</th>
              <th @click="handleSort('deadline')">承诺交期 {{ getSortIcon('deadline') }}</th>
              <th @click="handleSort('applyTime')">申请时间 {{ getSortIcon('applyTime') }}</th>
              <th @click="handleSort('applicant')">申请人 {{ getSortIcon('applicant') }}</th>
              <th v-if="currentTab === 'processed'" @click="handleSort('auditStatus')">
                审核状态 {{ getSortIcon('auditStatus') }}
              </th>
              <th class="op-column">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="order in filteredAndSortedData" :key="order.orderId">
              <td>
                <span class="order-id">{{ order.orderId }}</span>
              </td>
              <td>{{ order.customer }}</td>
              <td>{{ order.deadline }}</td>
              <td>{{ getInitialAuditInfo(order).time }}</td>
              <td>{{ getInitialAuditInfo(order).operator }}</td>
              <td v-if="currentTab === 'processed'">
                <span :class="['status-tag', getStatusTagClass(order.auditStatus)]">
                  {{ order.auditStatus }}
                </span>
              </td>
              <td class="op-cell">
                <button class="detail-btn" @click="viewDetail(order.orderId)">
                  {{ currentTab === 'pending' ? '审批' : '查看' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredAndSortedData.length === 0" class="no-data">暂无相关订单记录</div>
      </div>
    </div>

    <AuditBench ref="auditBenchRef" :order="selectedOrder" @closed="selectedOrder = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { type IOrder, AuditStatus } from '@/types/Order'
import { useOrderStore } from '@/stores/orderStore'
import AuditBench from './AuditBench.vue' // 确保组件导入

const orderStore = useOrderStore()

// --- 状态管理 ---
const currentTab = ref<'pending' | 'processed'>('pending')
const searchQuery = ref('')
const sortConfig = ref({
  key: 'applyTime',
  direction: 'desc' as 'asc' | 'desc',
})

// --- 弹窗控制逻辑 ---
const auditBenchRef = ref<InstanceType<typeof AuditBench> | null>(null)
const selectedOrder = ref<IOrder | null>(null)

// --- 核心：汇总三个数组作为全量数据源 ---
const allOrders = computed(() => [
  ...orderStore.pendingOrders,
  ...orderStore.reviewedOrders,
  ...orderStore.rejectedOrders,
])

// 辅助函数：安全获取申请信息
const getInitialAuditInfo = (order: IOrder) => {
  const firstLog = order.auditLogs?.[0]
  return {
    time: firstLog?.time ?? '-',
    operator: firstLog?.operator ?? '系统生成',
  }
}

const getStatusTagClass = (status: AuditStatus) => {
  const map: Record<AuditStatus, string> = {
    [AuditStatus.Approved]: 'approved',
    [AuditStatus.Rejected]: 'rejected',
    [AuditStatus.Pending]: 'pending',
  }
  return map[status]
}

// 核心：过滤与排序逻辑
const filteredAndSortedData = computed(() => {
  const kw = searchQuery.value.toLowerCase().trim()

  const filtered = allOrders.value.filter((item) => {
    // 1. 根据 Tab 过滤状态
    const isTabMatch =
      currentTab.value === 'pending'
        ? item.auditStatus === AuditStatus.Pending
        : item.auditStatus !== AuditStatus.Pending

    if (!isTabMatch) return false

    // 2. 搜索过滤
    if (!kw) return true
    const applicant = getInitialAuditInfo(item).operator
    return item.customer.toLowerCase().includes(kw) || applicant.toLowerCase().includes(kw)
  })

  // 3. 排序逻辑
  return [...filtered].sort((a, b) => {
    const { key, direction } = sortConfig.value
    const getValue = (order: IOrder, k: string): string => {
      if (k === 'applyTime') return getInitialAuditInfo(order).time
      if (k === 'applicant') return getInitialAuditInfo(order).operator
      const val = order[k as keyof IOrder]
      return typeof val === 'string' ? val : ''
    }
    const valA = getValue(a, key)
    const valB = getValue(b, key)
    const res = valA.localeCompare(valB)
    return direction === 'asc' ? res : -res
  })
})

const handleSort = (key: string) => {
  if (sortConfig.value.key === key) {
    sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortConfig.value.key = key
    sortConfig.value.direction = 'asc'
  }
}

const getSortIcon = (key: string) => {
  if (sortConfig.value.key !== key) return '↕️'
  return sortConfig.value.direction === 'asc' ? '🔼' : '🔽'
}

// --- 触发 AuditBench 的核心函数 ---
const viewDetail = (id: string) => {
  // 从全量数据中找到该订单对象
  const target = allOrders.value.find((o) => o.orderId === id)
  if (target) {
    selectedOrder.value = target
    // 异步开启弹窗确保数据挂载成功
    setTimeout(() => {
      auditBenchRef.value?.open()
    }, 0)
  }
}
</script>

<style scoped>
/* 保持原有样式，仅优化 status-tag 以匹配枚举值 */
.review-inbox {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.tabs-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
  color: #606266;
  position: relative;
}

.nav-btn.active {
  color: #409eff;
  font-weight: bold;
}

.nav-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #409eff;
}

/* 状态标签样式 */
.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.approved {
  background: #f0f9eb;
  color: #67c23a;
}
.status-tag.rejected {
  background: #fef0f0;
  color: #f56c6c;
}
.status-tag.pending {
  background: #ecf5ff;
  color: #409eff;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.order-table th,
.order-table td {
  padding: 14px;
  border-bottom: 1px solid #ebeef5;
  text-align: left;
}

.order-id {
  font-family: monospace;
  color: #409eff;
  font-weight: bold;
}

.detail-btn {
  padding: 5px 12px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: #909399;
  background: #fff;
}
</style>
