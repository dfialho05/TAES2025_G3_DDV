<script setup>
import { onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useDeckStore } from '@/stores/deck'
import { useBiscaStore } from '@/stores/biscaStore'; // Store de Dados
import { useSocketStore } from '@/stores/socket';     // Store de Comunicação
import Card from '@/components/game/Card.vue';

const route = useRoute();
const router = useRouter();

const gameStore = useBiscaStore();
const deckStore = useDeckStore()
const socketStore = useSocketStore();


// Alias para compatibilidade visual
const {
  playerHand, opponentHandCount: botCardCount, trunfo, tableCards, opponentName, isWaiting,
  score, logs, currentTurn, isGameOver, cardsLeft, gameID
} = storeToRefs(gameStore);

const isConnected = computed(() => socketStore.joined);

onMounted(async () => {
  // Garante que o ouvinte de conexão base está ligado
  socketStore.handleConnection();

  if (deckStore.decks.length === 0) {
    await deckStore.fetchDecks()
  }

  // 1. LIGAR OS OUVIDOS (CRUCIAL) 👂
  // Alteração: Agora chamamos o socketStore, não o gameStore
  socketStore.bindGameEvents();

  // 2. Lógica de Inicialização
  if (route.query.mode) {
      // Modo Singleplayer
      const mode = parseInt(route.query.mode);
      if (!gameID.value) {
          console.log("Iniciando novo jogo Singleplayer...");
          setTimeout(() => gameStore.startGame(mode), 100);
      }
  } else {
      // Modo Multiplayer (Vem do Lobby)
      if (!gameID.value) {
          console.warn("Sem ID de jogo! Redirecionando para o Lobby...");
          router.push('/games/lobby'); // Ajusta a rota se necessário
      } else {
          console.log(`Reconectado à mesa ${gameID.value}`);
          // Opcional: Pedir refresh de estado
          // socketStore.socket.emit('get-game-state', gameID.value);
      }
  }
})

// Watcher de Segurança: Se o jogo acabar ou formos expulsos
watch(gameID, (newVal) => {
    if (!newVal) {
        console.log("Jogo terminado ou desconectado.");
        // router.push('/games/lobby');
    }
});

onUnmounted(() => {
  // CORREÇÃO CRÍTICA (Resolver o teu Bug de Salas Fantasma):
  // Se sairmos do componente (voltar atrás), forçamos a saída do jogo no servidor.
  if (gameID.value) {
      console.log("🧹 A desmontar mesa... a sair do jogo.");
      // Isto chama socket.emit('leave_game') e limpa o servidor
      gameStore.quitGame();
  }

  // Limpa os listeners do socket para não duplicar eventos se voltares a entrar
  // O bindGameEvents do socketStore já faz .off() antes de .on(), mas limpar aqui é boa prática
  // Se tivesses um unbind público no socketStore, usavas aqui.
});
</script>

<template>
  <div class="game-container">

    <div v-if="isWaiting" class="overlay waiting-overlay">
      <div class="waiting-box">
        <div class="spinner">⏳</div>
        <h2>Sala Criada!</h2>
        <p>A aguardar entrada do oponente...</p>
        <div class="room-info">
            ID da Sala: <strong>{{ gameID }}</strong>
        </div>
      </div>
    </div>

    <div v-if="!isConnected" class="overlay">
      <h2>A ligar ao servidor...</h2>
      <p>Certifica-te que o backend está a correr na porta 3000</p>
    </div>

    <!-- ÁREA DO BOT -->
    <div class="bot-area">
      <div class="avatar"> {{ opponentName }}</div>
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
/*pc*/
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #2e7d32;
  overflow-x: hidden;
  overflow-y: visible;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  overflow: visible;
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
  width:60px;
  height:85px;
}

/* Mãos */
.player-hand,
.bot-hand {
  display: flex;
  gap: 5px;
  justify-content: center;
  min-height: 100px;
  overflow: visible;
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

/*mobile*/
@media (max-width: 600px) {
  .small-card{
    width: 35px;
    height: 55px;
  }

  .mini-card{
    width: 45px;
    height: 65px;
  }

  .player-hand,
  .bot-hand {
    flex-wrap:wrap;
    gap:4px;
    min-height: 120px;
  }

  .played-cards {
    gap: 15px;
    margin: 10px 0;
    min-height: 90px;
  }

  .deck-pile {
    right: 10px;
    top: 55%;
    transform: translateY(-55%);

  }
  .trunfo-area {
    top: 10px;
    left: 10px;
  }

  .table-area {
    padding: 8px;
  }

  .game-log {
    font-size: 0.9rem;
    padding: 6px 12px;
  }

  .bot-area,
  .player-area {
    padding: 10px;
    gap: 8px;
  }
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
  transform: translateY(-50px) scale(0.5);
}

/* 4. CRUCIAL: Remove a carta do fluxo para as outras deslizarem */
.hand-anim-leave-active {
  position: relative;
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

.waiting-overlay {
  background: rgba(46, 125, 50, 0.98) !important; /* Verde quase opaco */
  z-index: 200; /* Garante que fica por cima de tudo */
}

.waiting-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  color: #333;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 300px;
}

.spinner {
  font-size: 3rem;
  margin-bottom: 20px;
  display: inline-block;
  animation: spin 2s infinite linear;
}

.room-info {
    margin-top: 15px;
    padding: 10px;
    background: #f1f8e9;
    border-radius: 6px;
    color: #2e7d32;
    font-family: monospace;
    font-size: 1.2rem;
    border: 1px dashed #2e7d32;
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
