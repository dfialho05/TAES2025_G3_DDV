<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Histórico Global de Jogos</h1>
      <div class="flex items-center gap-3">
        <select class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
          <option value="">Todas as variantes</option>
          <option value="bisca3">Bisca de 3</option>
          <option value="bisca9">Bisca de 9</option>
        </select>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Total de Jogos</p>
        <p class="text-3xl font-bold">45,678</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Jogos Hoje</p>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">567</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Duração Média</p>
        <p class="text-3xl font-bold">14m</p>
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variante</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jogadores</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duração</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="game in mockGames" :key="game.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono">{{ game.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.date }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded">
                  {{ game.variant }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.players }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">{{ game.score }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ game.duration }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button class="text-primary-600 hover:underline">Ver Detalhes</button>
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

const mockGames = ref([
  { id: 5001, date: '2024-01-15 14:30', variant: 'Bisca de 3', players: 'BiscaMaster vs Bot', score: '120-85', duration: '12 min' },
  { id: 5002, date: '2024-01-15 14:20', variant: 'Bisca de 9', players: 'CardKing vs AcePro', score: '95-110', duration: '18 min' },
  { id: 5003, date: '2024-01-15 14:15', variant: 'Bisca de 3', players: 'BiscaFan vs Bot', score: '100-60', duration: '10 min' },
  { id: 5004, date: '2024-01-15 14:10', variant: 'Bisca de 9', players: 'AcePro vs BiscaMaster', score: '115-90', duration: '20 min' },
  { id: 5005, date: '2024-01-15 14:05', variant: 'Bisca de 3', players: 'CardKing vs Bot', score: '75-95', duration: '11 min' },
])
</script>
