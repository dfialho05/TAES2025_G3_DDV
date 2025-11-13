<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Classificações</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Top 3 Podium -->
      <div v-for="(player, index) in topThree" :key="player.rank" class="order-2 lg:order-1" :class="{ 'lg:order-2': index === 0 }">
        <div :class="[
          'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 text-center',
          index === 0 ? 'border-yellow-400 dark:border-yellow-600 lg:-mt-4' :
          index === 1 ? 'border-gray-400 dark:border-gray-600' :
          'border-orange-400 dark:border-orange-600'
        ]">
          <div :class="[
            'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold',
            index === 0 ? 'bg-yellow-400 text-yellow-900' :
            index === 1 ? 'bg-gray-400 text-gray-900' :
            'bg-orange-400 text-orange-900'
          ]">
            {{ player.rank }}
          </div>
          <h3 class="font-bold text-lg mb-1">{{ player.nickname }}</h3>
          <p class="text-2xl font-bold text-primary-600 mb-3">{{ player.points }}</p>
          <div class="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p class="font-bold text-gray-900 dark:text-white">{{ player.wins }}</p>
              <p class="text-xs">Vitórias</p>
            </div>
            <div>
              <p class="font-bold text-gray-900 dark:text-white">{{ player.capotes }}</p>
              <p class="text-xs">Capotes</p>
            </div>
            <div>
              <p class="font-bold text-gray-900 dark:text-white">{{ player.bandeiras }}</p>
              <p class="text-xs">Bandeiras</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Full Leaderboard -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold">Classificação Global</h2>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posição</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jogador</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vitórias</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capotes</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bandeiras</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pontos</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="player in gamesStore.leaderboard"
              :key="player.rank"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20': player.nickname === authStore.user?.nickname }"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-bold text-lg">{{ player.rank }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ player.nickname }}</span>
                  <span v-if="player.nickname === authStore.user?.nickname" class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded">
                    Você
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ player.wins }}</td>
              <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ player.capotes }}</td>
              <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ player.bandeiras }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-bold text-primary-600 dark:text-primary-400">{{ player.points }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- My Stats -->
    <div v-if="authStore.isAuthenticated" class="mt-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl shadow-sm p-6 text-white">
      <h2 class="text-xl font-bold mb-4">Minhas Estatísticas</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-3xl font-bold">{{ authStore.user.stats.wins }}</p>
          <p class="opacity-90">Vitórias</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ authStore.user.stats.losses }}</p>
          <p class="opacity-90">Derrotas</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ authStore.user.stats.capotes }}</p>
          <p class="opacity-90">Capotes</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ authStore.user.stats.bandeiras }}</p>
          <p class="opacity-90">Bandeiras</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGamesStore } from '../store/games'
import { useAuthStore } from '../store/auth'

const gamesStore = useGamesStore()
const authStore = useAuthStore()

const topThree = computed(() => gamesStore.leaderboard.slice(0, 3))
</script>
