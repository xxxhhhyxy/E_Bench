<template>
  <div class="tracker-main-layout">
    <section class="panel alert-panel">
      <div class="panel-header flex-between clickable" @click="toggleCollapse('alert')">
        <h3 class="text-danger">
          ⚠️ 实时预警中心 ({{ allAlerts.length }})
          <span class="collapse-hint">{{ collapseState.alert ? '点击展开' : '点击折叠' }}</span>
        </h3>
      </div>

      <div v-show="!collapseState.alert" class="panel-content">
        <table class="standard-table" v-if="allAlerts.length > 0">
          <thead>
            <tr>
              <th width="100">严重程度</th>
              <th width="140">订单号</th>
              <th class="text-left">预警原因</th>
              <th width="200">触发时间</th>
              <th width="320">快速操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in allAlerts" :key="item.triggered_at + item.P_ID">
              <td>
                <span class="sev-badge" :class="getSeverityClass(item.severity)">
                  {{ item.severity }}
                </span>
              </td>
              <td class="id-font">{{ item.orderId }}</td>
              <td class="text-left">
                <span class="task-tag">{{ item.P_ID }}</span> {{ item.reason }}
              </td>
              <td class="time-font">{{ item.triggered_at }}</td>
              <td class="ops">
                <button class="btn-tool ack" @click.stop="handleAck(item)">确认</button>
                <button class="btn-tool view" @click.stop="openDetail(item._order)">
                  关联订单
                </button>
                <button class="btn-tool todo" @click.stop="generateTodo(item)">生成工单</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-placeholder">✅ 生产环境运行良好，无触发预警</div>
      </div>
    </section>

    <section class="panel todo-panel">
      <div class="panel-header flex-between clickable" @click="toggleCollapse('todo')">
        <h3 class="text-todo">
          📝 个人待办事项 ({{ pendingTodos.length }})
          <span class="collapse-hint">{{ collapseState.todo ? '点击展开' : '点击折叠' }}</span>
        </h3>
      </div>

      <div v-show="!collapseState.todo" class="panel-content">
        <table class="standard-table">
          <thead>
            <tr>
              <th width="60">状态</th>
              <th width="150">订单 ID</th>
              <th width="120">工序 ID</th>
              <th class="text-left">任务内容描述</th>
              <th width="150">预计工期</th>
              <th width="100">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="todo in pendingTodos" :key="todo.id">
              <td><input type="checkbox" class="todo-check" @change="completeTodo(todo.id)" /></td>
              <td class="id-font">{{ todo.orderId }}</td>
              <td>
                <span class="task-tag dark">{{ todo.P_ID }}</span>
              </td>
              <td class="text-left">{{ todo.content }}</td>
              <td class="duration-font">{{ formatDuration(todo.duration) }}</td>
              <td><button class="btn-link" @click.stop="handleTodo(todo)">处理</button></td>
            </tr>
            <tr v-if="pendingTodos.length === 0">
              <td colspan="6" class="empty-placeholder">☕ 暂时没有分配给您的任务</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel list-panel">
      <div class="panel-header flex-between clickable" @click="toggleCollapse('list')">
        <h3>
          📊 全局订单监控 ({{ filteredOrders.length }})
          <span class="collapse-hint">{{ collapseState.list ? '点击展开' : '点击折叠' }}</span>
        </h3>
        <div class="filter-tools" @click.stop>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索订单、客户..."
            class="search-input"
          />
        </div>
      </div>

      <div v-show="!collapseState.list" class="panel-content">
        <table class="standard-table">
          <thead>
            <tr>
              <th width="140">订单号</th>
              <th>客户名称</th>
              <th width="100">优先级</th>
              <th width="120">当前阶段</th>
              <th width="150">承诺交期</th>
              <th width="80">状态</th>
              <th width="180">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.orderId">
              <td class="id-font">{{ order.orderId }}</td>
              <td>{{ order.customer }}</td>
              <td>
                <span class="prio-tag" :class="order.priority">{{ order.priority }}</span>
              </td>
              <td>{{ order.stage }}</td>
              <td class="time-font">{{ order.deadline }}</td>
              <td>
                <div class="risk-lamp" :style="{ backgroundColor: getRiskColor(order) }"></div>
              </td>
              <td class="ops">
                <button class="btn-action detail" @click.stop="openDetail(order)">详情</button>
                <button class="btn-action delete" @click.stop="confirmDelete(order)">移除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <OrderDetail
      v-for="(order, index) in openDetails"
      :key="order.orderId"
      :order="order"
      :initialX="150 + (index % 5) * 40"
      :initialY="100 + (index % 5) * 40"
      :zIndex="zIndexMap[order.orderId] || 1000"
      @close="closeDetail(order.orderId)"
      @focus="bringToFront(order.orderId)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import OrderDetail from './OrderDetail.vue'
