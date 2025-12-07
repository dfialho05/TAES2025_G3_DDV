<template>
  <Toaster />
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink to="/"> 🧠 Bisca Game </RouterLink>
      <span class="text-xs" style="font-weight: bold" v-if="authStore.currentUser">
        &nbsp;&nbsp;&nbsp;
        {{ authStore.currentUser?.name }}
      </span>
      <RouterLink to="/purchase">
        <span class="text-xs" style="font-weight: bold" v-if="authStore.currentUser">
          &nbsp;&nbsp;&nbsp;
          {{ authStore.currentUser?.coins_balance }} 🪙
        </span>
      </RouterLink>
    </div>

    <NavigationMenu>
      <NavigationMenuList class="justify-around gap-20">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Games</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <RouterLink to="/games/singleplayer">SinglePlayer</RouterLink>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <RouterLink to="/lobby">Lobbies</RouterLink>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/about">About</RouterLink>
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

const authStore = useAuthStore()
const socketStore = useSocketStore() // <--- 3. Iniciar o Store
const router = useRouter()

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
