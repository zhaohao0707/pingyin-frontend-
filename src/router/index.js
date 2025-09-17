import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Menu from '../views/Menu.vue'
import WordPractice from '../views/WordPractice.vue'
import ArticlePractice from '../views/ArticlePractice.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/menu',
    name: 'Menu',
    component: Menu,
    meta: { requiresAuth: true }
  },
  {
    path: '/word-practice',
    name: 'WordPractice',
    component: WordPractice,
    meta: { requiresAuth: true }
  },
  {
    path: '/article-practice',
    name: 'ArticlePractice',
    component: ArticlePractice,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login')
    } else if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (!isAdmin) {
        next('/menu') // 非管理员重定向到菜单
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    if (to.path === '/login' && token) {
      next('/menu')
    } else {
      next()
    }
  }
})

export default router
