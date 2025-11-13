<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Histórico de Jogos</h1>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6"
    >
      <div class="flex flex-wrap items-center gap-4">
        <div>
          <label class="text-sm font-medium mr-2">Variante:</label>
          <select
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value="">Todas</option>
            <option value="bisca3">Bisca de 3</option>
            <option value="bisca9">Bisca de 9</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium mr-2">Resultado:</label>
          <select
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value="">Todos</option>
            <option value="win">Vitória</option>
            <option value="loss">Derrota</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium mr-2">Modo:</label>
          <select
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
          >
            <option value="">Todos</option>
            <option value="single">Single-player</option>
            <option value="multi">Multiplayer</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Games List -->
    <div class="space-y-4">
      <div
        v-for="game in gamesStore.games"
        :key="game.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-bold">{{ game.variant }}</h3>
              <span
                :class="[
                  'px-3 py-1 text-sm font-semibold rounded-full',
                  game.result === 'Vitória'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
                ]"
              >
                {{ game.result }}
              </span>
              <span class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full">
                {{ game.mode }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div><span class="font-medium">Pontuação:</span> {{ game.score }}</div>
              <div><span class="font-medium">Duração:</span> {{ game.duration }}</div>
              <div><span class="font-medium">Data:</span> {{ game.date }}</div>
            </div>
          </div>

          <button
            class="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGamesStore } from '../stores/mocks/games'

const gamesStore = useGamesStore()
</script>
