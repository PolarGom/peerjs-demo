import { createWebHashHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home')
  },
  {
    path: '/room',
    name: 'Room',
    component: () => import('@/views/Room')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})