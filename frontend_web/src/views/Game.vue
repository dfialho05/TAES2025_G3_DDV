<script setup>
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/useGameStore'

const store = useGameStore()
const {
  playerName, playerCards, trumpSuit, currentTurn, deckCount,
  playerScore, botScore, playerRoundCard, botRoundCard, roundWinner,
  statusMessage, statusClass, canStart, logContent, gameId,
  gameInfoVisible, scoresVisible, roundCardsVisible, formattedTime
} = storeToRefs(store)

const { connect, startSingleplayerGame, playCard } = store
</script>


<template>
  <div class="container mx-auto p-6 max-w-4xl bg-gray-50 min-h-screen">
    <h1 class="text-4xl font-bold text-center mb-6 text-indigo-700">Jogo de Cartas vs Bot</h1>

    <!-- Status -->
    <div :class="['status text-lg', statusClass]">{{ statusMessage }}</div>

    <!-- Conexão e início -->
    <!-- Conexão e início -->
<div class="text-center my-8">
  <input 
    v-model="playerName" 
    @keypress.enter="connect()" 
    placeholder="O teu nome"
    class="border-2 rounded-lg px-4 py-2 mr-3 text-lg" 
  />
  <button @click="connect()" class="btn-primary text-lg">
    Conectar
  </button>
  <button 
    @click="startSingleplayerGame()" 
    :disabled="!canStart" 
    class="btn-primary ml-4 text-lg"
  >
    Novo Jogo
  </button>
</div>
    <!-- Timer da vez -->
    <div v-if="gameId && currentTurn === playerName" class="text-center my-6">
      <div class="text-4xl font-bold text-red-600 animate-pulse">
        É A TUA VEZ! ⏰ {{ formattedTime }}
      </div>
    </div>
    <div v-else-if="gameId && currentTurn === 'Bot'" class="text-center my-6 text-2xl font-bold text-blue-600">
      O Bot está a pensar...
    </div>

    <!-- Informações do jogo -->
    <div v-if="gameInfoVisible" class="game-info grid grid-cols-3 gap-4 mb-6 text-center text-lg">
      <div class="bg-white p-4 rounded-lg shadow"><strong>Trunfo:</strong> {{ trumpSuit || '-' }}</div>
      <div class="bg-white p-4 rounded-lg shadow"><strong>Vez de:</strong> {{ currentTurn || '-' }}</div>
      <div class="bg-white p-4 rounded-lg shadow"><strong>Cartas no baralho:</strong> {{ deckCount }}</div>
    </div>

    <!-- Cartas da rodada -->
    <div v-if="roundCardsVisible" class="flex justify-center items-center gap-20 my-12">
      <div class="text-center">
        <h3 class="text-2xl font-bold text-green-700 mb-3">TU</h3>
        <div class="bg-emerald-100 border-emerald-600 text-emerald-900 px-12 py-20 rounded-2xl text-5xl shadow-2xl border-4">
          {{ playerRoundCard || '—' }}
        </div>
      </div>
      <div class="text-center">
        <h3 class="text-2xl font-bold text-red-700 mb-3">BOT</h3>
        <div class="透明 bg-rose-100 border-rose-600 text-rose-900 px-12 py-20 rounded-2xl text-5xl shadow-2xl border-4">
          {{ botRoundCard || '—' }}
        </div>
      </div>
    </div>

    <div v-if="roundWinner" class="text-center text-4xl font-bold my-8 text-purple-700 animate-bounce">
      Vencedor da rodada: {{ roundWinner }}
    </div>

    <!-- Pontuação -->
    <div v-if="scoresVisible" class="scores flex justify-center gap-16 text-3xl font-bold bg-white p-8 rounded-xl shadow-2xl">
      <div class="text-green-600">Tu: {{ playerScore }}</div>
      <div class="text-red-600">Bot: {{ botScore }}</div>
    </div>

    <!-- Suas cartas -->
    <div class="mt-12">
      <h3 class="text-3xl font-bold text-center mb-6">As tuas cartas:</h3>
      <div class="flex flex-wrap justify-center gap-4">
        <div v-for="card in playerCards" :key="card" @click="playCard(card)"
          :class="['card text-3xl cursor-pointer transition-all hover:scale-110', card.startsWith(trumpSuit) ? 'bg-yellow-300 border-red-600' : 'bg-white border-gray-700']">
          {{ card }}
        </div>
      </div>
    </div>

    <!-- Log -->
    <div class="mt-12">
      <h3 class="text-3xl font-bold mb-4 text-center">Log do Jogo:</h3>
      <div class="log h-64 overflow-y-auto p-4 bg-black text-green-400 rounded-lg font-mono text-sm" v-html="logContent"></div>
    </div>
  </div>
</template>



<style scoped>
.status { padding: 1rem; border-radius: 1rem; font-weight: bold; text-align: center; }
.connected { background: #d4edda; color: #155724; }
.waiting { background: #fff3cd; color: #856404; }
.disconnected { background: #f8d7da; color: #721c24; }

.card {
  min-width: 90px; min-height: 130px; display: flex; align-items: center; justify-content: center;
  border-radius: 16px; border-width: 5px; box-shadow: 0 6px 15px rgba(0,0,0,0.3);
  transition: all 0.2s;
}

.btn-primary {
  @apply bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition text-xl;
}
</style>