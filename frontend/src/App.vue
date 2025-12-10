<template>
  <Toaster />
  <nav class="max-w-full p-5 flex flex-col md:flex-row justify-between items-center">
    <div class="align-middle text-xl flex items-center gap-2 md:gap-4">
       <RouterLink to="/" class="text-xl"> 🧠 Bisca Game </RouterLink>

      <div v-if="authStore.currentUser" class="flex items-center gap-1">
        <UserAvatar 
          :user="authStore.currentUser" 
          class="h-6 w-6 md:h-8 md:w-8 border border-slate-200 dark:border-gray-700 shrink-0"
        />
        <span class="hidden md:inline text-xs font-bold md:text-sm">
          {{ authStore.currentUser?.name }}
        </span>
      </div>

        <RouterLink to="/purchase" v-if="authStore.currentUser">
        <span class="text-xs font-bold">
          {{ authStore.currentUser?.coins_balance }} 🪙
        </span>
        </RouterLink>
    </div>

    <NavigationMenu>
      <NavigationMenuList class="flex flex-col md:flex-row justify-around gap-2 md:gap-20 w-full md:w-auto">
        <button
  @click="isDark = !isDark"
  :aria-pressed="isDark"
  class="mt-2 md:mt-0 ml-0 md:ml-4 p-2 rounded-md hover:bg-[var(--muted)] focus:outline-none"
  title="Toggle dark mode"
>
  <template v-if="isDark">
    <!-- ícone de sol para indicar sair do dark -->
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z"/>
    </svg>
  </template>
  <template v-else>
    <!-- ícone de lua para indicar entrar no dark -->
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  </template>
</button>

        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/about">About</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem v-if="authStore.isLoggedIn">
          <NavigationMenuLink>
            <RouterLink to="/shop">Shop</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/leaderboards">Leaderboards</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem v-if="!authStore.isLoggedIn">
          <NavigationMenuLink>
            <RouterLink to="/login">Login</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem v-if="!authStore.isLoggedIn">
          <NavigationMenuLink>
            <RouterLink to="/register">Register</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem v-else>
          <NavigationMenuTrigger>Account</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <RouterLink
                  v-if="authStore.currentUser?.id"
                  :to="{ name: 'profile', params: { id: authStore.currentUser.id } }"
                >
                  Profile
                </RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <RouterLink to="/themes">My Themes</RouterLink>
              </NavigationMenuLink>

              <NavigationMenuLink as-child>
                <a @click.prevent="logout" class="cursor-pointer">Logout</a>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </nav>

  <div>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue' // <--- 1. Importar onMounted e watch
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css' // Certifica-te que este CSS é necessário aqui ou no main.js
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useSocketStore } from '@/stores/socket' // <--- 2. Importar o Socket Store
import {ref } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'


const authStore = useAuthStore()
const socketStore = useSocketStore() // <--- 3. Iniciar o Store
const router = useRouter()
const THEME_KEY = 'theme'
// --- LÓGICA DE SOCKETS (NOVO) ---

// 1. Ativa os listeners globais (connect/disconnect) assim que a App monta
onMounted(() => {
  socketStore.handleConnection()
})

// 2. Observa o AuthStore. Assim que houver um currentUser (Login ou F5), avisa o servidor
watch(
  () => authStore.currentUser, // Observamos o currentUser
  (newUser) => {
    if (newUser) {
      console.log(`[App] User autenticado: ${newUser.name}. A conectar ao socket...`)
      socketStore.emitJoin(newUser)
    }
  },
  { immediate: true } // Executa logo se o user já tiver sido carregado pelo main.js
) 

// --- DARK MODE ---

const isDark = ref(
  localStorage.getItem(THEME_KEY) === 'dark' ||
  (localStorage.getItem(THEME_KEY) === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
)

// aplica a classe no root
const applyTheme = (v) => document.documentElement.classList.toggle('dark', !!v)

// aplica no mount
onMounted(() => {
  applyTheme(isDark.value)
})

// persiste sempre que muda
watch(isDark, (v) => {
  applyTheme(v)
  localStorage.setItem(THEME_KEY, v ? 'dark' : 'light')
})

// --- LÓGICA DE LOGOUT (ATUALIZADA) ---

const logout = async () => {
  // 3. Avisa o socket que vamos sair ANTES de limpar o token
  socketStore.emitLeave()

  try {
    await toast.promise(authStore.logout(), {
      loading: 'Calling API',
      success: () => {
        return 'Logout Successful'
      },
      error: (data) => `[API] Error logging out - ${data?.response?.data?.message}`,
    })
  } catch (e) {
    // Even on error, continue to redirect and clear UI
    console.warn('Logout flow encountered an error (redirecting anyway):', e)
  } finally {
    router.push('/')
  }
}
</script>

<style></style>
