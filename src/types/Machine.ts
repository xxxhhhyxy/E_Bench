// src/types/Machine.ts

import type { IOrder } from './Order'
import type { IProcess } from './Process'

/**
 * 机器状态
 */
export enum MachineStatus {
  Idle = '空闲',
  Busy = '忙碌',
  Damage = '损坏',
  OnRepair = '维修中',
}

/**
 * 机器运行日志：记录每一次加工任务的完整快照
 */
export interface IMachineLog {
  timestamp: string // 记录产生时间
  action: string // 动作：如 "任务开始", "任务暂停", "完工提交"

  // 核心引用： access 整个订单和具体子任务
  orderContext: IOrder // 保存当时订单的快照或引用
  subTaskContext: IProcess // 具体的工序信息

  operator: string // 执行人
  note?: string // 机器异常说明或加工备注
}

/**
 * 核心接口：IMachine
 */
export interface IMachine {
  id: string // 机器编号 (如: CNC-01)
  name: string // 机器名称
  category: string // 机器分类 (如: 铣床, 磨床, 激光切割)
  status: MachineStatus

  // 当前作业上下文：直接 access 整个 Order
  // 当机器 Busy 时，我们可以通过 currentOrder 访问客户、截止日期、所有附件等
  currentOrder?: IOrder
  currentSubTask?: IProcess

  // 历史追溯：包含所有处理过的订单历史
  taskHistory: IMachineLog[]
}
