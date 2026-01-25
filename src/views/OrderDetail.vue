<template>
  <div
    class="order-detail-card"
    :style="cardStyle"
    :class="{
      'is-maximized': isMaximized,
      'is-resizing': isResizing,
      'is-dragging': isDragging,
    }"
    @mousedown="$emit('focus')"
  >
    <header class="modal-header" @mousedown="handleDragStart" @dblclick="toggleMaximize">
      <div class="header-left">
        <div class="risk-lamp" :class="hasActiveAlert ? globalRiskClass : 'bg-none'"></div>
        <span class="window-title">订单详情：{{ order.orderId }}</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click.stop="toggleMaximize">
          <span v-if="isMaximized">❐</span>
          <span v-else>▢</span>
        </button>
        <button class="action-btn close-btn" @click.stop="$emit('close')">×</button>
      </div>
    </header>

    <div class="modal-content">
      <section class="detail-section">
        <h4 class="section-title">📌 基础信息</h4>
        <div class="info-grid">
          <div class="grid-item">
            <label>客户名称：</label><span>{{ order.customer }}</span>
          </div>
          <div class="grid-item">
            <label>承诺交期：</label><span>{{ order.deadline }}</span>
          </div>
          <div class="grid-item">
            <label>版本标签：</label><span>{{ order.versionTag || 'N/A' }}</span>
          </div>
          <div class="grid-item">
            <label>订单状态：</label><span>{{ order.stage }}</span>
          </div>
          <div class="grid-item">
            <label>优先级：</label>
            <span :class="['priority-text', order.priority]">{{ order.priority }}</span>
          </div>
        </div>
      </section>

      <section class="detail-section" v-if="order.auditLogs?.length">
        <div class="section-header-row" @click="isAuditExpanded = !isAuditExpanded">
          <h4 class="section-title no-margin">⚖️ 审批流程</h4>
          <span class="chevron-icon" :class="{ 'is-open': isAuditExpanded }"></span>
        </div>

        <div v-if="!isAuditExpanded && latestAuditLog" class="audit-collapsed-info unified-font">
          {{ latestAuditLog.time }} 最后操作：{{ latestAuditLog.operator
          }}{{ latestAuditLog.action }}
        </div>

        <div v-else-if="isAuditExpanded" class="audit-expand-content">
          <div v-for="(log, i) in displayedAuditLogs" :key="i" class="audit-step-row">
            <span class="a-time unified-font">{{ log.time }}</span>
            <span class="a-user unified-font">{{ log.operator }}</span>
            <span class="a-action-tag unified-font" :class="log.action">{{ log.action }}</span>
            <span v-if="log.comment" class="a-comment unified-font">“{{ log.comment }}”</span>
          </div>

          <div
            v-if="sortedAuditLogs.length > 3"
            class="view-more-bar"
            @click="showAllAudit = !showAllAudit"
          >
            {{ showAllAudit ? '收起部分记录' : `查看全部 ${sortedAuditLogs.length} 条记录` }}
          </div>
        </div>
      </section>

      <section class="detail-section">
        <h4 class="section-title">⚙️ 执行工序追踪</h4>
        <div
          v-for="task in order.subTasks"
          :key="task.P_ID"
          class="full-task-card"
          :style="getTaskBorderStyle(task)"
        >
          <div class="task-header-row">
            <span class="t-name-large">{{ task.P_Name }}</span>
            <span class="t-stage-tag" :class="task.ProcessStage">{{ task.ProcessStage }}</span>
          </div>

          <div class="task-attribute-grid">
            <div class="attr-item"><span class="attr-label">工序ID：</span>{{ task.P_ID }}</div>
            <div class="attr-item"><span class="attr-label">负责人：</span>{{ task.owner }}</div>
            <div class="attr-item">
              <span class="attr-label">计划开始：</span>{{ task.pre_start }}
            </div>
            <div class="attr-item">
              <span class="attr-label">计划结束：</span>{{ task.pre_end }}
            </div>
          </div>

          <div class="task-logs-area flush-top">
            <div class="mini-timeline">
              <div v-for="(item, idx) in getMixedLogs(task)" :key="idx" class="timeline-row">
                <span class="row-time unified-font">{{ item.time }}</span>
                <span class="row-msg unified-font">
                  <template v-if="item.type === 'alert_start'">
                    <b class="text-red">🚨 [{{ item.severity }}]</b> 触发预警：{{ item.reason }}
                  </template>
                  <template v-else-if="item.type === 'alert_end'">
                    <b class="text-green">✅ [已解决]</b> {{ item.reason }}
                  </template>
                  <template v-else-if="item.type === 'status_change'">
                    <b class="text-blue">ℹ️ 系统：</b> {{ item.process }}
                  </template>
                  <template v-else>
                    <b>{{ item.operator }}</b
                    >: {{ item.process }}
                  </template>
                </span>
              </div>
              <div v-if="getMixedLogs(task).length === 0" class="no-logs-hint">
                暂无生产执行记录
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="detail-section" v-if="order.attachments?.length">
        <h4 class="section-title">📁 附加材料</h4>
        <div class="attachments-list">
          <div v-for="(item, index) in order.attachments" :key="index" class="attachment-row">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <span class="file-name" :title="item.fileName">{{ item.fileName }}</span>
            </div>
            <div class="file-meta">
              <span class="category-tag">{{ item.category }}</span>
              <button class="download-btn" @click="handleDownload(item)">下载</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <template v-if="!isMaximized">
      <div class="resizer resizer-r" @mousedown.stop="handleResizeStart($event, 'r')"></div>
      <div class="resizer resizer-b" @mousedown.stop="handleResizeStart($event, 'b')"></div>
      <div class="resizer resizer-rb" @mousedown.stop="handleResizeStart($event, 'rb')"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AlertSeverity } from '@/types/Alert'
