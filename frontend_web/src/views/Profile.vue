<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">Perfil</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Profile Card -->
      <div class="md:col-span-1">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex flex-col items-center">
            <img :src="authStore.user.avatar" alt="Avatar" class="w-24 h-24 rounded-full mb-4" />
            <h2 class="text-xl font-bold">{{ authStore.user.nickname }}</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-4">{{ authStore.user.email }}</p>

            <div class="w-full space-y-2">
              <button
                @click="showEditModal = true"
                class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Editar Perfil
              </button>
              <button
                @click="handleLogout"
                class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Sair
              </button>
              <router-link
                to="/delete-account"
                class="block w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-center"
              >
                Apagar Conta
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Card -->
      <div class="md:col-span-2">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-xl font-bold mb-6">Estatísticas</h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Jogos</p>
              <p class="text-2xl font-bold">{{ authStore.user.stats.gamesPlayed }}</p>
            </div>

            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Vitórias</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ authStore.user.stats.wins }}
              </p>
            </div>

            <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Derrotas</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ authStore.user.stats.losses }}
              </p>
            </div>

            <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Moedas</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ authStore.user.coins }}
              </p>
            </div>

            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Capotes</p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ authStore.user.stats.capotes }}
              </p>
            </div>

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Bandeiras</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ authStore.user.stats.bandeiras }}
              </p>
            </div>
          </div>

          <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxa de Vitória</p>
            <div class="flex items-end gap-2">
              <p class="text-3xl font-bold">{{ winRate }}%</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                ({{ authStore.user.stats.wins }}/{{ authStore.user.stats.gamesPlayed }} jogos)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal (Mock) -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click="showEditModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" @click.stop>
        <h3 class="text-xl font-bold mb-4">Editar Perfil</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Nickname</label>
            <input
              v-model="editData.nickname"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Nome</label>
            <input
              v-model="editData.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="saveProfile"
              class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Guardar
            </button>
            <button
              @click="showEditModal = false"
              class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/mocks/auth'

const router = useRouter()
const authStore = useAuthStore()
const showEditModal = ref(false)

const editData = ref({
  nickname: authStore.user.nickname,
  name: authStore.user.name,
})

const winRate = computed(() => {
  const total = authStore.user.stats.gamesPlayed
  if (total === 0) return 0
  return Math.round((authStore.user.stats.wins / total) * 100)
})

function handleLogout() {
  authStore.logout()
  router.push('/')
}

function saveProfile() {
  authStore.updateProfile(editData.value)
  showEditModal.value = false
}
</script>
