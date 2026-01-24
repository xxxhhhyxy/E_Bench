import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type IMachine, MachineStatus, type IMachineLog } from '@/types/Machine'
import { type IOrder, type ISubTask } from '@/types/order'

export const useMachineStore = defineStore('machine', () => {
  // --- 状态 (State) ---
  const machines = ref<IMachine[]>([
    {
      id: 'M-CNC-01',
      name: 'CNC铣床 #1',
      category: '机加工',
      status: MachineStatus.Idle,
      taskHistory: [],
    },
    {
      id: 'M-CNC-02',
      name: 'CNC铣床 #2',
      category: '机加工',
      status: MachineStatus.Idle,
      taskHistory: [],
    },
    {
      id: 'M-LSR-01',
      name: '激光切割机',
      category: '钣金',
      status: MachineStatus.Idle,
      taskHistory: [],
    },
    {
      id: 'M-ASS-01',
      name: '人工装配台',
      category: '组装',
      status: MachineStatus.Idle,
      taskHistory: [],
    },
  ])

  // --- 计算属性 (Getters) ---
  const allMachines = computed(() => machines.value)

  // 方便 Reviewer.vue 选择机器时过滤
  const availableMachines = computed(() =>
    machines.value.filter((m) => m.status === MachineStatus.Idle),
  )

  // --- 核心动作 (Actions) ---

  /**
   * 指派任务：使机器 Busy 并关联整个 Order
   */
  const assignWork = (
    machineId: string,
    order: IOrder,
    subTask: ISubTask,
    operatorName: string,
  ) => {
    const machine = machines.value.find((m) => m.id === machineId)
    if (!machine) return

    // 1. 更新机器即时状态
    machine.status = MachineStatus.Busy
    machine.currentOrder = order // 这里的 order 是 IOrder 类型
    machine.currentSubTask = subTask

    // 2. 写入历史日志 (Deep Access)
    const newLog: IMachineLog = {
      timestamp: new Date().toLocaleString(),
      action: '任务分派',
      // 这里存储的是快照，防止后续原订单修改影响历史记录
      orderContext: JSON.parse(JSON.stringify(order)),
      subTaskContext: JSON.parse(JSON.stringify(subTask)),
      operator: operatorName,
    }
    machine.taskHistory.unshift(newLog)
  }

  /**
   * 完工/释放机器
   */
  const completeWork = (machineId: string) => {
    const machine = machines.value.find((m) => m.id === machineId)
    if (machine) {
      machine.status = MachineStatus.Idle
      machine.currentOrder = undefined
      machine.currentSubTask = undefined
    }
  }

  /**
   * 报修/维护
   */
  const setMaintenance = (machineId: string) => {
    const machine = machines.value.find((m) => m.id === machineId)
    if (machine) machine.status = MachineStatus.OnRepair
  }

  return {
    machines,
    allMachines,
    availableMachines,
    assignWork,
    completeWork,
    setMaintenance,
  }
})
