<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Gestão de Utilizadores</h1>
      <div class="flex items-center gap-3">
        <input 
          type="search"
          placeholder="Pesquisar utilizadores..."
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
        />
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilizador</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moedas</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jogos</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in mockUsers" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ user.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <img :src="user.avatar" alt="" class="w-8 h-8 rounded-full" />
                  <span class="font-medium">{{ user.nickname }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-semibold text-yellow-600 dark:text-yellow-400">{{ user.coins }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ user.gamesPlayed }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  user.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                  user.status === 'blocked' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                ]">
                  {{ user.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center gap-2">
                  <button 
                    @click="toggleBlock(user)"
                    :class="[
                      'px-3 py-1 rounded text-xs font-semibold',
                      user.status === 'blocked' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 hover:bg-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200'
                    ]"
                  >
                    {{ user.status === 'blocked' ? 'Desbloquear' : 'Bloquear' }}
                  </button>
                  <button 
                    @click="removeUser(user)"
                    class="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-xs font-semibold hover:bg-red-200"
                  >
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mockUsers = ref([
  { id: 1, nickname: 'BiscaMaster', email: 'bisca@example.com', avatar: '/placeholder.svg?height=32&width=32', coins: 450, gamesPlayed: 156, status: 'active' },
  { id: 2, nickname: 'CardKing', email: 'king@example.com', avatar: '/placeholder.svg?height=32&width=32', coins: 320, gamesPlayed: 143, status: 'active' },
  { id: 3, nickname: 'AcePro', email: 'ace@example.com', avatar: '/placeholder.svg?height=32&width=32', coins: 180, gamesPlayed: 132, status: 'active' },
  { id: 4, nickname: 'BadPlayer', email: 'bad@example.com', avatar: '/placeholder.svg?height=32&width=32', coins: 50, gamesPlayed: 12, status: 'blocked' },
  { id: 5, nickname: 'BiscaFan', email: 'fan@example.com', avatar: '/placeholder.svg?height=32&width=32', coins: 280, gamesPlayed: 98, status: 'active' },
])

function toggleBlock(user) {
  user.status = user.status === 'blocked' ? 'active' : 'blocked'
  alert(`Utilizador ${user.nickname} ${user.status === 'blocked' ? 'bloqueado' : 'desbloqueado'} (mock)`)
}

function removeUser(user) {
  if (confirm(`Tem certeza que deseja remover ${user.nickname}?`)) {
    alert(`Utilizador ${user.nickname} removido (mock)`)
  }
}
</script>
