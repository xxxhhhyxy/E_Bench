<template>
  <Transition name="bench-fade">
    <div v-if="isOpen" class="audit-bench-overlay">
      <div class="audit-bench-container">
        <header class="bench-header">
          <div class="header-main">
            <span class="badge-status">{{ order?.auditStatus }}</span>
            <h2 class="order-title">
              订单审核工作台 <small>{{ order?.orderId }}</small>
            </h2>
          </div>
          <button class="btn-close" @click="close">✕</button>
        </header>

        <main class="bench-content">
          <section class="details-panel">
            <div class="info-grid">
              <div class="info-item">
                <label>客户名称</label>
                <div class="val">{{ order?.customer }}</div>
              </div>
              <div class="info-item">
                <label>截止日期</label>
                <div class="val">{{ order?.deadline }}</div>
              </div>
              <div class="info-item">
                <label>优先级</label>
                <div :class="['val', 'pri-' + order?.priority]">{{ order?.priority }}</div>
              </div>
              <div class="info-item">
                <label>版本号</label>
                <div class="val">Tag: {{ order?.versionTag }}</div>
              </div>
            </div>

            <div class="text-group">
              <label>📝 客户备注说明</label>
              <div class="content-box remark-box">
                {{ order?.remark || '申请人未填写备注' }}
              </div>
            </div>

            <div class="text-group">
              <label>⚙️ 工序参考 (Proposed Task)</label>
              <div class="content-box tech-box">
                <pre>{{ order?.proposedTask || '未检测到工艺参考说明' }}</pre>
              </div>
            </div>

            <div class="attachment-group">
              <label>📁 附件材料 ({{ order?.attachments?.length || 0 }})</label>
              <div class="file-list">
                <div v-for="(file, idx) in order?.attachments" :key="idx" class="file-item">
                  <div class="file-info">
                    <span class="file-cat">{{ file.category }}</span>
                    <span class="file-name">{{ file.fileName }}</span>
                  </div>
                  <button 
                    v-if="file.file" 
                    class="btn-download-mini" 
                    @click="downloadFile(file)"
                  >
                    下载文件
                  </button>
                </div>
                <div v-if="!order?.attachments?.length" class="empty-tip">无上传文件</div>
              </div>
            </div>
          </section>

          <aside class="action-panel">
            <div class="sticky-action">
              <h3>审核决策</h3>
              <p class="panel-desc">请评估订单可行性，通过后订单将进入生产排程。</p>

              <div class="form-item">
                <label>审核批注</label>
                <textarea
                  v-model="auditComment"
                  placeholder="请输入驳回理由或通过说明..."
                ></textarea>
              </div>

              <div class="action-footer">
                <button class="btn-reject" @click="handleReject">驳回申请</button>
                <button class="btn-approve" @click="handleApprove">通过审核</button>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IOrder, IAttachmentItem } from '@/types/Order'
import { useOrderStore } from '@/stores/orderStore'

const props = defineProps<{
  order: IOrder | null
}>()

const emit = defineEmits(['closed'])
const store = useOrderStore()

const isOpen = ref(false)
const auditComment = ref('')

// 公开给父组件的方法
const open = () => {
  isOpen.value = true
  auditComment.value = ''
}
const close = () => {
  isOpen.value = false
  emit('closed')
}

defineExpose({ open, close })

/**
 * 下载附件逻辑
 */
const downloadFile = (item: IAttachmentItem) => {
  if (!item.file) return
  
  // 创建指向内存中文件的 URL
  const url = URL.createObjectURL(item.file)
  const link = document.createElement('a')
  link.href = url
  link.download = item.fileName
  
  // 执行模拟点击下载
  document.body.appendChild(link)
  link.click()
  
  // 善后：移除临时节点并释放内存
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// --- 核心操作逻辑 ---

const handleApprove = () => {
  if (!props.order) return

  if (confirm(`确定通过订单 ${props.order.orderId} 吗？`)) {
    // 传递 auditComment 给 store 以便记录日志
    store.approveOrder(props.order.orderId) 
    close()
  }
}

const handleReject = () => {
  if (!props.order) return

  if (!auditComment.value) {
    alert('驳回时请在“审核批注”中填写理由')
    return
  }

  store.rejectOrder(props.order.orderId, auditComment.value)
  close()
}
</script>

<style scoped>
.audit-bench-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.audit-bench-container {
  background: #fdfdfd;
  width: 85vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
}

.bench-header {
  padding: 20px 30px;
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 15px;
}

.badge-status {
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.order-title {
  margin: 0;
  font-size: 1.25rem;
}

.order-title small {
  color: #94a3b8;
  margin-left: 10px;
  font-family: monospace;
}

.bench-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 340px;
  overflow: hidden;
}

.details-panel {
  padding: 40px;
  overflow-y: auto;
  background: #fff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.val {
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
}

.content-box {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  line-height: 1.6;
  margin-bottom: 30px;
}

.remark-box {
  background: #fafafa;
}

.tech-box {
  background: #f8fafc;
  color: #334155;
  font-family: 'Courier New', Courier, monospace;
  overflow-x: auto;
}

.tech-box pre {
  margin: 0;
  white-space: pre-wrap;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-cat {
  font-size: 11px;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #64748b;
}

.file-name {
  font-size: 14px;
  color: #334155;
}

.btn-download-mini {
  background: #f1f5f9;
  color: #2563eb;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-download-mini:hover {
  background: #e0e7ff;
  border-color: #c7d2fe;
}

.empty-tip {
  color: #94a3b8;
  font-size: 13px;
  font-style: italic;
}

.action-panel {
  padding: 30px;
  background: #f8fafc;
  border-left: 1px solid #eee;
}

.sticky-action textarea {
  width: 100%;
  height: 180px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  resize: none;
  margin-bottom: 20px;
}

.action-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

button {
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-approve {
  background: #2563eb;
  color: white;
}

.btn-reject {
  background: #fff;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.panel-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;
}

/* 动画效果 */
.bench-fade-enter-active,
.bench-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.bench-fade-enter-from,
.bench-fade-leave-to {
  opacity: 0;
  transform: translateX(50px);
}

/* 优先级配色 */
.pri-High, .pri-Urgent {
  color: #ef4444;
  font-weight: bold;
}
</style>