import { AuditStatus, OrderStage, Priority, ProcessStage, type IOrder } from '@/types/Order'

import { AlertSeverity, AlertStatus, type IAlert } from '@/types/Alert'

// --- 接口定义 ---
interface ITodo {
  id: number
  orderId: string
  P_ID: string
  content: string
  duration: { days: number; hours: number }
  done: boolean
}

// --- 基础状态 ---
const collapseState = reactive({ alert: false, todo: false, list: false })
const toggleCollapse = (key: keyof typeof collapseState) =>
  (collapseState[key] = !collapseState[key])
const searchQuery = ref('')

// --- 时间格式化工具 ---
const formatTimestamp = (date: Date = new Date()): string => {
  const Y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const D = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

// --- 模拟数据 (匹配 IOrder 接口) ---
const orders = ref<IOrder[]>([
  {
    orderId: 'ORD-2026-CATL-001',
    customer: '宁德时代 (CATL)',
    deadline: '2026-02-15',
    stage: OrderStage.OnGoing,
    priority: Priority.High,
    auditStatus: AuditStatus.Approved,
    auditLogs: [
      {
        time: '2026-01-01',
        operator: '泥人张',
        action: '提交审批',
      },
      {
        time: '2026-01-02',
        operator: '审核佬',
        action: '通过审批',
      },
    ],
    subTasks: [
      {
        P_ID: 'CNC-26-01',
        P_Name: 'CNC加工',
        owner: '王工',
        input: '铝型材',
        output: '模组支架',
        pre_start: '2026-01-20',
        pre_end: '2026-01-25',
        act_start: '2026-01-21',
        act_end: '',
        ProcessStage: ProcessStage.Blocked,
        alerts: [
          {
            orderId: 'ORD-2026-CATL-001',
            P_ID: 'CNC-26-01',
            severity: AlertSeverity.Critical,
            reason: '切削主轴负载过载，已触发自动停机',
            triggered_at: '2026-01-24 08:30:15',
            resolved_at: '',
            AlertStatus: AlertStatus.active,
          },
        ],
      },
    ],
  },
])

const todoList = ref<ITodo[]>([
  {
    id: 1,
    orderId: 'ORD-2026-CATL-001',
    P_ID: 'CNC-26-01',
    content: '检查并清理CNC废料槽',
    duration: { days: 0, hours: 1 },
    done: false,
  },
])

// --- 业务逻辑 ---
const pendingTodos = computed(() => todoList.value.filter((t) => !t.done))

const allAlerts = computed(() => {
  const list: Array<IAlert & { _order: IOrder }> = []
  orders.value.forEach((o) => {
    o.subTasks?.forEach((t) => {
      // 仅显示未解决(resolved_at为空)的预警
      t.alerts?.filter((a) => !a.resolved_at).forEach((a) => list.push({ ...a, _order: o }))
    })
  })
  return list.sort((a, b) => b.triggered_at.localeCompare(a.triggered_at))
})

const formatDuration = (d: { days: number; hours: number }) => {
  const dayStr = d.days > 0 ? `${d.days}天` : ''
  const hourStr = d.hours > 0 ? `${d.hours}小时` : ''
  return dayStr + hourStr || '0小时'
}

const getSeverityClass = (s: AlertSeverity) => {
  if (s === AlertSeverity.Critical) return 'Critical'
  if (s === AlertSeverity.Warn) return 'warn'
  return 'Info'
}

const generateTodo = (alertItem: IAlert): void => {
  const newTodo: ITodo = {
    id: Date.now(),
    orderId: alertItem.orderId,
    P_ID: alertItem.P_ID,
    content: `[生产指令] 处理预警: ${alertItem.reason}`,
    duration: { days: 0, hours: 2 },
    done: false,
  }
  todoList.value.unshift(newTodo)
  window.alert(`已为订单 ${alertItem.orderId} 生成新工单`)
}

const completeTodo = (id: number) => {
  const t = todoList.value.find((i) => i.id === id)
  if (t) t.done = true
}

const handleAck = (alertItem: IAlert) => {
  alertItem.resolved_at = formatTimestamp()
  console.log(`预警已确认: ${alertItem.P_ID} at ${alertItem.resolved_at}`)
}

const handleTodo = (todoItem: ITodo) => {
  console.log('正在执行任务:', todoItem.content)
}

// --- 搜索与监控 ---
const filteredOrders = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return orders.value.filter(
    (o) => o.orderId.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q),
  )
})

