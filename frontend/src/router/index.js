import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

import AboutPage from '@/pages/about/AboutPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import Game from '@/pages/game/Game.vue'
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
          component: Game,
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


    {
      path: '/profile',
      name: 'profile-redirect',
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        if (authStore.user?.id) {

          next({ name: 'profile', params: { id: authStore.user.id } })
        } else {

          next({ name: 'login' })
        }
      },
    },


    // --- ALTERAÇÃO: Rota de Perfil (acesso restringido: owner ou admin) ---
    {
      path: '/profile/:id',
      name: 'profile',
      component: ProfilePage,


      beforeEnter: async (to, from, next) => {
        const authStore = useAuthStore()
        const requestedId = String(to.params.id)

        // If the current user is already known and is admin -> allow
        if (authStore.isAdmin) {
          return next()
        }

        // If already logged in and is the owner of the profile -> allow
        if (
          authStore.isLoggedIn &&
          authStore.currentUser &&
          String(authStore.currentUser.id) === requestedId
        ) {
          return next()
        }

        // Try to restore user from token in sessionStorage (if any)
        const SESSION_TOKEN_KEY = 'apiToken'
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
        if (token) {
          // ensure axios has header and try to fetch the user
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          try {
            await authStore.getUser()
            // after fetching user, re-evaluate permissions
            if (authStore.isAdmin) return next()
            if (String(authStore.currentUser?.id) === requestedId) return next()
            // not admin and not owner -> redirect to home
            return next({ name: 'home' })
          } catch (err) {
            // token invalid/expired -> clean and redirect to login
            sessionStorage.removeItem(SESSION_TOKEN_KEY)
            delete axios.defaults.headers.common['Authorization']
            return next({ name: 'login' })
          }
        }

        // No token and not owner/admin -> require login
        return next({ name: 'login' })
      },



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
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/pages/purchase/UserTransactionsPage.vue'),
    meta: { requiresAuth: true }
  },
    {
      path: '/shop',
      name: 'Shop',
      component: ShopPage,
      meta: { requiresAuth: true }, // Se usares proteção de rotas
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/pages/admin/MainPage.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/admin/UsersListPage.vue'),
        },
        {
          path: 'users/:id',
          name: 'user-details',
          component: () => import('@/pages/admin/UserDetails.vue'),
          props: true, // Isto permite que o :id seja passado como prop para o componente
        },
      ],
    },
    // user-details route moved under '/admin' as a child of MainPage
  ],
})

// Async guard: if a route needs auth, try to restore the user from token before redirecting.
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    // If already logged in, allow
    if (authStore.isLoggedIn) {
      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        return next({ name: 'home' })
      }
      return next()
    }

    // If not logged in but there's a token in sessionStorage, set axios header and try to fetch user
    const SESSION_TOKEN_KEY = 'apiToken'
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      try {
        await authStore.getUser()
        // success — allow navigation
        return next()
      } catch {
        // token invalid/expired -> clear sessionStorage and axios header and redirect to login
        sessionStorage.removeItem(SESSION_TOKEN_KEY)
        delete axios.defaults.headers.common['Authorization']
        return next({ name: 'login' })
      }
    }

    // no token -> go to login
    return next({ name: 'login' })
  }

  // route doesn't require auth
  return next()
})

export default router
