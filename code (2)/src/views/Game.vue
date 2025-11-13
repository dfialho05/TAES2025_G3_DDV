<template>
  <div class="min-h-[calc(100vh-4rem)] bg-green-700 dark:bg-green-900 relative">
    <!-- Game Header -->
    <div class="absolute top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm p-4">
      <div class="container mx-auto flex items-center justify-between">
        <div class="text-white">
          <p class="text-sm opacity-75">Bisca de 3 - Single Player</p>
          <p class="font-bold">Você vs Bot</p>
        </div>
        
        <div class="flex items-center gap-6 text-white">
          <div class="text-center">
            <p class="text-2xl font-bold">85</p>
            <p class="text-xs opacity-75">Bot</p>
          </div>
          
          <div class="px-4 py-2 bg-white/20 rounded-lg">
            <p class="text-sm opacity-75">Tempo</p>
            <p class="text-xl font-bold">08:32</p>
          </div>
          
          <div class="text-center">
            <p class="text-2xl font-bold">120</p>
            <p class="text-xs opacity-75">Você</p>
          </div>
        </div>
        
        <router-link 
          to="/play"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Sair
        </router-link>
      </div>
    </div>
    
    <!-- Game Board -->
    <div class="container mx-auto px-4 pt-24 pb-8 h-[calc(100vh-4rem)] flex flex-col">
      <!-- Opponent Area -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div v-for="i in 3" :key="`opp-${i}`" class="w-20 h-28 bg-blue-900 rounded-lg border-2 border-blue-700 shadow-lg"></div>
      </div>
      
      <!-- Center Area (Trump & Table) -->
      <div class="flex-1 flex items-center justify-center gap-8">
        <!-- Deck & Trump -->
        <div class="relative">
          <div class="w-24 h-32 bg-blue-900 rounded-lg border-2 border-blue-700 shadow-lg"></div>
          <div class="absolute -right-16 top-0 w-24 h-32 bg-red-600 rounded-lg border-2 border-red-800 shadow-lg flex items-center justify-center">
            <span class="text-white text-4xl font-bold">♥</span>
          </div>
          <p class="text-white text-center mt-2 text-sm">Trunfo: ♥</p>
        </div>
        
        <!-- Played Cards -->
        <div class="flex gap-4">
          <div class="w-24 h-32 bg-white rounded-lg border-2 border-gray-300 shadow-xl flex items-center justify-center">
            <div class="text-center">
              <p class="text-4xl">7</p>
              <p class="text-3xl text-red-600">♦</p>
            </div>
          </div>
          <div class="w-24 h-32 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg"></div>
        </div>
      </div>
      
      <!-- Player Area -->
      <div class="flex items-center justify-center gap-2 mt-8">
        <button 
          v-for="(card, i) in playerCards" 
          :key="`player-${i}`"
          class="w-24 h-32 bg-white rounded-lg border-2 border-gray-300 shadow-lg hover:-translate-y-2 transition-transform cursor-pointer flex items-center justify-center"
        >
          <div class="text-center">
            <p class="text-4xl font-bold">{{ card.value }}</p>
            <p class="text-3xl" :class="card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-900'">
              {{ card.suit }}
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const playerCards = ref([
  { value: 'A', suit: '♠' },
  { value: 'K', suit: '♣' },
  { value: '3', suit: '♥' }
])
</script>
