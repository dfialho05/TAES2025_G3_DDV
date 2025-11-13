<template>
  <div class="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Criar Conta</h1>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input 
            v-model="formData.email"
            type="email" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Nickname</label>
          <input 
            v-model="formData.nickname"
            type="text" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Nome</label>
          <input 
            v-model="formData.name"
            type="text" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input 
            v-model="formData.password"
            type="password" 
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Avatar URL (opcional)</label>
          <input 
            v-model="formData.avatar"
            type="text" 
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700"
          />
        </div>
        
        <button 
          type="submit"
          class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Registar
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Já tem conta? 
        <router-link to="/login" class="text-primary-600 hover:underline">
          Fazer login
        </router-link>
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

const formData = ref({
  email: '',
  nickname: '',
  name: '',
  password: '',
  avatar: ''
})

function handleRegister() {
  authStore.register(formData.value)
  router.push('/')
}
</script>
