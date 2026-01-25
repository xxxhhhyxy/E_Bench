<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isViewOnly ? '查看订单详情' : '新建订单申请' }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>

        <fieldset :disabled="isViewOnly" class="modal-body-fieldset">
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-item">
                <label>客户名称 <span v-if="!isViewOnly" class="req">*</span></label>
                <input v-model="form.customer" placeholder="输入客户名称" />
              </div>

              <div class="form-item">
                <label>订单编号 <span v-if="!isViewOnly" class="req">*</span></label>
                <input v-model="form.orderId" placeholder="ORD-2026-XXX" />
              </div>

              <div class="form-item">
                <label>交付截止日期 <span v-if="!isViewOnly" class="req">*</span></label>
                <input type="date" v-model="form.deadline" class="date-input" />
              </div>

              <div class="form-item">
                <label>优先级 <span v-if="!isViewOnly" class="req">*</span></label>
                <select v-model="form.priority">
                  <option v-for="p in Object.values(Priority)" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>

              <div class="form-item">
                <label>版本 Tag</label>
                <input v-model="form.versionTag" placeholder="v1.0" />
              </div>

              <div class="form-item full-width">
                <label>客户备注</label>
                <textarea
                  v-model="form.remark"
                  rows="2"
                  placeholder="填写特殊生产要求..."
                ></textarea>
              </div>
            </div>

            <div class="product-section">
              <div class="section-header">
                <h4>📦 产品明细</h4>
                <button v-if="!isViewOnly" class="btn-add-text" @click="addNewProductLine">
                  + 添加条目
                </button>
              </div>

              <div v-for="(p, index) in form.products" :key="index" class="product-row">
                <input v-model="p.name" placeholder="产品名称" style="flex: 2" />
                <input v-model.number="p.quantity" type="number" style="width: 80px" />
                <input v-model="p.unit" placeholder="单位" style="width: 60px" />
                <button
                  class="btn-del"
                  @click="form.products.splice(index, 1)"
                  v-if="form.products.length > 1 && !isViewOnly"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="upload-section">
              <div class="section-header">
                <h4>📁 上传材料</h4>
                <button v-if="!isViewOnly" class="btn-add-text" @click="addNewAttachment">
                  + 添加材料
                </button>
              </div>

              <div v-for="(item, index) in attachments" :key="index" class="upload-row">
                <select v-model="item.category" class="category-dropdown">
                  <option v-for="cat in Object.values(AttachmentCategory)" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>

                <div class="file-picker">
                  <input
                    type="file"
                    :id="'file-' + index"
                    class="hidden-file-input"
                    @change="handleFileSelect($event, index)"
                  />
                  <label
                    :for="isViewOnly ? '' : 'file-' + index"
                    class="file-box"
                    :class="{ 'view-mode': isViewOnly }"
                  >
                    {{ item.fileName || '点击选择本地文件' }}
                  </label>
                </div>

                <button v-if="!isViewOnly" class="btn-del" @click="attachments.splice(index, 1)">
                  ✕
                </button>
              </div>
            </div>

            <div class="task-extraction-section">
              <div class="section-header">
                <h4>⚙️ 工序参考</h4>
                <button v-if="!isViewOnly" class="btn-ai-extract" @click="handleAIExtract">
                  ✨ 智能填充参考
                </button>
              </div>

              <div class="extraction-container">
                <textarea
                  ref="autoTextarea"
                  v-model="extractionText"
                  class="auto-scaling-textarea"
                  :placeholder="isViewOnly ? '' : '在此输入工艺说明...'"
                  @input="adjustHeight"
                ></textarea>
              </div>
            </div>
          </div>
        </fieldset>

        <div class="modal-footer">
          <template v-if="!isViewOnly">
            <button class="btn-ghost" @click="isDraftBoxOpen = true">
              📂 草稿箱 ({{ draftList.length }})
            </button>

            <div class="right-actions">
              <button class="btn-secondary" @click="saveToDraft">保存草稿</button>
              <button class="btn-primary" @click="handleSubmit">提交申请</button>
            </div>
          </template>

          <template v-else>
            <div class="view-only-tip">当前为查看模式，内容不可修改</div>
            <button class="btn-primary" @click="close">确认并关闭</button>
          </template>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="isDraftBoxOpen" class="modal-overlay draft-z-index">
          <div class="modal-container draft-modal-width">
            <div class="modal-header">
              <h3>本地草稿箱</h3>
              <button class="close-btn" @click="isDraftBoxOpen = false">&times;</button>
            </div>
            <div class="modal-body">
              <div v-if="draftList.length === 0" class="empty-tip">暂无草稿</div>
              <div
                v-for="(draft, index) in draftList"
                :key="index"
                class="draft-item"
                @click="loadDraft(draft)"
              >
                <div class="draft-info">
                  <p class="draft-name">{{ draft._draftName }}</p>
                  <p class="draft-sub">
                    {{ draft.customer || '空客户' }} / {{ draft.orderId || '空单号' }}
                  </p>
                </div>
                <button class="btn-del-mini" @click.stop="deleteDraft(index)">删除</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import {
  type IOrder,
  Priority,
  AuditStatus,
  OrderStage,
  AttachmentCategory,
  type IAttachmentItem,
  type IProductItem,
} from '@/types/Order'

interface IDraft extends Partial<IOrder> {
  _draftName: string
  _extractionText?: string
}

const emit = defineEmits<{ (e: 'submitted', order: IOrder): void }>()

