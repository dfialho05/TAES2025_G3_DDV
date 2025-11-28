<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your credentials to access your account
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
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
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
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
          <Button type="submit" class="w-full"> Sign in </Button>
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
  toast.promise(authStore.login(formData.value), {
    loading: 'Calling API',
    success: (data) => {
      return `Login Sucessfull - ${data?.name}`
    },
    error: (data) => `[API] Error saving game - ${data?.response?.data?.message}`,
  })

  await authStore.login(formData.value)

  router.push('/')
}
</script>
