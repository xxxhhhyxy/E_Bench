// src/types/order.ts

import type { IProcess } from './Process'

/** 预警严重程度 */
export enum AlertSeverity {
  Critical = '严重', // 严重：通常意味着生产停滞
  Warn = '警告', // 警告：存在风险，需关注
  Info = '提示', // 提示：普通信息记录
}
/**
 * 预警事件类别
 */
export enum AlertType {
  MATERIAL_MISSING = '关键料缺失',
  ETA_SLIP = '到料ETA晚于计划开工',
  STEP_DELAY = '工序未按计划开始/完成',
  OUTSOURCE_OVERDUE = '外发超期',
  DUE_DATE_RISK = '交期风险',
  SCHEDULE_CONFLICT = '排期冲突',
}
export enum AlertStatus {
  active = '激活',
  acknowledge = '已知',
  resolved = '解决',
}
/** * 预警事件记录
 */
export interface IAlert {
  orderId: string //出自哪个订单？
  P_ID: string //出自哪个工序？
  severity: AlertSeverity //紧急程度
  reason: string // 触发预警的具体原因
  triggered_at: string // 触发时间点
  resolved_at: string // 解决时间点
  AlertStatus: AlertStatus
}

/** * 订单优先级（决定生产/审核的先后顺序）
 */
export enum Priority {
  Critical = '特急', // 特急
  High = '高', // 高
  Normal = '中', // 普通
  Low = '低', // 低
}

//审核状态（用于 DataUploader 页面的审批流）

export enum AuditStatus {
  Pending = '待审核', // 已提交，等待管理层审批
  Rejected = '被驳回', // 审核未通过，需修改后重新提交
  Approved = '已通过', // 审核通过，进入正式生产追踪
}
/** * 产品条目（一个订单可以包含多个不同产品）
 */
export interface IProductItem {
  name: string // 产品名称（如：轴承、电芯支架）
  quantity: number // 数量
  unit: string // 单位（如：pcs, kg, 套）
}
//审核记录
export interface IAuditLog {
  time: string
  operator: string
  action: string
  comment?: string
}

/** * 单个工序的状态
 */
export enum OrderStage {
  Audit = '待审核', //处于审核中
  OnGoing = '正常运行', //
  Alert = '警告', //工序暂停，需要处理警告事件
  Completed = '已完成', //工序完成
}

/** 文件类别枚举 */
export enum AttachmentCategory {
  OrderInfo = '订单信息表',
  Packaging = '产品包装指示单',
  ProductCard = '成品指示卡',
  Delivery = '送货单',
  Others = '其他',
}

/** 附件条目接口 */
export interface IAttachmentItem {
  category: AttachmentCategory // 附件分类
  fileName: string // 文件名
  file?: File // 可选：用于本地上传阶段的 File 对象
  url?: string // 可选：用于查看阶段的服务器下载链接
}

/** * 核心订单接口 (IOrder)
 * 整合了 Tracker(追踪) 与 Uploader(上传) 的所有字段
 */
export interface IOrder {
  // --- 基础识别信息 ---
  orderId: string // 订单唯一编号 (如 ORD-2026-001)
  customer: string // 客户名称
  versionTag?: string // 版本标签 (用于区分不同的生产版本或图纸版本)
  deadline: string //承诺交期
  attachments?: IAttachmentItem[] //可能的附件
  proposedTask?: string //订单申报时智能生成的可能的工序

  // --- 详细内容 ---
  products?: IProductItem[] // 包含的产品清单（一单多货）
  remark?: string // 客户下单时的备注或者特殊要求
  bomRequirement?: string[] //原材料
  subTasks?: IProcess[] //拆分出的子任务/工序

  // --- 生产与时效 ---
  stage: OrderStage //该订单的大状态
  priority: Priority // 优先级（特急/高/普通/低）

  // --- 审核相关 ---
  auditStatus: AuditStatus // DataUploader 关注的状态
  auditLogs: IAuditLog[] // 审批日志：记录“单子是怎么过的” (用于查看审核记录), OrderState不是Audit的时候不再更新
}