// --- 响应式状态 ---
const isOpen = ref(false)
const isViewOnly = ref(false) // 新增：控制是否只读
const isDraftBoxOpen = ref(false)
const draftList = ref<IDraft[]>([])
const attachments = ref<IAttachmentItem[]>([])
const extractionText = ref('')
const autoTextarea = ref<HTMLTextAreaElement | null>(null)

const getInitialForm = () => ({
  customer: '',
  orderId: '',
  deadline: '',
  priority: Priority.Normal,
  versionTag: '',
  remark: '',
  products: [{ name: '', quantity: 0, unit: 'pcs' }] as IProductItem[],
})

const form = reactive(getInitialForm())

// --- UI 处理 ---
const adjustHeight = () => {
  const el = autoTextarea.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
}

const handleAIExtract = () => {
  extractionText.value = '1. 原材料采购\n2. 基础冲压\n3. CNC精密加工\n4. 表面喷涂\n5. 质检与包装'
  nextTick(() => adjustHeight())
}

const addNewProductLine = () => form.products.push({ name: '', quantity: 0, unit: 'pcs' })
const addNewAttachment = () =>
  attachments.value.push({ category: AttachmentCategory.OrderInfo, fileName: '' })

const handleFileSelect = (event: Event, index: number) => {
  if (isViewOnly.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && attachments.value[index]) {
    attachments.value[index].fileName = file.name
    attachments.value[index].file = file
    target.value = ''
  }
}

// --- 核心生命周期控制 (重要修改) ---
/**
 * 暴露给父组件的打开方法
 * @param existingOrder 如果传入此参数，则进入查看模式
 */
const open = (existingOrder?: IOrder) => {
  if (existingOrder) {
    // 查看模式
    isViewOnly.value = true
    // 深度拷贝数据防止意外修改 Store
    const data = JSON.parse(JSON.stringify(existingOrder))
    Object.assign(form, data)
    attachments.value = data.attachments || []
    extractionText.value = data.proposedTask || ''
  } else {
    // 新建模式
    isViewOnly.value = false
    Object.assign(form, getInitialForm())
    attachments.value = []
    extractionText.value = ''
  }

  isOpen.value = true
  nextTick(() => adjustHeight())
}

const close = () => {
  isOpen.value = false
}

defineExpose({ open, close })

// --- 草稿逻辑 ---
onMounted(() => {
  const saved = localStorage.getItem('order_tracker_drafts')
  if (saved) draftList.value = JSON.parse(saved)
})

const saveToDraft = () => {
  const newDraft: IDraft = {
    ...JSON.parse(JSON.stringify(form)),
    _draftName: `草稿 ${new Date().toLocaleString()}`,
    _extractionText: extractionText.value,
    attachments: attachments.value,
  }
  draftList.value.unshift(newDraft)
  localStorage.setItem('order_tracker_drafts', JSON.stringify(draftList.value))
}

const loadDraft = (draft: IDraft) => {
  const data = JSON.parse(JSON.stringify(draft))
  attachments.value = data.attachments || []
  extractionText.value = data._extractionText || ''
  delete data._draftName
  delete data._extractionText
  Object.assign(form, data)
  isDraftBoxOpen.value = false
  nextTick(() => adjustHeight())
}

const deleteDraft = (index: number) => {
  draftList.value.splice(index, 1)
  localStorage.setItem('order_tracker_drafts', JSON.stringify(draftList.value))
}

const handleSubmit = () => {
  if (!form.customer || !form.orderId || !form.deadline) {
    alert('请填写必填项 (*)')
    return
  }

  const finalOrder: IOrder = {
    ...JSON.parse(JSON.stringify(form)),
    proposedTask: extractionText.value,
    attachments: [...attachments.value],
    subTasks: [],
    stage: OrderStage.Audit,
    auditStatus: AuditStatus.Pending,
    auditLogs: [
      {
        time: new Date().toLocaleString().replace(/\//g, '-'),
        operator: '申报系统',
        action: '提交申请',
        comment: '初始订单录入',
      },
    ],
  }

  emit('submitted', finalOrder)
  close()
}
</script>

<style scoped>
/* 原有样式保持 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  width: 720px;
  max-height: 92vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

/* 新增：fieldset 样式移除默认边框 */
.modal-body-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  min-width: 0;
  display: contents; /* 使 fieldset 容器不破坏 flex 布局 */
}

/* 当被禁用时的 UI 微调 */
.modal-body-fieldset:disabled input,
.modal-body-fieldset:disabled select,
.modal-body-fieldset:disabled textarea {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.view-only-tip {
  color: #6b7280;
  font-size: 13px;
  font-style: italic;
  display: flex;
  align-items: center;
}

.file-box.view-mode {
  background: #f3f4f6;
  border-style: solid;
  cursor: default;
}

/* 之前提供的其他样式... */
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.full-width {
  grid-column: span 2;
}
.req {
  color: #ef4444;
  margin-left: 2px;
}
.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #374151;
}
.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 12px;
}
.product-row,
.upload-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}
.auto-scaling-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: none;
  background: #fafafa;
  line-height: 1.6;
}
.btn-primary {
  background: #2563eb;
  color: white;
  padding: 10px 24px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-ghost {
  background: #f3f4f6;
  color: #4b5563;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.btn-add-text {
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.btn-del {
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}
.btn-del:hover {
  color: #ef4444;
}
.draft-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}
.draft-item:hover {
  background: #f0f7ff;
  border-color: #bfdbfe;
}
.draft-name {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
.draft-sub {
  font-size: 12px;
  color: #6b7280;
  margin: 2px 0 0;
}
.draft-z-index {
  z-index: 1100;
}
.draft-modal-width {
  width: 400px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
