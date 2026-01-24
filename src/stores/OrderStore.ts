import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type IOrder, AuditStatus } from '@/types/order'

export const useOrderStore = defineStore('order', () => {
  // 1. 三个独立的订单数组状态
  const pendingOrders = ref<IOrder[]>([]) // 待审核
  const reviewedOrders = ref<IOrder[]>([]) // 已通过
  const rejectedOrders = ref<IOrder[]>([]) // 已拒绝

  /**
   * 添加新订单（默认进入待审核）
   */
  const addOrder = (newOrder: IOrder) => {
    pendingOrders.value.unshift(newOrder)
  }

  /**
   * 审核通过操作
   * 从 pendingOrders 移动到 reviewedOrders
   */
  const approveOrder = (orderId: string) => {
    const index = pendingOrders.value.findIndex((o) => o.orderId === orderId)

    if (index !== -1) {
      // splice 返回的是数组，解构出第一个元素
      const [order] = pendingOrders.value.splice(index, 1)

      // 【修复关键】：判断 order 是否存在，消除 possibly undefined 报错
      if (order) {
        // 更新状态和日志
        order.auditStatus = AuditStatus.Approved
        order.auditLogs.push({
          time: new Date().toLocaleString().replace(/\//g, '-'),
          operator: '审核员',
          action: '审核通过',
          comment: '符合生产要求',
        })

        // 移入已通过数组
        reviewedOrders.value.unshift(order)
      }
    }
  }

  /**
   * 审核拒绝操作
   * 从 pendingOrders 移动到 rejectedOrders
   */
  const rejectOrder = (orderId: string, reason: string = '不符合要求') => {
    const index = pendingOrders.value.findIndex((o) => o.orderId === orderId)

    if (index !== -1) {
      const [order] = pendingOrders.value.splice(index, 1)

      // 【修复关键】：判断 order 是否存在，消除 possibly undefined 报错
      if (order) {
        // 更新状态和日志
        order.auditStatus = AuditStatus.Rejected
        order.auditLogs.push({
          time: new Date().toLocaleString().replace(/\//g, '-'),
          operator: '审核员',
          action: '驳回',
          comment: reason,
        })

        // 移入已拒绝数组
        rejectedOrders.value.unshift(order)
      }
    }
  }

  return {
    pendingOrders,
    reviewedOrders,
    rejectedOrders,
    addOrder,
    approveOrder,
    rejectOrder,
  }
})
