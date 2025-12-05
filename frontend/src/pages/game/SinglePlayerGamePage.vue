<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBiscaStore } from '@/stores/biscaStore';
import { useSocketStore } from '@/stores/socket';
import Card from '@/components/game/Card.vue';

const route = useRoute();
const gameStore = useBiscaStore();
const socketStore = useSocketStore();

// Usamos alias para compatibilidade com o template antigo
const {
  playerHand, opponentHandCount: botCardCount, trunfo, tableCards,
  score, logs, currentTurn, isGameOver, cardsLeft, gameID
} = storeToRefs(gameStore);

const isConnected = computed(() => socketStore.joined);

onMounted(() => {
  socketStore.handleConnection();

  // CORREÇÃO CRÍTICA:
  // Só iniciamos um jogo novo se NÃO tivermos já um ID de jogo (vindo do Lobby)
  if (!gameID.value && route.query.mode) {
      console.log("Iniciando novo jogo Singleplayer...");
      const mode = parseInt(route.query.mode);
      // Pequeno delay para garantir que a conexão socket está pronta
      setTimeout(() => {
          gameStore.startGame(mode);
      }, 100);
  } else {
      console.log("A entrar em jogo existente ou aguardando...", gameID.value);
  }
});

onUnmounted(() => {
  // Ao sair da página, saímos do jogo
  gameStore.quitGame();
});
</script>

<template>
  <div class="game-container">

    <div v-if="!isConnected" class="overlay">
      <h2>A ligar ao servidor...</h2>
      <p>Certifica-te que o backend está a correr na porta 3000</p>
    </div>

    <!-- ÁREA DO BOT -->
    <div class="bot-area">
      <div class="avatar">🤖 Bot</div>
      <div class="bot-hand">
        <Card v-for="n in botCardCount" :key="n" :face-down="true" class="small-card" />
      </div>
      <div class="score-badge">Pontos: {{ score.bot }}</div>
    </div>

    <!-- MESA DE JOGO -->
    <div class="table-area">

      <!-- Baralho -->
      <div v-if="cardsLeft > 0" class="deck-pile">
        <Card :face-down="true" />
        <span class="deck-count">{{ cardsLeft }}</span>
      </div>

      <!-- Trunfo -->
      <div class="trunfo-area" v-if="trunfo">
        <span>Trunfo:</span>
        <Card :card="trunfo" class="mini-card" />
      </div>

      <!-- CARTAS JOGADAS (Com Animação) -->
      <TransitionGroup name="table-anim" tag="div" class="played-cards">
        <div v-for="move in tableCards" :key="move.player" class="move-wrapper">
          <Card :card="move.card" />
          <span class="label">{{ move.player === 'user' ? 'Tu' : 'Bot' }}</span>
        </div>
      </TransitionGroup>

      <div class="game-log">{{ logs }}</div>

      <button v-if="isGameOver" @click="gameStore.startGame()" class="restart-btn">
        Jogar Novamente
      </button>
    </div>

    <!-- ÁREA DO JOGADOR -->
    <div class="player-area">
      <div class="score-badge" :class="{ 'active-turn': currentTurn === 'user' }">
        Teus Pontos: {{ score.user }}
        <span v-if="currentTurn === 'user'" class="turn-text">(Sua vez!)</span>
      </div>

      <!-- MÃO DO JOGADOR (Com Animação) -->
      <TransitionGroup name="hand-anim" tag="div" class="player-hand">
        <Card v-for="(card, index) in playerHand" :key="card.id" :card="card" :interactable="currentTurn === 'user'"
          :class="{ 'disabled': currentTurn !== 'user' }" @click="gameStore.playCard(index)" />
      </TransitionGroup>
    </div>

  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #2e7d32;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* ÁREAS */
.bot-area,
.player-area {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.table-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* Tamanhos de cartas especiais */
.small-card {
  width: 50px;
  height: 75px;
}

.mini-card {
  width: 60px;
  height: 85px;
}

/* Mãos */
.player-hand,
.bot-hand {
  display: flex;
  gap: 5px;
  justify-content: center;
  min-height: 100px;
  /* Garante altura para a animação não cortar */
}

.bot-hand {
  margin-bottom: 5px;
}

/* Disabled state */
.disabled {
  filter: grayscale(0.6);
  cursor: not-allowed !important;
}

.disabled:hover {
  transform: none !important;
}

/* Mesa */
.played-cards {
  display: flex;
  gap: 40px;
  margin: 20px 0;
  min-height: 120px;
  /* Espaço reservado para evitar pulos de layout */
  align-items: flex-end;
}

.move-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.label {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Deck e Trunfo */
.deck-pile {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.deck-count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  font-size: 1.5rem;
  text-shadow: 1px 1px 2px black;
  pointer-events: none;
}

.trunfo-area {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* UI */
.game-log {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-weight: bold;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 1.1rem;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.restart-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background: #ffb74d;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  color: #333;
}

.score-badge {
  font-weight: bold;
  font-size: 1.1rem;
}

.active-turn {
  color: #ffeb3b;
  text-shadow: 0 0 5px rgba(255, 235, 59, 0.5);
}

.turn-text {
  font-size: 0.9rem;
  margin-left: 5px;
}

/* =========================================
   ANIMAÇÕES (CSS Mágico)
   ========================================= */

/* --- ANIMAÇÃO DA MÃO DO JOGADOR (hand-anim) --- */

/* 1. Movimento suave (Move, Enter, Leave) */
.hand-anim-move,
.hand-anim-enter-active,
.hand-anim-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. Entrada (Quando pescas cartas) */
.hand-anim-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

/* 3. Saída (Quando jogas a carta -> Sobe em direção à mesa) */
.hand-anim-leave-to {
  opacity: 0;
  transform: translateY(-100px) scale(0.5);
}

/* 4. CRUCIAL: Remove a carta do fluxo para as outras deslizarem */
.hand-anim-leave-active {
  position: absolute;
}

/* --- ANIMAÇÃO DA MESA (table-anim) --- */
.table-anim-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* Efeito elástico */
}

.table-anim-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(50px);
}
</style>
