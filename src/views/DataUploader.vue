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
              <button class="link-btn">编辑</button>
            </td>
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
// 导入 Pinia Store
import { useOrderStore } from '@/stores/orderStore'

// 初始化 Store 实例
const orderStore = useOrderStore()

// 引用 OrderCreator 组件实例
const orderCreatorRef = ref<InstanceType<typeof OrderCreator> | null>(null)

/**
 * 核心逻辑：处理儿子组件 (OrderCreator) 提交后的行为
 * @param newOrder 从 OrderCreator 传回的完整 IOrder 对象
 */
const onOrderSubmitted = (newOrder: IOrder) => {
  // 关键改动：将数据推送到全局 Store，而不是仅保留在当前页面
  // 这样当 ReviewInbox 页面打开时，它能立即从 Store 读到这个新单子
  orderStore.addOrder(newOrder)

  console.log('申报成功，订单已发送至全局审核池:', newOrder.orderId)
}

/**
 * 样式工具：根据审核状态返回对应的 CSS 类名
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
/* 样式部分保持不变 */
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
.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
}
</style>
