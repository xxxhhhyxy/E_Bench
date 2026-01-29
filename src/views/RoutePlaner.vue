<template>
  <Transition name="slide-up">
    <div v-if="isOpen" class="route-planer-overlay">
      <div class="planer-container">
        <header class="planer-header">
          <div class="header-left">
            <span class="badge">工艺规划中</span>
            <h2>路线规划：{{ order?.orderId }}</h2>
          </div>
          <div class="header-right">
            <button class="btn-secondary" @click="close">取消</button>
            <button class="btn-primary" @click="saveRoute">保存工艺路线</button>
          </div>
        </header>

        <main class="planer-content">
          <section class="info-reference-panel">
            <div class="panel-title">📌 订单原始需求 (提交参考)</div>
            <div class="info-grid-compact">
              <div class="info-item">
                <label>客户名称</label>
                <div class="val">{{ order?.customer }}</div>
              </div>
              <div class="info-item">
                <label>订单编号</label>
                <div class="val-id">{{ order?.orderId }}</div>
              </div>
              <div class="info-item">
                <label>截止日期</label>
                <div class="val">{{ order?.deadline }}</div>
              </div>
              <div class="info-item">
                <label>版本标识</label>
                <div class="val">Tag: {{ order?.versionTag || 'V1.0' }}</div>
              </div>
            </div>

            <div class="text-reference-group">
              <div class="text-box">
                <label>客户备注 (Remark)</label>
                <div class="content">{{ order?.remark || '无备注' }}</div>
              </div>
              <div class="text-box highlight-box">
                <label>工序参考 (Proposed Task)</label>
                <div class="content">{{ order?.proposedTask || '未提供参考工序' }}</div>
              </div>
            </div>
          </section>

          <section class="routing-editor-panel">
            <div class="placeholder-msg">这里将进行工序拆解（Route 录入）...</div>
          </section>
        </main>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IOrder } from '@/types/Order'

const isOpen = ref(false)
const order = ref<IOrder | null>(null)

// 由父组件 (DispatchCenter) 调用
const open = (targetOrder: IOrder) => {
  order.value = targetOrder
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
  order.value = null
}

const saveRoute = () => {
  // 保存逻辑
  console.log('保存工艺路线...')
}

defineExpose({ open })
</script>

<style scoped>
.route-planer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* 从底部弹出的抽屉感 */
}

.planer-container {
  width: 95vw;
  height: 92vh;
  background: #f1f5f9;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.planer-header {
  padding: 16px 24px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  background: #dbeafe;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.planer-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 350px 1fr; /* 左侧参考，右侧编辑 */
  gap: 20px;
}

/* 核心信息面板 */
.info-reference-panel {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #475569;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
}

.info-grid-compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item label {
  font-size: 11px;
  color: #94a3b8;
  display: block;
  margin-bottom: 2px;
}

.info-item .val {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.val-id {
  font-family: monospace;
  color: #2563eb;
  font-weight: bold;
}

/* 文本块布局 */
.text-reference-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-box {
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  border-left: 4px solid #cbd5e1;
}

.highlight-box {
  border-left-color: #2563eb;
  background: #eff6ff;
}

.text-box label {
  font-size: 11px;
  color: #64748b;
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}

.text-box .content {
  font-size: 13px;
  line-height: 1.5;
  color: #1e293b;
  white-space: pre-wrap;
}

/* 编辑区暂位 */
.routing-editor-panel {
  background: white;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #94a3b8;
}

/* 按钮样式 */
.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
