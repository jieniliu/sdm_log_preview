import { createRouter, createWebHistory } from 'vue-router'
import LogDataView from '../views/LogDataView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: LogDataView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
