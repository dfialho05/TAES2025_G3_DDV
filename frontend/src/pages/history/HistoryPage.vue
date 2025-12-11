<template>
  <div class="max-w-7xl mx-auto p-6">
    <div v-if="loadingUser" class="text-center py-20">
      <div
        class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
      ></div>
      <p class="text-lg text-gray-500 dark:text-gray-300 font-medium">A carregar histórico...</p>
    </div>

    <div v-else-if="displayedUser" class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700"
      >
        <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div class="shrink-0 relative group">
            <UserAvatar :user="displayedUser" size="lg" class="border-4 border-white shadow-lg" />
          </div>

          <div class="flex-1 text-center md:text-left space-y-2">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
                Histórico de {{ displayedUser.name }}
              </h1>
              <p v-if="displayedUser.nickname" class="text-lg text-primary font-semibold">
                @{{ displayedUser.nickname }}
              </p>
            </div>
            <p class="text-gray-500 dark:text-gray-300">Histórico completo de jogos e partidas</p>
          </div>

          <!-- Back to Profile Button -->
          <div class="shrink-0">
            <button
              @click="goBackToProfile"
              class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Voltar ao Perfil
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div class="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M2 20h20" />
              <path d="m16 8-8 8" />
              <path d="m10.5 5.5 8 8" />
              <path d="M4 14.5l8-8" />
            </svg>
          </div>
          <div>
            <p
              class="text-xs text-slate-500 dark:text-gray-400 font-medium uppercase tracking-wider"
            >
              Total Partidas
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ allMatches.length }}
            </p>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div
            class="p-3 bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-400 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <div>
            <p
              class="text-xs text-slate-500 dark:text-gray-400 font-medium uppercase tracking-wider"
            >
              Total Jogos
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-gray-100">
              {{ allGames.length }}
            </p>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div
            class="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </div>
          <div>
            <p
              class="text-xs text-slate-500 dark:text-gray-400 font-medium uppercase tracking-wider"
            >
              Vitórias
            </p>
            <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ totalWins }}
            </p>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
        >
          <div
            class="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-400 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
          </div>
          <div>
            <p
              class="text-xs text-slate-500 dark:text-gray-400 font-medium uppercase tracking-wider"
            >
              Taxa Vitórias
            </p>
            <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ winRate }}%</p>
          </div>
        </div>
      </div>

      <!-- History Component -->
      <GameMatchHistoryList
        :games="allGames"
        :matches="allMatches"
        :loading="loading"
        :displayed-user="displayedUser"
        @load-more="loadMore"
      />

      <!-- Load More Button -->
      <div v-if="hasMoreData" class="text-center">
        <button
          @click="loadMore"
          :disabled="loading"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <div
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            ></div>
            A carregar mais...
          </span>
          <span v-else>Carregar Mais</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-20">
      <div class="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mx-auto text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Erro ao carregar histórico
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        Não foi possível carregar o histórico do utilizador.
      </p>
      <button
        @click="loadHistoryData"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAPIStore } from '@/stores/api'
import { useMatchesStore } from '@/stores/matches'
import { useGamesStore } from '@/stores/games'
import UserAvatar from '@/components/UserAvatar.vue'
import GameMatchHistoryList from '@/components/GameMatchHistoryList.vue'

const route = useRoute()
const router = useRouter()
const apiStore = useAPIStore()
const matchesStore = useMatchesStore()
const gamesStore = useGamesStore()

const displayedUser = ref(null)
const loadingUser = ref(true)
const loading = ref(false)
const allGames = ref([])
const allMatches = ref([])
const currentPage = ref(1)
const hasMoreData = ref(true)
const pageSize = 50

const totalWins = computed(() => {
  const gameWins = allGames.value.filter((game) => game.is_winner === true).length
  const matchWins = allMatches.value.filter((match) => {
    if (!match.games || match.games.length === 0) return false

    let userWins = 0
    let opponentWins = 0

    match.games.forEach((game) => {
      if (game.is_winner === true) userWins++
      else if (game.is_winner === false) opponentWins++
    })

    return userWins > opponentWins
  }).length

  return gameWins + matchWins
})

const totalItems = computed(() => {
  return allGames.value.length + allMatches.value.length
})

const winRate = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((totalWins.value / totalItems.value) * 100)
})

const loadHistoryData = async () => {
  try {
    loading.value = true

    // Load user data if not already loaded
    if (!displayedUser.value) {
      const userId = route.params.id
      if (userId) {
        displayedUser.value = await apiStore.fetchUser(userId)
      }
    }

    // Load all games and matches for this user
    await Promise.all([loadAllGames(), loadAllMatches()])
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)
  } finally {
    loading.value = false
    loadingUser.value = false
  }
}

const loadAllGames = async () => {
  try {
    const userId = route.params.id
    const response = await apiStore.fetchAllUserGames(userId, {
      page: currentPage.value,
      limit: pageSize,
    })

    if (currentPage.value === 1) {
      allGames.value = response.games || []
    } else {
      allGames.value = [...allGames.value, ...(response.games || [])]
    }

    hasMoreData.value = (response.games || []).length === pageSize
  } catch (error) {
    console.error('Erro ao carregar jogos:', error)
    // Fallback to recent games if full API doesn't exist
    try {
      await gamesStore.fetchRecentGames(route.params.id)
      if (currentPage.value === 1) {
        allGames.value = gamesStore.recentGames || []
      }
    } catch (fallbackError) {
      console.error('Erro ao carregar jogos recentes:', fallbackError)
    }
  }
}

const loadAllMatches = async () => {
  try {
    const userId = route.params.id
    const response = await apiStore.fetchAllUserMatches(userId, {
      page: currentPage.value,
      limit: pageSize,
    })

    if (currentPage.value === 1) {
      allMatches.value = response.matches || []
    } else {
      allMatches.value = [...allMatches.value, ...(response.matches || [])]
    }

    hasMoreData.value = hasMoreData.value && (response.matches || []).length === pageSize
  } catch (error) {
    console.error('Erro ao carregar partidas:', error)
    // Fallback to recent matches if full API doesn't exist
    try {
      await matchesStore.fetchRecentMatches(route.params.id)
      if (currentPage.value === 1) {
        allMatches.value = matchesStore.recentMatches || []
      }
    } catch (fallbackError) {
      console.error('Erro ao carregar partidas recentes:', fallbackError)
    }
  }
}

const loadMore = async () => {
  if (!hasMoreData.value || loading.value) return

  currentPage.value++
  await loadHistoryData()
}

const goBackToProfile = () => {
  router.push({ name: 'profile', params: { id: route.params.id } })
}

onMounted(() => {
  loadHistoryData()
})
</script>
