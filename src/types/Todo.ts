export interface ITodo {
  id: number;                // 内部唯一标识 (Date.now())
  title:string;//短标题
  orderId: string;           // 订单ID：精确定位到具体的客户订单
  taskID: string;            // 工序ID：精确定位到生产环节（如：CNC加工、激光切削）
  content: string;           // 任务描述：具体要处理的问题
  createdAt: string          // 创建时间
  type:todoType
  priority:Priority
  ststus:Status
  assignee_user_id:string//负责人
  due_at:string//截止时间
}

export enum Priority {
  Urgent = '特急', // 特急
  High = '高', // 高
  Normal = '中', // 普通
  Low = '低', // 低
}
enum Status{
  open,
  in_progress,
  Done,
  Cancelled
}
enum todoType{
  material_followup,
  outsource_followup,
  schedule_confirm,
  production_update,
  customer_reply,
  qc_issue
}