import { type IAttachmentItem, type IOrder } from '@/types/Order'
import { ProcessStage, type IProcess } from '@/types/Process'
import { ref, reactive, computed } from 'vue'

/**
 * 混合日志联合类型：消除 Any
 */
interface IMixedLog {
  time: string
  type: 'log' | 'alert_start' | 'alert_end' | 'status_change'
  operator?: string
  process?: string
  severity?: AlertSeverity
  reason?: string
}

const props = defineProps<{
  order: IOrder
  initialX: number
  initialY: number
  zIndex: number
}>()

const emit = defineEmits(['close', 'focus'])

// --- 状态 ---
const isMaximized = ref(false)
const isResizing = ref(false)
const isDragging = ref(false)
const isAuditExpanded = ref(false)
const showAllAudit = ref(false) // 是否显示全部审批

const position = reactive({ x: props.initialX, y: props.initialY })
const size = reactive({ width: 700, height: 750 })
const lastSize = reactive({ x: 0, y: 0, w: 0, h: 0 })

// --- 样式计算 ---
const cardStyle = computed(() => {
  if (isMaximized.value) {
    return {
      width: 'calc(100% - 20px)',
      height: 'calc(100% - 20px)',
      transform: 'translate3d(10px, 10px, 0)',
      zIndex: 9999,
    }
  }
  return {
    width: `${size.width}px`,
    height: `${size.height}px`,
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    zIndex: props.zIndex,
    transition:
      isResizing.value || isDragging.value
        ? 'none'
        : 'transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)',
  }
})

// --- 审批逻辑 (带“查看更多”功能) ---
const latestAuditLog = computed(
  () => props.order.auditLogs?.[props.order.auditLogs.length - 1] || null,
)
const sortedAuditLogs = computed(() =>
  [...(props.order.auditLogs || [])].sort((a, b) => b.time.localeCompare(a.time)),
)
const displayedAuditLogs = computed(() => {
  if (showAllAudit.value) return sortedAuditLogs.value
  return sortedAuditLogs.value.slice(0, 3)
})

/**
 * 核心：混合日志抓取 (Type-Safe)
 */
const getMixedLogs = (task: IProcess): IMixedLog[] => {
  const mixed: IMixedLog[] = []
  task.logs?.forEach((l) =>
    mixed.push({ time: l.time, operator: l.operator, process: l.process, type: 'log' }),
  )
  task.alerts?.forEach((a) => {
    if (a.triggered_at)
      mixed.push({
        time: a.triggered_at,
        severity: a.severity,
        reason: a.reason,
        type: 'alert_start',
      })
    if (a.resolved_at) mixed.push({ time: a.resolved_at, reason: a.reason, type: 'alert_end' })
  })
  if (task.act_start)
    mixed.push({ time: task.act_start, process: '工序启动', type: 'status_change' })
  if (task.act_end) mixed.push({ time: task.act_end, process: '工序完工', type: 'status_change' })
  return mixed.sort((a, b) => b.time.localeCompare(a.time))
}

// --- 风险与样式逻辑 ---
const isTaskAlerting = (task: IProcess) =>
  task.ProcessStage !== ProcessStage.Done &&
  (task.alerts?.filter((a) => !a.resolved_at).length || 0) > 0

const hasActiveAlert = computed(() => props.order.subTasks?.some((t) => isTaskAlerting(t)))

const globalRiskClass = computed(() => {
  const activeAlerts =
    props.order.subTasks?.flatMap((t) => t.alerts?.filter((a) => !a.resolved_at) || []) || []
  return activeAlerts.some((a) => a.severity === AlertSeverity.Critical)
    ? 'bg-critical'
    : 'bg-warning'
})

