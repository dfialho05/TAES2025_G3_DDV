<template>
  <div class="leaderboard-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">
        <span class="emoji">🏆</span>
        Leaderboards
      </h1>
      <p class="page-description">Vê os melhores jogadores em diferentes categorias</p>
    </div>

    <!-- Period Filter -->
    <div class="period-filters">
      <div class="filter-group">
        <label class="filter-label">Período:</label>
        <div class="period-buttons">
          <button
            v-for="period in periods"
            :key="period.value"
            @click="changePeriod(period.value)"
            :class="['period-btn', { active: selectedPeriod === period.value }]"
            :disabled="isLoading"
          >
            <span class="emoji">{{ period.emoji }}</span>
            {{ period.label }}
          </button>
        </div>
      </div>

      <button
        @click="refreshLeaderboards"
        :disabled="isLoading"
        class="refresh-btn"
        title="Refresh Leaderboards"
      >
        <span :class="['refresh-icon', { spinning: isLoading }]">🔄</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEmpty" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">A carregar leaderboards...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h3>Erro ao carregar leaderboards</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="refreshLeaderboards" class="retry-btn">Tentar novamente</button>
    </div>

    <!-- Leaderboards Grid -->
    <div v-else class="leaderboards-container">
      <!-- Quick Stats Overview -->
      <div class="stats-overview" v-if="!isEmpty">
        <div class="stat-card">
          <span class="stat-emoji">👑</span>
          <div class="stat-info">
            <span class="stat-number">{{ totalPlayers }}</span>
            <span class="stat-label">Jogadores Ativos</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-emoji">🎮</span>
          <div class="stat-info">
            <span class="stat-number">{{ totalGames }}</span>
            <span class="stat-label">Total de Jogos</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-emoji">🏆</span>
          <div class="stat-info">
            <span class="stat-number">{{ topWinRate }}%</span>
            <span class="stat-label">Melhor Win Rate</span>
          </div>
        </div>
      </div>

      <!-- Leaderboards Grid -->
      <div class="leaderboards-grid">
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

      <!-- Current User Position -->
      <div v-if="currentUser && userPositions.length > 0" class="user-positions">
        <h3>As tuas posições:</h3>
        <div class="user-position-cards">
          <div v-for="position in userPositions" :key="position.type" class="user-position-card">
            <span class="position-emoji">{{ position.emoji }}</span>
            <div class="position-info">
              <span class="position-title">{{ position.title }}</span>
              <span class="position-rank">#{{ position.position }}</span>
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

const topWinRate = computed(() => {
  if (leaderboards.value.bestWinRatio.length > 0) {
    return Math.round(leaderboards.value.bestWinRatio[0]?.win_rate || 0)
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
