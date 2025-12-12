<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-100 dark:border-gray-700 shadow-sm"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🔍 Filtros</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div class="space-y-2">
          <label
            class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider"
            >Data Inicial</label
          >
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
        <div class="space-y-2">
          <label
            class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider"
            >Data Final</label
          >
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        <!-- Result Filter -->
        <div class="space-y-2">
          <label
            class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider"
            >Resultado</label
          >
          <select
            v-model="filters.result"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">Todos</option>
            <option value="win">Apenas Vitórias</option>
            <option value="loss">Apenas Derrotas</option>
            <option value="draw">Apenas Empates</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="space-y-2">
          <label
            class="text-xs uppercase text-slate-500 dark:text-gray-400 font-semibold tracking-wider"
            >Tipo</label
          >
          <select
            v-model="filters.type"
            class="w-full px-3 py-2 border border-slate-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">Todos</option>
            <option value="games">Apenas Jogos</option>
            <option value="matches">Apenas Partidas</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button
          @click="applyFilters"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Aplicar Filtros
        </button>
        <button
          @click="clearFilters"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-gray-600 dark:text-gray-300">
      <span v-if="!loading"
        >Mostrando {{ filteredItems.length }} de {{ totalItems.length }} resultados</span
      >
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Games Section -->
      <div v-if="showGames" class="bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
        <div class="p-4 border-b bg-slate-50/50 dark:bg-gray-700 flex justify-between items-center">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🎲 Jogos {{ filters.type === 'games' ? 'Filtrados' : '' }}
          </h3>
          <span
            class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded"
          >
            {{ filteredGames.length }}
          </span>
        </div>

        <div class="divide-y divide-slate-50 dark:divide-gray-700 max-h-96 overflow-y-auto">
          <div v-if="loading" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
            <div
              class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
            ></div>
            A carregar jogos...
          </div>

          <div
            v-else-if="filteredGames.length === 0"
            class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm"
          >
            <div class="mb-2">🎮</div>
            <div class="font-medium">Nenhum jogo encontrado</div>
            <div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Tenta ajustar os filtros para ver mais resultados
            </div>
          </div>

          <div
            v-for="game in filteredGames"
            :key="`game-${game.id}`"
            class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center gap-4">
              <span
                class="w-3 h-3 rounded-full ring-2 ring-white shadow-sm shrink-0"
                :class="game.status === 'Ended' ? 'bg-emerald-500' : 'bg-amber-400'"
                :title="game.status"
              ></span>
              <div class="flex flex-col min-w-0 flex-1 text-gray-900 dark:text-gray-100">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm truncate"> Bisca </span>
                  <span
                    class="text-[9px] text-slate-400 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0"
                  >
                    {{ game.type || 'Standard' }}
                  </span>
                </div>
                <div class="text-xs text-slate-500 dark:text-gray-400 mb-1">
                  {{ formatDate(game.began_at) }}
                </div>
                <div class="text-xs flex items-center gap-2" v-if="getGamePoints(game).hasPoints">
                  <span class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="game.is_winner === null ? 'bg-amber-500' : 'bg-blue-500'"
                    ></span>
                    <span
                      class="font-semibold"
                      :class="game.is_winner === null ? 'text-amber-700' : 'text-blue-700'"
                      >{{ getGamePoints(game).userPoints }}</span
                    >
                    <span class="text-slate-600 dark:text-gray-300">pts</span>
                  </span>
                  <span class="text-slate-400 dark:text-gray-500">•</span>
                  <span class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="game.is_winner === null ? 'bg-amber-500' : 'bg-gray-500'"
                    ></span>
                    <span
                      class="font-semibold"
                      :class="game.is_winner === null ? 'text-amber-700' : 'text-gray-700'"
                      >{{ getGamePoints(game).opponentPoints }}</span
                    >
                    <span class="text-slate-500 dark:text-gray-300">pts</span>
                  </span>
                </div>
                <div v-else class="text-xs italic text-gray-500 dark:text-gray-300">
                  Pontos não disponíveis
                </div>
              </div>
            </div>

            <div class="text-right">
              <span
                class="text-xs font-bold px-2 py-1 rounded border"
                :class="getResultClass(game.is_winner)"
              >
                {{ getResultText(game.is_winner) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Matches Section -->
      <div v-if="showMatches" class="bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
        <div class="p-4 border-b bg-slate-50/50 dark:bg-gray-700 flex justify-between items-center">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🏆 Partidas {{ filters.type === 'matches' ? 'Filtradas' : '' }}
          </h3>
          <span
            class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded"
          >
            {{ filteredMatches.length }}
          </span>
        </div>

        <div class="divide-y divide-slate-50 dark:divide-gray-700 max-h-96 overflow-y-auto">
          <div v-if="loading" class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm">
            <div
              class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
            ></div>
            A carregar partidas...
          </div>

          <div
            v-else-if="filteredMatches.length === 0"
            class="p-8 text-center text-gray-400 dark:text-gray-300 text-sm"
          >
            <div class="mb-2">🛡️</div>
            <div class="font-medium">Nenhuma partida encontrada</div>
            <div class="text-xs mt-1 text-gray-300 dark:text-gray-400">
              Tenta ajustar os filtros para ver mais resultados
            </div>
          </div>

          <div
            v-for="match in filteredMatches"
            :key="`match-${match.id}`"
            class="cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer"
              @click.stop="toggleMatch(match.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedMatchId === match.id }"
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
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>

                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-bold text-xs uppercase tracking-wider"
                      :class="getResultColorClass(isWinner(match))"
                    >
                      {{ getResultText(isWinner(match)) }}
                    </span>
                    <span
                      class="text-[9px] text-slate-400 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0"
                    >
                      {{ match.type || 'Standard' }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-500 dark:text-gray-400 mb-1">
                    {{ formatDate(match.began_at) }}
                  </div>
                  <div class="text-xs italic text-gray-400 dark:text-gray-500">
                    {{ getMatchResultDescription(match) }}
                  </div>
                </div>
              </div>

              <div class="text-right">
                <span
                  class="text-xs font-bold px-2 py-1 rounded border"
                  :class="getResultClass(isWinner(match))"
                >
                  {{ getResultText(isWinner(match)) }}
                </span>
              </div>
            </div>

            <div
              v-if="expandedMatchId === match.id"
              class="bg-slate-50/80 dark:bg-gray-700/50 border-t border-slate-100 dark:border-gray-700 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200"
            >
              <h4
                class="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Detalhes dos Jogos
              </h4>

              <div v-if="match.games && match.games.length > 0" class="space-y-2">
                <div
                  v-for="g in match.games"
                  :key="`match-game-${g.id}`"
                  class="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-slate-200 dark:border-gray-600 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm shrink-0"
                      :class="g.status === 'Ended' ? 'bg-emerald-500' : 'bg-amber-400'"
                      :title="g.status"
                    ></span>
                    <div class="flex flex-col min-w-0 flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm text-slate-800 dark:text-gray-200 truncate">
                          Bisca
                        </span>
                        <span
                          class="text-[9px] text-slate-400 dark:text-gray-400 uppercase bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0"
                        >
                          {{ g.type || 'Standard' }}
                        </span>
                      </div>
                      <div class="text-xs text-slate-500 dark:text-gray-400 mb-1">
                        {{ formatDate(g.began_at) }}
                      </div>
                      <div
                        class="text-xs flex items-center gap-2"
                        v-if="getGamePoints(g).hasPoints"
                      >
                        <span class="flex items-center gap-1">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="g.is_winner === null ? 'bg-amber-500' : 'bg-blue-500'"
                          ></span>
                          <span
                            class="font-semibold"
                            :class="
                              g.is_winner === null
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-blue-700 dark:text-blue-400'
                            "
                            >{{ getGamePoints(g).userPoints }}</span
                          >
                          <span class="text-slate-600 dark:text-gray-300">pts</span>
                        </span>
                        <span class="text-slate-400 dark:text-gray-500">•</span>
                        <span class="flex items-center gap-1">
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="g.is_winner === null ? 'bg-amber-500' : 'bg-gray-500'"
                          ></span>
                          <span
                            class="font-semibold"
                            :class="
                              g.is_winner === null
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-gray-700 dark:text-gray-400'
                            "
                            >{{ getGamePoints(g).opponentPoints }}</span
                          >
                          <span class="text-slate-600 dark:text-gray-300">pts</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="text-right">
                    <span
                      class="text-xs font-bold px-2 py-1 rounded border"
                      :class="getResultClass(g.is_winner)"
                    >
                      {{ getResultText(g.is_winner) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="text-xs text-slate-500 dark:text-gray-400 p-2 italic text-center">
                Nenhum jogo encontrado para esta partida
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  games: {
    type: Array,
    default: () => [],
  },
  matches: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  displayedUser: {
    type: Object,
    default: null,
  },
})

defineEmits(['load-more'])

const expandedMatchId = ref(null)

const filters = ref({
  startDate: '',
  endDate: '',
  result: 'all', // all, win, loss, draw
  type: 'all', // all, games, matches
})

const showGames = computed(() => {
  return filters.value.type === 'all' || filters.value.type === 'games'
})

const showMatches = computed(() => {
  return filters.value.type === 'all' || filters.value.type === 'matches'
})

const totalItems = computed(() => {
  let items = []
  if (showGames.value) items = items.concat(props.games)
  if (showMatches.value) items = items.concat(props.matches)
  return items
})

const filteredGames = computed(() => {
  if (!showGames.value) return []
  return props.games.filter((game) => {
    return applyCommonFilters(game)
  })
})

const filteredMatches = computed(() => {
  if (!showMatches.value) return []
  return props.matches.filter((match) => {
    return applyCommonFilters(match)
  })
})

const filteredItems = computed(() => {
  return [...filteredGames.value, ...filteredMatches.value]
})

const applyCommonFilters = (item) => {
  //Filtrar por datas
  if (filters.value.startDate) {
    const itemDate = new Date(item.began_at)
    const startDate = new Date(filters.value.startDate)
    if (itemDate < startDate) return false
  }

  if (filters.value.endDate) {
    const itemDate = new Date(item.began_at)
    const endDate = new Date(filters.value.endDate)
    endDate.setHours(23, 59, 59, 999)
    if (itemDate > endDate) return false
  }

  //Filtrar por resultado
  if (filters.value.result !== 'all') {
    if (item.games) {
      // Se for uma match usar o resultado da match
      const winner = isWinner(item)
      if (filters.value.result === 'win' && winner !== true) return false
      if (filters.value.result === 'loss' && winner !== false) return false
      if (filters.value.result === 'draw' && winner !== null) return false
    } else {
      // Se for um jogo individual
      const winner = item.is_winner
      if (filters.value.result === 'win' && winner !== true) return false
      if (filters.value.result === 'loss' && winner !== false) return false
      if (filters.value.result === 'draw' && winner !== null) return false
    }
  }

  return true
}



const toggleMatch = (matchId) => {
  expandedMatchId.value = expandedMatchId.value === matchId ? null : matchId
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getGamePoints = (game) => {
  if (!game.points || !Array.isArray(game.points)) {
    return { hasPoints: false, userPoints: 0, opponentPoints: 0 }
  }

  const userPoint = game.points.find((p) => p.user_id === props.displayedUser?.id)
  const opponentPoint = game.points.find((p) => p.user_id !== props.displayedUser?.id)

  return {
    hasPoints: true,
    userPoints: userPoint ? userPoint.points : 0,
    opponentPoints: opponentPoint ? opponentPoint.points : 0,
  }
}

const isWinner = (match) => {
  if (!match.games || match.games.length === 0) return null

  let userWins = 0
  let opponentWins = 0

  match.games.forEach((game) => {
    if (game.is_winner === true) {
      userWins++
    } else if (game.is_winner === false) {
      opponentWins++
    }
  })

  if (userWins > opponentWins) return true
  if (opponentWins > userWins) return false
  return null
}

const getMatchResultDescription = (match) => {
  if (!match.games || match.games.length === 0) {
    return 'Sem jogos registados'
  }

  let userWins = 0
  let opponentWins = 0
  let draws = 0

  match.games.forEach((game) => {
    if (game.is_winner === true) {
      userWins++
    } else if (game.is_winner === false) {
      opponentWins++
    } else {
      draws++
    }
  })

  const parts = []
  if (userWins > 0) parts.push(`${userWins} vitórias`)
  if (opponentWins > 0) parts.push(`${opponentWins} derrotas`)
  if (draws > 0) parts.push(`${draws} empates`)

  return parts.join(', ') || 'Sem resultados'
}

const getResultText = (winner) => {
  if (winner === true) return 'VITÓRIA'
  if (winner === false) return 'DERROTA'
  return 'EMPATE'
}

const getResultClass = (winner) => {
  if (winner === true) {
    return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
  }
  if (winner === false) {
    return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-300 dark:border-red-700'
  }
  return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700'
}

const getResultColorClass = (winner) => {
  if (winner === true) return 'text-green-600 dark:text-green-400'
  if (winner === false) return 'text-red-500 dark:text-red-400'
  return 'text-amber-600 dark:text-amber-400'
}

const applyFilters = () => {
  // Filters are reactive, so they're already applied
  // This function could be used for additional logic if needed
  console.log('Filtros aplicados:', filters.value)
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    result: 'all',
    type: 'all',
  }
}
</script>
