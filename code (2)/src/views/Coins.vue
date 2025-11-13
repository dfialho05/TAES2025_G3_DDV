<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <h1 class="text-3xl font-bold mb-8">Moedas</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Current Balance -->
      <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-xl shadow-lg p-6">
        <p class="text-sm opacity-90 mb-2">Saldo Atual</p>
        <div class="flex items-end gap-2">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
          </svg>
          <p class="text-4xl font-bold">{{ authStore.user.coins }}</p>
        </div>
        <p class="text-sm opacity-90 mt-2">moedas disponíveis</p>
      </div>
      
      <!-- Buy Coins CTA -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold mb-2">Comprar Moedas</h3>
          <p class="text-gray-600 dark:text-gray-400">€1 = 10 moedas</p>
        </div>
        <button 
          @click="showBuyModal = true"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Comprar Agora
        </button>
      </div>
    </div>
    
    <!-- Transaction History -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold">Histórico de Transações</h2>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="transaction in transactionsStore.transactions" :key="transaction.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ transaction.date }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'px-2 py-1 text-xs font-semibold rounded-full',
                  transaction.type === 'purchase' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' :
                  transaction.type === 'win' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                ]">
                  {{ transaction.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'font-semibold',
                  transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                ]">
                  {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ transaction.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Buy Modal -->
    <div v-if="showBuyModal" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" @click="showBuyModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" @click.stop>
        <h3 class="text-2xl font-bold mb-6">Comprar Moedas</h3>
        
        <div class="space-y-3 mb-6">
          <button 
            v-for="pack in coinPacks"
            :key="pack.coins"
            @click="selectPack(pack)"
            :class="[
              'w-full p-4 border-2 rounded-lg text-left transition-colors',
              selectedPack?.coins === pack.coins 
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-lg">{{ pack.coins }} moedas</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ pack.price }}</p>
              </div>
              <div v-if="pack.bonus" class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-semibold rounded">
                +{{ pack.bonus }} bónus
              </div>
            </div>
          </button>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="completePurchase"
            :disabled="!selectedPack"
            :class="[
              'flex-1 px-6 py-3 rounded-lg font-semibold transition-colors',
              selectedPack
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            ]"
          >
            Confirmar Compra
          </button>
          <button 
            @click="showBuyModal = false"
            class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../store/auth'
import { useTransactionsStore } from '../store/transactions'

const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()

const showBuyModal = ref(false)
const selectedPack = ref(null)

const coinPacks = [
  { coins: 50, price: '€5.00', bonus: 0 },
  { coins: 100, price: '€10.00', bonus: 10 },
  { coins: 250, price: '€25.00', bonus: 50 },
  { coins: 500, price: '€50.00', bonus: 150 },
]

function selectPack(pack) {
  selectedPack.value = pack
}

function completePurchase() {
  if (selectedPack.value) {
    const totalCoins = selectedPack.value.coins + (selectedPack.value.bonus || 0)
    authStore.addCoins(totalCoins)
    transactionsStore.addTransaction({
      type: 'purchase',
      amount: totalCoins,
      description: `Compra de ${selectedPack.value.coins} moedas${selectedPack.value.bonus ? ` (+${selectedPack.value.bonus} bónus)` : ''}`
    })
    showBuyModal.value = false
    selectedPack.value = null
  }
}
</script>
