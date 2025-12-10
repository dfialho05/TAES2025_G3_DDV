<template>
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <header class="text-center space-y-2">
      <h1 class="text-4xl font-bold flex justify-center items-center gap-2">
        <span>🏆</span> Leaderboards
      </h1>
      <p class="text-gray-500 dark:text-gray-300 text-lg">
        Vê os melhores jogadores em diferentes categorias
      </p>
    </header>

    <!-- Filters + Refresh -->
    <div class="flex flex-col md:flex-row md:justify-between items-center gap-4">
      <div class="flex items-center gap-4 flex-wrap">
        <span class="font-semibold text-gray-600 dark:text-gray-300">Período:</span>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="period in periods"
            :key="period.value"
              @click="changePeriod(period.value)"
              :class="[
              'px-4 py-2 rounded-lg border transition-all font-medium',
              selectedPeriod === period.value 
                 ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-700 dark:border-blue-700 dark:text-white' 
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
            ]"
  :disabled="isLoading"
>
  <span class="mr-1">{{ period.emoji }}</span>{{ period.label }}
</button>
        </div>
      </div>
      <button
        @click="refreshLeaderboards"
        :disabled="isLoading"
        class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <span :class="['transition-transform', { 'animate-spin': isLoading }]">🔄</span>
        Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEmpty" class="flex flex-col items-center py-20 text-gray-500 dark:text-gray-300">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 dark:border-primary-dark dark:border-t-transparent"></div>
      <span>A carregar leaderboards...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20 text-red-500 dark:text-red-400 space-y-2">
      <div class="text-4xl mb-2">❌</div>
      <h3 class="font-semibold text-lg">Erro ao carregar leaderboards</h3>
      <p>{{ error }}</p>
      <button @click="refreshLeaderboards" class="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition">
        Tentar novamente
      </button>
    </div>

    <!-- Leaderboards Content -->
    <div v-else>
      <!-- Quick Stats -->
      <div v-if="!isEmpty" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md dark:shadow-lg flex items-center gap-4 transition-colors">
          <span class="text-3xl">👑</span>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalPlayers }}</div>
            <div class="text-gray-500 dark:text-gray-300 text-sm">Jogadores Ativos</div>
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md dark:shadow-lg flex items-center gap-4 transition-colors">
          <span class="text-3xl">🎮</span>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalGames }}</div>
            <div class="text-gray-500 dark:text-gray-300 text-sm">Total de Jogos</div>
          </div>
        </div>
      </div>

      <!-- Leaderboards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LeaderboardSection
          v-for="type in leaderboardTypes"
          :key="type.key"
          :title="type.title"
          :emoji="type.emoji"
          :description="type.description"
          :entries="leaderboards[type.key]"
          :current-user-id="currentUser?.id"
          :is-loading="isLoading"
          :type="type.key"
        />
      </div>

      <!-- User Positions -->
      <div v-if="currentUser && userPositions.length > 0" class="bg-gradient-to-r from-purple-700 to-indigo-900 dark:from-purple-800 dark:to-indigo-950 text-white rounded-xl p-6 mt-8 transition-colors">
        <h3 class="text-xl font-bold mb-4">As tuas posições:</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="position in userPositions"
            :key="position.type"
            class="bg-white/10 dark:bg-white/5 backdrop-blur-sm p-4 rounded-lg flex items-center gap-3 transition-colors"
          >
            <span class="text-2xl">{{ position.emoji }}</span>
            <div class="flex flex-col">
              <span class="text-sm opacity-90">{{ position.title }}</span>
              <span class="font-bold text-lg">#{{ position.position }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLeaderboardStore } from '@/stores/leaderboards'
import { useAuthStore } from '@/stores/auth'
import LeaderboardSection from '@/components/leaderboard/LeaderboardSection.vue'

// Stores
const leaderboardStore = useLeaderboardStore()
const authStore = useAuthStore()

// Reactive data from stores
const { leaderboards, isLoading, error, selectedPeriod, isEmpty, periods, leaderboardTypes } =
  storeToRefs(leaderboardStore)

const { currentUser } = storeToRefs(authStore)

// Computed properties
const totalPlayers = computed(() => {
  const allPlayers = new Set()
  Object.values(leaderboards.value).forEach((entries) => {
    entries.forEach((entry) => allPlayers.add(entry.id))
  })
  return allPlayers.size
})

const totalGames = computed(() => {
  if (leaderboards.value.mostGames.length > 0) {
    return leaderboards.value.mostGames[0]?.total_games || 0
  }
  return 0
})

const userPositions = computed(() => {
  if (!currentUser.value) return []

  const positions = []
  const userInLeaderboards = leaderboardStore.findUserInLeaderboards(currentUser.value.id)

  Object.entries(userInLeaderboards).forEach(([key, entry]) => {
    const type = leaderboardTypes.value.find((t) => t.key === key)
    if (type) {
      positions.push({
        type: key,
        title: type.title,
        emoji: type.emoji,
        position: entry.position,
      })
    }
  })

  return positions.sort((a, b) => a.position - b.position)
})

// Methods
const changePeriod = async (period) => {
  await leaderboardStore.changePeriod(period)
}

const refreshLeaderboards = async () => {
  await leaderboardStore.refreshLeaderboards()
}

// Lifecycle
onMounted(async () => {
  console.log('LeaderboardPage mounted')
  await leaderboardStore.fetchAllLeaderboards()
  console.log('After fetch - leaderboards:', leaderboards.value)
})

// Watch for auth changes
watch(
  () => authStore.currentUser,
  (newUser) => {
    if (newUser) {
      // Refresh leaderboards when user logs in to get updated positions
      leaderboardStore.fetchAllLeaderboards(selectedPeriod.value, 5, true)
    }
  },
)
</script>

<style scoped>
.leaderboard-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.page-title .emoji {
  font-size: 2rem;
}

.page-description {
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
}

/* Period Filters */
.period-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  font-weight: 600;
  color: #4a5568;
}

.period-buttons {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.period-btn:hover {
  border-color: #3182ce;
  background: #ebf8ff;
}

.period-btn.active {
  background: #3182ce;
  border-color: #3182ce;
  color: white;
}

.period-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  border-color: #38a169;
  background: #f0fff4;
}

.refresh-icon {
  font-size: 1.2rem;
  display: block;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Loading State */
.loading-container {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  font-size: 1.1rem;
  color: #718096;
}

/* Error State */
.error-container {
  text-align: center;
  padding: 4rem 2rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 1.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.retry-btn:hover {
  background: #2c5282;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-emoji {
  font-size: 2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1a202c;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
}

/* Leaderboards Grid */
.leaderboards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* User Positions */
.user-positions {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
}

.user-positions h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.user-position-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.user-position-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
}

.position-emoji {
  font-size: 1.5rem;
}

.position-info {
  display: flex;
  flex-direction: column;
}

.position-title {
  font-size: 0.875rem;
  opacity: 0.9;
}

.position-rank {
  font-size: 1.25rem;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {
  .leaderboard-page {
    padding: 1rem 0.5rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .period-filters {
    flex-direction: column;
    gap: 1rem;
  }

  .leaderboards-grid {
    grid-template-columns: 1fr;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }
}
</style>