const getTaskBorderStyle = (task: IProcess) => {
  if (!isTaskAlerting(task)) return { borderLeft: '4px solid #e5e7eb' }
  const isCritical = task.alerts?.some(
    (a) => !a.resolved_at && a.severity === AlertSeverity.Critical,
  )
  return { borderLeft: `6px solid ${isCritical ? '#ef4444' : '#f59e0b'}` }
}

// --- 窗口交互 ---
const toggleMaximize = () => {
  if (!isMaximized.value)
    Object.assign(lastSize, { x: position.x, y: position.y, w: size.width, h: size.height })
  else {
    Object.assign(position, { x: lastSize.x, y: lastSize.y })
    Object.assign(size, { width: lastSize.w, height: lastSize.h })
  }
  isMaximized.value = !isMaximized.value
}

const handleDragStart = (e: MouseEvent) => {
  if (isMaximized.value || (e.target as HTMLElement).closest('.header-actions')) return
  emit('focus')
  isDragging.value = true
  const startX = e.clientX - position.x,
    startY = e.clientY - position.y
  const onMove = (ev: MouseEvent) => {
    position.x = ev.clientX - startX
    position.y = ev.clientY - startY
  }
  const onUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const handleResizeStart = (e: MouseEvent, dir: string) => {
  isResizing.value = true
  const sW = size.width,
    sH = size.height,
    sX = e.clientX,
    sY = e.clientY
  const onMove = (ev: MouseEvent) => {
    if (dir.includes('r')) size.width = Math.max(400, sW + (ev.clientX - sX))
    if (dir.includes('b')) size.height = Math.max(300, sH + (ev.clientY - sY))
  }
  const onUp = () => {
    isResizing.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const handleDownload = (att: IAttachmentItem) => {
  if (att.url) window.open(att.url, '_blank')
  else if (att.file) {
    const u = URL.createObjectURL(att.file)
    const a = document.createElement('a')
    a.href = u
    a.download = att.fileName
    a.click()
    URL.revokeObjectURL(u)
  }
}
</script>

<style scoped>
.order-detail-card {
  position: fixed;
  left: 0;
  top: 0;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid #d1d5db;
  overflow: hidden;
  container-type: inline-size;
}
.modal-header {
  background: #1a1a1a;
  color: #fff;
  padding: 10px 16px;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.risk-lamp {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}
.bg-critical {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}
.bg-warning {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}
.bg-none {
  background: #4b5563;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex-grow: 1;
  background: #f8fafc;
}
.detail-section {
  background: #fff;
  border-radius: 8px;
  padding: 18px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}
.section-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 14px 0;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 6px;
}
.section-title.no-margin {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.2s;
}
.section-header-row:hover {
  opacity: 0.7;
}

/* 现代化的 Chevron 箭头样式 */
.chevron-icon {
  width: 8px;
  height: 8px;
  border-right: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
  transform: rotate(-45deg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 8px;
}
.chevron-icon.is-open {
  transform: rotate(45deg);
}

.audit-collapsed-info {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 10px;
}

.audit-step-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.view-more-bar {
  text-align: center;
  font-size: 11px;
  color: #2563eb;
  padding: 8px;
  cursor: pointer;
  background: #eff6ff;
  border-radius: 4px;
  margin-top: 10px;
  font-weight: 600;
}
.view-more-bar:hover {
  background: #dbeafe;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.grid-item {
  font-size: 13px;
}
.grid-item label {
  color: #64748b;
  font-weight: 600;
}

.full-task-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}
.task-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.t-name-large {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
.t-stage-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid currentColor;
}

.task-attribute-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 15px;
}
.attr-item {
  font-size: 12px;
  color: #475569;
}
.attr-label {
  color: #94a3b8;
  font-weight: 600;
  margin-right: 4px;
}

.task-logs-area {
  border-top: 1px dashed #e2e8f0;
  padding-top: 12px;
}
.timeline-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f8fafc;
}
.unified-font {
  font-size: 12px;
  line-height: 1.5;
}
.row-time {
  color: #94a3b8;
  font-family: 'Consolas', monospace;
}
.text-red {
  color: #e11d48;
}
.text-green {
  color: #10b981;
}
.text-blue {
  color: #3b82f6;
}

.action-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
}
.action-btn:hover {
  color: #fff;
  background: #333;
  border-radius: 4px;
}

.resizer {
  position: absolute;
  z-index: 100;
}
.resizer-rb {
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 70%, #cbd5e1 70%);
}

.priority-text.High {
  color: #ef4444;
  font-weight: bold;
}
.priority-text.Medium {
  color: #f59e0b;
  font-weight: bold;
}
.priority-text.Low {
  color: #10b981;
  font-weight: bold;
}
</style>
