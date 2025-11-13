<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">Estatísticas Detalhadas (Admin)</h1>
    
    <!-- Advanced Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Revenue Mensal</p>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">€2,450</p>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">+18% vs mês anterior</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Taxa de Conversão</p>
        <p class="text-3xl font-bold">23.5%</p>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Utilizadores que compraram</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Retenção 7 dias</p>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">68%</p>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Utilizadores ativos</p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg. Session</p>
        <p class="text-3xl font-bold">32m</p>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Tempo médio por sessão</p>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold mb-4">Revenue por Dia (Últimos 30 dias)</h2>
        <div class="h-64 flex items-end justify-between gap-1">
          <div v-for="(value, index) in revenueData" :key="index" class="flex-1 bg-green-500 rounded-t" :style="{ height: `${(value / 150) * 100}%` }">
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold mb-4">Novos Utilizadores (Últimos 30 dias)</h2>
        <div class="h-64 flex items-end justify-between gap-1">
          <div v-for="(value, index) in usersData" :key="index" class="flex-1 bg-blue-500 rounded-t" :style="{ height: `${(value / 50) * 100}%` }">
          </div>
        </div>
      </div>
    </div>
    
    <!-- Detailed Tables -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-bold mb-4">Top Compradores</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilizador</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Gasto</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moedas Compradas</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="buyer in topBuyers" :key="buyer.user">
              <td class="px-6 py-4 whitespace-nowrap font-medium">{{ buyer.user }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-green-600 dark:text-green-400 font-bold">{{ buyer.spent }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ buyer.coins }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ buyer.transactions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const revenueData = ref([45, 67, 89, 78, 95, 102, 88, 76, 91, 105, 98, 112, 125, 118, 134, 142, 128, 145, 138, 150, 142, 135, 148, 139, 145, 138, 142, 136, 140, 145])
const usersData = ref([12, 18, 15, 22, 28, 25, 30, 27, 35, 32, 38, 42, 39, 45, 41, 48, 44, 50, 47, 43, 46, 49, 45, 48, 44, 47, 43, 46, 42, 45])

const topBuyers = ref([
  { user: 'BiscaMaster', spent: '€125.00', coins: 1250, transactions: 8 },
  { user: 'CardKing', spent: '€98.00', coins: 980, transactions: 6 },
  { user: 'AcePro', spent: '€75.00', coins: 750, transactions: 5 },
  { user: 'BiscaFan', spent: '€62.00', coins: 620, transactions: 4 },
])
</script>
