<template>
  <div class="uploader-container">
    <div class="header-section">
      <h2>订单上传中心</h2>
      <button class="btn-primary" @click="orderCreatorRef?.open()">+ 新建订单</button>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>状态</th>
            <th>订单号</th>
            <th>客户</th>
            <th>截止日期</th>
            <th>优先级</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="order in orderStore.pendingOrders" :key="order.orderId">
            <td>
              <span :class="['status-badge', getStatusClass(order.auditStatus)]">
                {{ order.auditStatus }}
              </span>
            </td>

            <td>
              <strong>{{ order.orderId }}</strong>
            </td>

            <td>{{ order.customer }}</td>
            <td>{{ order.deadline }}</td>
            <td>{{ order.priority }}</td>

            <td>
              <div class="action-btns">
                <button class="link-btn" @click="handleView(order)">查看</button>

                <button class="link-btn btn-delete" @click="handleDelete(order.orderId)">
                  删除
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="orderStore.pendingOrders.length === 0">
            <td colspan="6" class="empty-placeholder">暂无待审核订单，请点击上方“新建订单”</td>
          </tr>
        </tbody>
      </table>
    </div>

    <OrderCreator ref="orderCreatorRef" @submitted="onOrderSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type IOrder, AuditStatus } from '@/types/Order'
import OrderCreator from '@/views/OrderCreator.vue'
import { useOrderStore } from '@/stores/OrderStore'

// 初始化 Store
const orderStore = useOrderStore()

// 引用 OrderCreator 组件实例
const orderCreatorRef = ref<InstanceType<typeof OrderCreator> | null>(null)

/**
 * 逻辑：处理查看
 * 将当前的 order 对象传给子组件的 open 方法
 */
const handleView = (order: IOrder) => {
  if (orderCreatorRef.value) {
    // 这里的 open 需要在 OrderCreator 内部支持接收参数
    orderCreatorRef.value.open(order)
  }
}

/**
 * 逻辑：处理删除
 */
const handleDelete = (orderId: string) => {
  if (confirm(`确定要删除订单 ${orderId} 吗？此操作不可撤销。`)) {
    // 调用 Store 的删除 Action
    orderStore.deleteOrder(orderId)
    console.log('订单已从全局审核池移除:', orderId)
  }
}

/**
 * 核心逻辑：处理子组件提交后的行为
 */
const onOrderSubmitted = (newOrder: IOrder) => {
  orderStore.addOrder(newOrder)
  console.log('申报成功，订单已发送至全局审核池:', newOrder.orderId)
}

/**
 * 样式工具：返回对应的 CSS 类名
 */
const getStatusClass = (status?: AuditStatus): string => {
  if (!status) return ''
  const statusMap: Record<AuditStatus, string> = {
    [AuditStatus.Pending]: 'status-pending',
    [AuditStatus.Rejected]: 'status-rejected',
    [AuditStatus.Approved]: 'status-approved',
  }
  return statusMap[status]
}
</script>

<style scoped>
.uploader-container {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th,
.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-approved {
  background: #dcfce7;
  color: #166534;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.action-btns {
  display: flex;
  gap: 12px;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 0;
}
.link-btn:hover {
  text-decoration: underline;
}
.btn-delete {
  color: #ef4444;
}
.btn-delete:hover {
  color: #b91c1c;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #1d4ed8;
}

.empty-placeholder {
  text-align: center;
  color: #9ca3af;
  padding: 40px !important;
}
</style>
