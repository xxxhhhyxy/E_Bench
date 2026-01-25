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
  status: AlertStatus
}
