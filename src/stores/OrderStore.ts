import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type IOrder, AuditStatus } from '@/types/Order'

export const useOrderStore = defineStore('order', () => {
  // 1. 三个独立的订单数组状态
  const pendingOrders = ref<IOrder[]>([]) // 待审核
  const approvedOrders = ref<IOrder[]>([]) // 已通过
  const rejectedOrders = ref<IOrder[]>([]) // 已拒绝

  /**
   * 添加新订单（默认进入待审核）
   */
  const addOrder = (newOrder: IOrder) => {
    pendingOrders.value.unshift(newOrder)
  }

  /**
   * 删除订单
   * 从所有可能存在的状态池中移除该订单
   * @param orderId 订单唯一标识
   */
  const deleteOrder = (orderId: string) => {
    // 过滤待审核数组
    pendingOrders.value = pendingOrders.value.filter((o) => o.orderId !== orderId)
    // 过滤已通过数组
    approvedOrders.value = approvedOrders.value.filter((o) => o.orderId !== orderId)
    // 过滤已拒绝数组
    rejectedOrders.value = rejectedOrders.value.filter((o) => o.orderId !== orderId)

    console.log(`Store: 订单 ${orderId} 已从所有池中移除`)
  }

  /**
   * 审核通过操作
   * 从 pendingOrders 移动到 approvedOrders
   */
  const approveOrder = (orderId: string) => {
    const index = pendingOrders.value.findIndex((o) => o.orderId === orderId)

    if (index !== -1) {
      // splice 返回的是数组，解构出第一个元素
      const [order] = pendingOrders.value.splice(index, 1)

      // 【修复关键】：判断 order 是否存在
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
        approvedOrders.value.unshift(order)
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

      // 【修复关键】：判断 order 是否存在
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
    approvedOrders,
    rejectedOrders,
    addOrder,
    deleteOrder, // 导出删除方法
    approveOrder,
    rejectOrder,
  }
})