const getRiskColor = (order: IOrder) => {
  const alerts = order.subTasks?.flatMap((t) => t.alerts?.filter((a) => !a.resolved_at) || []) || []
  if (alerts.some((a) => a.severity === AlertSeverity.Critical)) return '#f56c6c'
  if (alerts.some((a) => a.severity === AlertSeverity.Warn)) return '#e6a23c'
  return '#67c23a'
}

const confirmDelete = (order: IOrder) => {
  if (window.confirm(`确认移除订单 ${order.orderId}?`)) {
    orders.value = orders.value.filter((o) => o.orderId !== order.orderId)
    closeDetail(order.orderId)
  }
}

// --- 弹窗逻辑 ---
const openDetails = ref<IOrder[]>([])
const zIndexMap = reactive<Record<string, number>>({})
let topZ = 1000

const openDetail = (order: IOrder) => {
  if (!openDetails.value.some((o) => o.orderId === order.orderId)) openDetails.value.push(order)
  bringToFront(order.orderId)
}
const closeDetail = (id: string) =>
  (openDetails.value = openDetails.value.filter((o) => o.orderId !== id))
const bringToFront = (id: string) => (zIndexMap[id] = ++topZ)
</script>

<style scoped>
.tracker-main-layout {
  padding: 24px;
  background: #f4f7f9;
  min-height: 100vh;
}
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.clickable {
  cursor: pointer;
  transition: background 0.2s;
}
.clickable:hover {
  background: #f8fafc;
}

.panel-header {
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collapse-hint {
  font-size: 12px;
  color: #94a3b8;
  font-weight: normal;
  margin-left: 10px;
}
.text-danger {
  color: #e53e3e;
}
.text-todo {
  color: #6366f1;
}

.standard-table {
  width: 100%;
  border-collapse: collapse;
}
.standard-table th {
  background: #f8fafc;
  color: #64748b;
  padding: 12px;
  border-bottom: 2px solid #e2e8f0;
  font-size: 13px;
}
.standard-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf2f7;
  text-align: center;
  font-size: 14px;
}

.id-font {
  font-family: 'Consolas', monospace;
  font-weight: bold;
  color: #2b6cb0;
}
.time-font {
  color: #718096;
  font-size: 12px;
}
.duration-font {
  font-weight: 500;
  color: #4a5568;
}

.sev-badge {
  padding: 4px 10px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}
.sev-badge.Critical {
  background: #f56c6c;
}
.sev-badge.warn {
  background: #e6a23c;
}
.sev-badge.Info {
  background: #409eff;
}

.prio-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
}
.prio-tag.特急 {
  color: #f56c6c;
  border-color: #fab6b6;
  background: #fef2f2;
}

.task-tag {
  background: #edf2f7;
  color: #4a5568;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.task-tag.dark {
  background: #4a5568;
  color: #fff;
}

.todo-panel {
  border-left: 6px solid #6366f1;
}
.risk-lamp {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 auto;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
}

.ops {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.btn-tool,
.btn-action {
  padding: 5px 12px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  font-size: 12px;
}
.btn-tool.ack {
  color: #67c23a;
  background: #f0f9eb;
}
.btn-tool.todo {
  color: #e6a23c;
  background: #fdf6ec;
}
.btn-action.detail {
  background: #3182ce;
  color: #fff;
  border: none;
}
.btn-action.delete {
  background: #fff5f5;
  color: #c53030;
  border: none;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 240px;
  outline: none;
}
.search-input:focus {
  border-color: #6366f1;
}
.empty-placeholder {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}
</style>
