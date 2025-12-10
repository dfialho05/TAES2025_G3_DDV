<template>
  
  <div class="flex min-h-screen items-center justify-center 
              bg-gray-50 dark:bg-gray-900 
              px-4 py-12 sm:px-6 lg:px-8">

    <div class="w-full max-w-md space-y-8">
      <div>
        
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight 
                   text-gray-900 dark:text-white">
          Criar Conta
        </h2>

        
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Preencha os dados para criar a sua conta
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">

          
          <div>
            
            <label for="email" class="block text-sm font-medium 
                                     text-gray-700 dark:text-gray-300 mb-1">
              Email
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
            <label for="password" class="block text-sm font-medium 
                                         text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>

            <Input
              id="password"
              v-model="formData.password"
              type="password"
              autocomplete="new-password"
              required
              placeholder="••••••••"
            />
          </div>

          <div>
            <label for="nickname" class="block text-sm font-medium 
                                         text-gray-700 dark:text-gray-300 mb-1">
              Nickname
            </label>
            <Input
              id="nickname"
              v-model="formData.nickname"
              type="text"
              required
              placeholder="O seu nickname"
            />
          </div>

          <div>
            <label for="name" class="block text-sm font-medium 
                                     text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <Input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label for="avatar" class="block text-sm font-medium 
                                       text-gray-700 dark:text-gray-300 mb-1">
              Avatar URL (opcional)
            </label>
            <Input
              id="avatar"
              v-model="formData.avatar"
              type="text"
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>
        </div>

        
        <div>
          <Button type="submit" class="w-full">
            Registar e Entrar
          </Button>
        </div>

        
        <div class="text-center text-sm">
          <span class="text-gray-600 dark:text-gray-300">Já tem conta? </span>

          <router-link 
            to="/login" 
            class="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Fazer login
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
  email: 'test@mail.pt',
  password: '123',
  name: 'Test User',
  nickname: 'TestUser',
  avatar: '',
})

const handleSubmit = async () => {
  const payload = {
    name: formData.value.name,
    email: formData.value.email,
    password: formData.value.password,
  }
  if (formData.value.nickname) payload.nickname = formData.value.nickname
  if (formData.value.avatar) payload.photo_avatar_filename = formData.value.avatar

  // Await the toast.promise so we only call register once and wait for the result before navigating.
  await toast.promise(authStore.register(payload), {
    loading: 'Calling API',
    success: (res) => {
      // Try to extract the user name from the axios response or from the store
      const name = res?.data?.user?.name ?? authStore.currentUser?.name ?? ''
      return `Registration Successful - ${name}`
    },
    error: (err) => {
      const msg =
        err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? 'Unknown error'
      return `[API] Error registering - ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`
    },
  })

  router.push('/')
}
</script>
