import { createRouter, createWebHistory } from 'vue-router'
import OrderTracker from '../views/OrderTracker.vue'
import DataUploader from '@/views/DataUploader.vue'
import ReviewInbox from '@/views/ReviewInbox.vue'
import DispatchCenter from '@/views/DispatchCenter.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/order-tracker', // 浏览器访问的地址
      name: 'order-tracker',
      component: OrderTracker,
    },
    {
      path: '/data-uploader', // 浏览器访问的地址
      name: 'data-uploader',
      component: DataUploader,
    },
    {
      path: '/Review-Inbox', // 浏览器访问的地址
      name: 'review-inbox',
      component: ReviewInbox,
    },
    {
      path: '/Dispatch-Center', // 浏览器访问的地址
      name: 'dispatch-center',
      component: DispatchCenter,
    },
  ],
})

export default router
