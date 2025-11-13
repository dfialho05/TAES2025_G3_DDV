<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Login</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input 
            v-model="email"
            type="email" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
            placeholder="seu@email.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input 
            v-model="password"
            type="password" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
            placeholder="••••••••"
          />
        </div>
        
        <button 
          type="submit"
          class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Entrar
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Não tem conta? 
        <router-link to="/register" class="text-primary-600 hover:underline">
          Registar aqui
        </router-link>
      </div>
      
      <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
        <p class="font-semibold mb-1">Demo:</p>
        <p>User: user@bisca.com</p>
        <p>Admin: admin@bisca.com</p>
        <p>Password: qualquer</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

function handleLogin() {
  authStore.login({ email: email.value, password: password.value })
  router.push('/')
}
</script>
