import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/dashboard',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'ocr-statistics',
          name: 'ocr-statistics',
          component: () => import('../views/OcrStatisticsView.vue'),
        },
        {
          path: 'models',
          name: 'models',
          component: () => import('../views/ModelManagementView.vue'),
        },
        {
          path: 'history',
          name: 'history',
          component: () => import('../views/HistoryRecordsView.vue'),
        },
        {
          path: 'test',
          name: 'test',
          component: () => import('../views/TestToolsView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UserManagementView.vue'),
        },
        {
          path: '',
          redirect: '/dashboard/models',
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
