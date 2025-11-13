<template>
  <nav
    class="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b"
  >
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-2 text-primary font-bold text-xl">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            />
          </svg>
          <span>Bisca Platform</span>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.to"
            class="nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{
              'text-primary bg-primary/10': $route.path === item.to,
              'text-muted-foreground hover:text-foreground hover:bg-accent':
                $route.path !== item.to,
            }"
          >
            {{ item.name }}
          </router-link>
        </div>

        <!-- Theme Toggle & Mobile Menu -->
        <div class="flex items-center space-x-2">
          <!-- Theme Toggle Button -->
          <button
            @click="themeStore.toggleTheme()"
            class="btn-ghost btn-sm"
            :title="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          >
            <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </button>

          <!-- Mobile menu button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden btn-ghost btn-sm"
            :aria-expanded="mobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-show="mobileMenuOpen" class="md:hidden border-t border-border/40 py-4 space-y-2">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.to"
          class="block px-3 py-2 rounded-md text-base font-medium transition-colors"
          :class="{
            'text-primary bg-primary/10': $route.path === item.to,
            'text-muted-foreground hover:text-foreground hover:bg-accent': $route.path !== item.to,
          }"
          @click="mobileMenuOpen = false"
        >
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useThemeStore } from '../../stores/theme'

const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

const isDark = computed(() => themeStore.isDark)

const navigationItems = [
  { name: 'Início', to: '/' },
  { name: 'Sobre', to: '/about' },
  { name: 'Jogar', to: '/play' },
  { name: 'Classificações', to: '/leaderboard' },
]

// Close mobile menu when route changes
import { useRouter } from 'vue-router'
const router = useRouter()
router.afterEach(() => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
.nav-link {
  @apply transition-all duration-200 ease-in-out;
}

.nav-link:hover {
  @apply transform scale-105;
}

/* Backdrop blur fallback */
@supports not (backdrop-filter: blur()) {
  nav {
    @apply bg-card;
  }
}
</style>
