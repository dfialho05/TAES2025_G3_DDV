<template>
  <div class="min-h-screen flex flex-col">
    <div class="bg-primary-600 text-white px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 class="text-xl font-bold">Bisca Platform - Admin</h1>
      </div>
      <button @click="themeStore.toggleTheme()" class="p-2 hover:bg-primary-700 rounded-lg">
        <svg v-if="!themeStore.isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <div class="flex flex-1">
      <aside
        :class="[
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 flex-shrink-0 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full fixed lg:relative z-40 h-full',
        ]"
      >
        <nav class="p-4 space-y-2">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            active-class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </router-link>

          <router-link
            to="/"
            class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Voltar ao Site</span>
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()
const sidebarOpen = ref(false)

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'DashboardIcon' },
  { path: '/admin/users', label: 'Utilizadores', icon: 'UsersIcon' },
  { path: '/admin/transactions', label: 'Transações', icon: 'TransactionsIcon' },
  { path: '/admin/games', label: 'Jogos', icon: 'GamesIcon' },
  { path: '/admin/statistics', label: 'Estatísticas', icon: 'StatsIcon' },
]
</script>
