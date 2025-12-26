import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

import AboutPage from '@/pages/about/AboutPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import SinglePlayerGamePage from '@/pages/game/SinglePlayerGamePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import RegisterPage from '@/pages/register/RegisterPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import HistoryPage from '@/pages/history/HistoryPage.vue'
import ThemesListPage from '@/pages/themes/ThemesListPage.vue'
import ThemeEditorPage from '@/pages/themes/ThemeEditorPage.vue'
import PurchasePage from '@/pages/purchase/PurchasePage.vue'
import ShopPage from '@/pages/shop/ShopPage.vue'
import LeaderboardPage from '@/pages/leaderboard/LeaderboardPage.vue'
import { useAuthStore } from '@/stores/auth'
import Lobby from '@/pages/game/Lobby.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/leaderboards',
      name: 'leaderboards',
      component: LeaderboardPage,
    },
    {
      path: '/games',
      children: [
        {
          path: 'singleplayer',
          name: 'singleplayer',
          component: SinglePlayerGamePage,
        },
      ],
    },
    {
      path: '/lobby',
      name: 'Lobby',
      component: Lobby,
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },

    // --- ALTERAÇÃO: Rota de Perfil Genérica (Redirecionamento) ---
    {
      path: '/profile',
      name: 'profile-redirect',
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        if (authStore.user?.id) {
          // Se estiver logado, manda para o perfil dele com ID explícito
          next({ name: 'profile', params: { id: authStore.user.id } })
        } else {
          // Se não estiver logado, manda fazer login
          next({ name: 'login' })
        }
      },
    },

    // --- ALTERAÇÃO: Rota de Perfil Pública (com ID) ---
    {
      path: '/profile/:id',
      name: 'profile',
      component: ProfilePage,
      // Nota: Removemos o meta: { requiresAuth: true } para ser público
    },

    // --- Rota de Histórico ---
    {
      path: '/history/:id',
      name: 'history',
      component: HistoryPage,
    },

    {
      path: '/themes',
      name: 'themes',
      component: ThemesListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/themes/create',
      name: 'themes-create',
      component: ThemeEditorPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/themes/edit/:id',
      name: 'themes-edit',
      component: ThemeEditorPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/purchase',
      name: 'purchase',
      component: PurchasePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop',
      name: 'Shop',
      component: ShopPage,
      meta: { requiresAuth: true }, // Se usares proteção de rotas
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

// Async guard: if a route needs auth, try to restore the user from token before redirecting.
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const SESSION_TOKEN_KEY = 'apiToken'
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY)

  if (!authStore.currentUser && token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try {
      await authStore.getUser()
    } catch(error) {
      console.error('Token inválido, a limpar sessão...', error)
      sessionStorage.removeItem(SESSION_TOKEN_KEY)
      delete axios.defaults.headers.common['Authorization']
    }
  }

  if (to.meta.requiresAdmin){
      if (!authStore.isAdmin) {
        return authStore.isLoggedIn ? next('/') : next({ name: 'login' })
      }
  }

  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      return next({ name: 'login' })
    }
  }

  // route doesn't require auth or admin
  return next()
})

export default router
