<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
  >
    <div class="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="mb-2 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        {{ title }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-300 m-0">{{ description }}</p>
    </div>

    <div class="p-4">
      <div
        v-if="isLoading && entries.length === 0"
        class="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-300"
      >
        <div
          class="w-5 h-5 border-2 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"
        ></div>
        <span>A carregar...</span>
      </div>

      <div
        v-else-if="entries.length === 0"
        class="text-center py-8 text-gray-500 dark:text-gray-300"
      >
        <div class="text-2xl mb-2"></div>
        <p>Sem dados disponíveis</p>
      </div>

      <div v-else class="px-2">
        <div
          v-for="(entry, index) in entries"
          :key="entry.id"
          :class="[
            'flex items-center p-3 mb-2 rounded-lg transition-all duration-300 relative',
            entry.id === currentUserId
              ? 'bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900 dark:to-teal-900 border-2 border-blue-600'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700',
            `position-${entry.position}`,
          ]"
        >
          <!-- Position Badge -->
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0',
              getPositionClass(entry.position) === 'gold' &&
                'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900',
              getPositionClass(entry.position) === 'silver' &&
                'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700',
              getPositionClass(entry.position) === 'bronze' &&
                'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900',
              getPositionClass(entry.position) === 'regular' &&
                'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
            ]"
          >
            <span v-if="entry.position <= 3" class="medal">
              {{ getMedal(entry.position) }}
            </span>
            <span v-else class="position-number">{{ entry.position }}</span>
          </div>

          <!-- Player Info -->
          <div class="flex-1 min-w-0">
            <h4
              class="mb-1 text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 m-0"
            >
              <router-link
                :to="`/profile/${entry.id}`"
                class="text-inherit no-underline transition-colors duration-200 hover:text-blue-600 hover:underline"
              >
                {{ entry.nickname || entry.name }}
              </router-link>
              <span
                v-if="entry.id === currentUserId"
                class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium"
                >Tu</span
              >
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-300 m-0">{{ getPlayerStats(entry) }}</p>
            <p
              v-if="getFirstAchievementDate(entry)"
              class="text-xs text-gray-400 dark:text-gray-400 m-0"
            >
              First achieved: {{ formatDate(getFirstAchievementDate(entry)) }}
            </p>
          </div>

          <!-- Main Stat -->
          <div class="flex flex-col items-end text-right">
            <span class="text-xl font-bold text-blue-600">{{ getMainStat(entry) }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-300 -mt-1">{{ getStatUnit() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  emoji: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  entries: {
    type: Array,
    default: () => [],
  },
  currentUserId: {
    type: [String, Number],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits([])

// Methods
const getPositionClass = (position) => {
  switch (position) {
    case 1:
      return 'gold'
    case 2:
      return 'silver'
    case 3:
      return 'bronze'
    default:
      return 'regular'
  }
}

const getMedal = (position) => {
  switch (position) {
    case 1:
      return '1'
    case 2:
      return '2'
    case 3:
      return '3'
    default:
      return position
  }
}

const getPlayerStats = (entry) => {
  switch (props.type) {
    case 'mostWins':
      return `${entry.wins || 0} vitórias`
    case 'mostMatches':
      return `${entry.total_matches || 0} partidas`
    case 'mostGames':
      return `${entry.total_games || 0} jogos`
    case 'kingOfCapotes':
      return `${entry.capotes || 0} capotes`
    case 'kingOfBandeiras':
      return `${entry.bandeiras || 0} bandeiras`
    default:
      return ''
  }
}

const getMainStat = (entry) => {
  switch (props.type) {
    case 'mostWins':
      return entry.wins || 0
    case 'mostMatches':
      return entry.total_matches || 0
    case 'mostGames':
      return entry.total_games || 0
    case 'kingOfCapotes':
      return entry.capotes || 0
    case 'kingOfBandeiras':
      return entry.bandeiras || 0
    default:
      return 0
  }
}

const getStatUnit = () => {
  switch (props.type) {
    default:
      return ''
  }
}

const getFirstAchievementDate = (entry) => {
  switch (props.type) {
    case 'mostWins':
      return entry.first_win_at
    case 'mostMatches':
      return entry.first_match_at
    case 'mostGames':
      return entry.first_game_at
    case 'kingOfCapotes':
      return entry.first_capote_at
    case 'kingOfBandeiras':
      return entry.first_bandeira_at
    default:
      return null
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.title-emoji {
  font-size: 1.5rem;
}

.medal {
  font-size: 1.2rem;
}

.position-number {
  font-size: 0.875rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
