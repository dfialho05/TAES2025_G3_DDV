<template>
  <Toaster />
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink to="/"> 🧠 Bisca Game </RouterLink>
      <span class="text-xs" style="font-weight: bold;" v-if="authStore.currentUser">
        &nbsp;&nbsp;&nbsp;
        {{ authStore.currentUser?.name }}
      </span>

      <span class="text-xs" style="font-weight: bold;" v-if="authStore.currentUser" >
        &nbsp;&nbsp;&nbsp;
        <label for="balance">Balance: </label>
        {{ authStore.currentUser?.coins_balance }} Coins

      </span>

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
                <RouterLink to="/">MultiPlayer</RouterLink>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/purchase">Purchase</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/about">About</RouterLink>
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
                <RouterLink to="/profile">Profile</RouterLink>
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
import 'vue-sonner/style.css'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
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
