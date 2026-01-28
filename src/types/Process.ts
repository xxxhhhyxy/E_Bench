import type { IAlert } from './Alert'

/** 工序记录 */
export interface IProcessLog {
  time: string
  action: string
  operator: string
}

/** * 单个工序（子任务）的状态
 */
export enum ProcessStage {
  NotStart = '待命', //工序仍未开始
  InProgress = '进行中', //工序进行中
  Blocked = '警告', //工序暂停，需要处理警告事件
  Done = '已完成', //工序完成
}
//订单的子任务/单个工序
export interface IProcess {
  P_Name: string //工序名称
  P_ID: string //工序ID（考虑承袭订单号之后衍生出独有命名标准）
  owner: string //责任人
  input: string //该工序需要的材料
  output: string //该工序的产出
  pre_start: string //计划开始时间
  pre_end: string //计划结束时间
  act_start: string //实际开始时间
  act_end: string //实际结束时间
  processStage: ProcessStage //工序的状态
  alerts?: IAlert[] // OrderTracker 关注的预警
  logs?: IProcessLog[] // 生产日志：记录“活是怎么干的” (用于查看详情弹窗)
}
