<template>
  <div class="dispatch-center">
    <header class="page-header">
      <div class="title-info">
        <h2>🛠️ 派单调度中心</h2>
        <p>对已通过审核的订单进行工序拆解 (Routing) 与任务指派</p>
      </div>
      <div class="stats-cards">
        <div class="stat-card">
          <label>已通过审核</label>
          <div class="value">{{ approvedOrders.length }}</div>
        </div>
        <div class="stat-card highlight">
          <label>待指派工序</label>
          <div class="value">{{ unassignedCount }}</div>
        </div>
      </div>
    </header>

    <div class="content-card">
      <table class="dispatch-table">
        <thead>
          <tr>
            <th>分配状态</th>
            <th>订单编号</th>
            <th>客户名称</th>
            <th>承诺交期</th>
            <th>当前工序数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in approvedOrders" :key="order.orderId">
            <td>
              <span :class="['tag', isAssigned(order) ? 'tag-success' : 'tag-warn']">
                {{ isAssigned(order) ? '已分配' : '未分配' }}
              </span>
            </td>
            <td class="order-id">{{ order.orderId }}</td>
            <td>{{ order.customer }}</td>
            <td>{{ order.deadline }}</td>
            <td>
              <span class="process-count"> {{ order.processes?.length || 0 }} 道工序 </span>
            </td>
            <td>
              <button
                @click="goToRoutePlaner(order)"
                :class="['btn-dispatch', isAssigned(order) ? 'btn-outline' : 'btn-primary']"
              >
                {{ isAssigned(order) ? '编辑 Route' : '创建 Route' }}
              </button>
            </td>
          </tr>

          <tr v-if="approvedOrders.length === 0">
            <td colspan="6" class="empty-placeholder">
              <div class="empty-msg">
                <p>📭 暂无已通过审核的订单</p>
                <small>请先在“审核中心”完成订单审批</small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <RoutePlaner ref="routePlanerRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOrderStore } from '@/stores/OrderStore'
import type { IOrder } from '@/types/Order'
// 注意：请确保路径正确，如果不叫 RoutePlaner.vue 请对应修改
import RoutePlaner from '@/views/RoutePlaner.vue'

const orderStore = useOrderStore()

/**
 * 核心逻辑：定义你要求的 approvedOrders
 * 将 Store 里的 reviewedOrders 映射为本页面使用的名称
 */
const approvedOrders = computed(() => orderStore.approvedOrders)

/**
 * 定义对 RoutePlaner 子组件的引用，用于触发其 open 方法
 */
const routePlanerRef = ref<InstanceType<typeof RoutePlaner> | null>(null)

/**
 * 判断逻辑：检查 order 对象中的 processes 数组是否有内容
 */
const isAssigned = (order: IOrder) => {
  return order.processes && order.processes.length > 0
}

/**
 * 统计待指派订单
 */
const unassignedCount = computed(() => {
  return approvedOrders.value.filter((o) => !isAssigned(o)).length
})

/**
 * 唤起规划面板
 */
const goToRoutePlaner = (order: IOrder) => {
  console.log('正在进入路线规划页，目标订单:', order.orderId)
  // 调用子组件中 defineExpose 暴露出来的 open 方法
  routePlanerRef.value?.open(order)
}
</script>

<style scoped>
.dispatch-center {
  padding: 24px;
  background-color: #f8fafc;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-info h2 {
  font-size: 22px;
  color: #1e293b;
  margin: 0;
}

.title-info p {
  color: #64748b;
  margin: 4px 0 0 0;
  font-size: 14px;
}

.stats-cards {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 12px 24px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 120px;
}

.stat-card.highlight .value {
  color: #f59e0b;
}

.stat-card label {
  font-size: 12px;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}

.stat-card .value {
  font-size: 20px;
  font-weight: 800;
  color: #334155;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.dispatch-table {
  width: 100%;
  border-collapse: collapse;
}

.dispatch-table th {
  background: #f1f5f9;
  text-align: left;
  padding: 14px 20px;
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.dispatch-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.order-id {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-weight: bold;
  color: #2563eb;
}

.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.tag-warn {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}
.tag-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.process-count {
  color: #64748b;
  font-size: 13px;
}

.btn-dispatch {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-outline {
  background: white;
  color: #64748b;
  border-color: #e2e8f0;
}

.btn-dispatch:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.empty-placeholder {
  padding: 80px 0;
  text-align: center;
}

.empty-msg p {
  font-size: 16px;
  color: #64748b;
  margin-bottom: 8px;
}

.empty-msg small {
  color: #94a3b8;
}
</style>
