<template>
  <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center gap-2">
          <svg class="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
          <span class="text-xl font-bold text-gray-900 dark:text-white">Bisca Platform</span>
        </router-link>
        
        <div class="hidden md:flex items-center gap-6">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            active-class="text-primary-600 dark:text-primary-400 font-semibold"
          >
            {{ item.label }}
          </router-link>
        </div>
        
        <div class="flex items-center gap-3">
          <button @click="themeStore.toggleTheme()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg v-if="!themeStore.isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
            <router-link 
              to="/coins"
              class="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-semibold"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
              </svg>
              {{ authStore.user.coins }}
            </router-link>
            
            <router-link 
              to="/profile"
              class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <img :src="authStore.user.avatar" alt="Avatar" class="w-7 h-7 rounded-full" />
              <span class="text-sm font-medium">{{ authStore.user.nickname }}</span>
            </router-link>
          </div>
          
          <div v-else class="flex items-center gap-2">
            <router-link 
              to="/login"
              class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Login
            </router-link>
            <router-link 
              to="/register"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Registar
            </router-link>
          </div>
          
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-col gap-2">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

const navItems = computed(() => {
  const items = [
    { path: '/leaderboards', label: 'Classificações' },
    { path: '/statistics', label: 'Estatísticas' },
  ]
  
  if (authStore.isAuthenticated) {
    items.unshift(
      { path: '/play', label: 'Jogar' },
      { path: '/history', label: 'Histórico' }
    )
  }
  
  if (authStore.isAdmin) {
    items.push({ path: '/admin', label: 'Admin' })
  }
  
  return items
})
</script>
