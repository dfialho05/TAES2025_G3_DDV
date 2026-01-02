<template>
  <div
    class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
    style="background-color: var(--background); color: var(--foreground)"
  >
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2
          class="mt-6 text-center text-3xl font-bold tracking-tight"
          style="color: var(--foreground)"
        >
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm" style="color: var(--muted-foreground)">
          Enter your credentials to access your account
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">
          <div>
            <label
              for="email"
              class="block text-sm font-medium mb-1"
              style="color: var(--foreground)"
            >
              Email address
            </label>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium mb-1"
              style="color: var(--foreground)"
            >
              Password
            </label>
            <Input
              id="password"
              v-model="formData.password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/80"
          >
            Sign in
          </Button>
        </div>

        <div class="text-center text-sm">
          <span class="text-gray-600">Don't have an account? </span>
          <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: 'a1@mail.pt',
  password: '123',
})

const handleSubmit = async () => {
  try {
    const result = await authStore.login(formData.value)

    // Se chegou aqui, o login foi bem-sucedido
    toast.success(`Login Sucessfull - ${result?.name}`)
    router.push('/')
  } catch (error) {
    // Se houver erro, mostra a mensagem e fica na página
    const errorMsg = error?.response?.data?.message || error?.message || 'Login failed'
    toast.error(`[API] Error logging in - ${errorMsg}`)
    console.error('Login failed:', error)
  }
}
</script>
