<script setup>
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useDeckStore } from '@/stores/deck'
import { useBiscaStore } from '@/stores/biscaStore';
import { useSocketStore } from '@/stores/socket';
import Card from '@/components/game/Card.vue';

const route = useRoute();
const router = useRouter();

const gameStore = useBiscaStore();
const deckStore = useDeckStore()
const socketStore = useSocketStore();

// Dados da Store
const {
  playerHand, opponentHandCount: botCardCount, trunfo, tableCards, opponentName, isWaiting,
  score, logs, currentTurn, isGameOver, cardsLeft, gameID,
  sessionScore, gameTarget
} = storeToRefs(gameStore);

const isConnected = computed(() => socketStore.joined);

// --- LÓGICA DE RESULTADOS (SEM MOEDAS) ---
const gameResult = computed(() => {
  if (!isGameOver.value) return null;

  const iWon = sessionScore.value.me >= gameTarget.value;

  // Pontuação da última rodada para determinar conquistas
  const finalScore = score.value.me;
  const oppScore = score.value.opponent;

  let achievement = null;

  // Lógica de Conquistas (Capote / Bandeira)
  if (finalScore === 120) {
    achievement = 'BANDEIRA';
  } else if (finalScore >= 91) {
    achievement = 'CAPOTE';
  } else if (oppScore === 120) {
    achievement = 'SOFREU BANDEIRA'; // Opcional: mostrar se perdeste feio
  }

  return {
    title: iWon ? 'VITÓRIA!' : 'DERROTA',
    isWin: iWon,
    achievement,
    finalScore: `${finalScore} - ${oppScore}`, // Ex: 120 - 0
    sessionResult: `${sessionScore.value.me} - ${sessionScore.value.opponent}` // Ex: 4 - 0
  };
});

onMounted(async () => {
  socketStore.handleConnection();
  if (deckStore.decks.length === 0) await deckStore.fetchDecks();
  socketStore.bindGameEvents();

  if (route.query.mode) {
      const cards = parseInt(route.query.mode);
      const targetWins = parseInt(route.query.wins) || 1;
      if (!gameID.value) {
          setTimeout(() => {
              gameStore.startGame(cards, 'singleplayer', targetWins);
          }, 100);
      }
  } else {
      if (!gameID.value) {
          router.push('/games/lobby');
      }
  }
})

watch(gameID, (newVal) => {
    if (!newVal) console.log("Jogo terminado.");
});

onUnmounted(() => {
  if (gameID.value) gameStore.quitGame();
});

// Botões do Modal
const handleRestart = () => {
  gameStore.startGame(route.query.mode || 3, 'singleplayer', route.query.wins || 1);
};

const handleExit = () => {
  router.push('/games/lobby');
};
</script>

<template>
  <div class="game-container">

    <div v-if="isWaiting" class="overlay waiting-overlay">
      <div class="waiting-box">
        <div class="spinner">⏳</div>
        <h2>Sala Criada!</h2>
        <p>A aguardar entrada do oponente...</p>
        <div class="room-info">ID: <strong>{{ gameID }}</strong></div>
      </div>
    </div>

    <div v-if="!isConnected" class="overlay">
      <h2>A ligar ao servidor...</h2>
    </div>

    <Transition name="pop">
      <div v-if="isGameOver && gameResult" class="overlay result-overlay">
        <div class="result-card" :class="{ 'win-card': gameResult.isWin, 'lose-card': !gameResult.isWin }">

          <div class="result-header">
            <h1>{{ gameResult.title }}</h1>
            <div class="stars" v-if="gameResult.isWin">⭐⭐⭐</div>
          </div>

          <div class="result-body">

            <div class="match-score">
              <p>Placar do Campeonato</p>
              <div class="big-score">{{ gameResult.sessionResult }}</div>
            </div>

            <hr>

            <div class="hand-details">
              <p>Última Rodada: <strong>{{ gameResult.finalScore }}</strong> pts</p>

              <div v-if="gameResult.achievement" class="achievement-badge" :class="gameResult.achievement.toLowerCase().replace(' ', '-')">
                🏅 {{ gameResult.achievement }}
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button @click="handleExit" class="btn-secondary">Sair</button>
            <button @click="handleRestart" class="btn-primary">Jogar Novamente</button>
          </div>

        </div>
      </div>
    </Transition>

    <div class="bot-area">
      <div class="avatar-group">
        <div class="avatar"> {{ opponentName }}</div>
        <div class="marks-container">
           <div v-for="n in gameTarget" :key="n" class="mark-dot" :class="{ 'filled': n <= sessionScore.opponent }"></div>
        </div>
      </div>
      <div class="bot-hand">
        <Card v-for="n in botCardCount" :key="n" :face-down="true" class="small-card" />
      </div>
      <div class="score-badge">Pontos Cartas: {{ score.opponent }}</div>
    </div>

    <div class="table-area">
      <div v-if="cardsLeft > 0" class="deck-pile">
        <Card :face-down="true" />
        <span class="deck-count">{{ cardsLeft }}</span>
      </div>

      <div class="trunfo-area" v-if="trunfo">
        <span>Trunfo:</span>
        <Card :card="trunfo" class="mini-card" />
      </div>

      <TransitionGroup name="table-anim" tag="div" class="played-cards">
        <div v-for="move in tableCards" :key="move.player" class="move-wrapper">
          <Card :card="move.card" />
          <span class="label">{{ move.player === 'user' ? 'Tu' : 'Bot' }}</span>
        </div>
      </TransitionGroup>

      <div class="game-log" v-if="!isGameOver">{{ logs }}</div>
    </div>

    <div class="player-area">
      <div class="player-info-row">
         <div class="marks-container">
           <div v-for="n in gameTarget" :key="n" class="mark-dot" :class="{ 'filled': n <= sessionScore.me }"></div>
        </div>
        <div class="score-badge" :class="{ 'active-turn': currentTurn === 'user' }">
          Teus Pontos: {{ score.me }}
          <span v-if="currentTurn === 'user'" class="turn-text">(Sua vez!)</span>
        </div>
      </div>

      <TransitionGroup name="hand-anim" tag="div" class="player-hand">
        <Card v-for="(card, index) in playerHand" :key="card.id" :card="card" :interactable="currentTurn === 'user' && tableCards.length < 2"
          :class="{ 'disabled': currentTurn !== 'user' || tableCards.length >= 2 }" @click="gameStore.playCard(index)" />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* =========================================
   ESTILOS GERAIS
   ========================================= */
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #2e7d32;
  overflow-x: hidden;
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* =========================================
   RESULT SCREEN (SEM MOEDAS)
   ========================================= */
.result-overlay {
  background: rgba(0, 0, 0, 0.9) !important;
  z-index: 300;
}

.result-card {
  background: white;
  color: #333;
  width: 90%;
  max-width: 380px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  text-align: center;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.result-header {
  padding: 20px;
  color: white;
}

.win-card .result-header {
  background: linear-gradient(135deg, #fbc02d, #f57f17); /* Dourado */
}

.lose-card .result-header {
  background: linear-gradient(135deg, #546e7a, #37474f); /* Cinza */
}

.result-header h1 {
  margin: 0;
  font-size: 2.2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.result-body {
  padding: 20px;
}

.big-score {
  font-size: 3.5rem;
  font-weight: 800;
  color: #333;
  line-height: 1;
  margin: 10px 0;
}

.match-score p {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: #666;
  font-weight: bold;
}

/* Badge de Conquistas */
.achievement-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 50px;
  font-weight: bold;
  color: white;
  margin-top: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  animation: pulse 2s infinite;
}

.achievement-badge.capote { background: #d32f2f; } /* Vermelho */
.achievement-badge.bandeira { background: #7b1fa2; } /* Roxo */
.achievement-badge.sofreu-bandeira { background: #424242; }

.result-actions {
  padding: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  background: #f5f5f5;
}

.btn-primary, .btn-secondary {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}

.btn-primary { background: #2e7d32; color: white; flex: 2; }
.btn-secondary { background: #cfd8dc; color: #333; flex: 1; }

.btn-primary:hover { transform: scale(1.05); background: #1b5e20; }
.btn-secondary:hover { transform: scale(1.05); }


/* =========================================
   UI DO JOGO
   ========================================= */
.avatar-group, .player-info-row {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
}

.marks-container {
  display: flex; gap: 6px; background: rgba(0,0,0,0.3);
  padding: 5px 10px; border-radius: 10px; margin-bottom: 5px;
}

.mark-dot {
  width: 12px; height: 12px; border-radius: 50%;
  background-color: #1b5e20; border: 1px solid #81c784;
  box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5);
  transition: all 0.3s ease;
}

.mark-dot.filled {
  background-color: #ffeb3b; border-color: #fff;
  box-shadow: 0 0 5px #ffeb3b; transform: scale(1.2);
}

.bot-area, .player-area {
  padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px;
}

.table-area {
  flex: 1; background: rgba(0, 0, 0, 0.1);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  position: relative;
}

.small-card { width: 50px; height: 75px; }
.mini-card { width:60px; height:85px; }

.player-hand, .bot-hand {
  display: flex; gap: 5px; justify-content: center; min-height: 100px;
}

.disabled { filter: grayscale(0.6); cursor: not-allowed !important; }

.played-cards {
  display: flex; gap: 40px; margin: 20px 0; min-height: 120px; align-items: flex-end;
}

.deck-pile {
  position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
}
.deck-count {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold; font-size: 1.5rem; text-shadow: 1px 1px 2px black;
  pointer-events: none;
}
.trunfo-area {
  position: absolute; top: 20px; left: 20px;
  display: flex; flex-direction: column; align-items: center;
}

.game-log {
  background: rgba(0, 0, 0, 0.6); color: white; font-weight: bold;
  padding: 8px 20px; border-radius: 20px;
  min-height: 40px; display: flex; align-items: center;
}

.score-badge { font-weight: bold; font-size: 1.1rem; }
.active-turn { color: #ffeb3b; text-shadow: 0 0 5px rgba(255, 235, 59, 0.5); }
.turn-text { font-size: 0.9rem; margin-left: 5px; }

/* MEDIA QUERIES */
@media (max-width: 600px) {
  .small-card{ width: 35px; height: 55px; }
  .mini-card{ width: 45px; height: 65px; }
  .played-cards { gap: 15px; margin: 10px 0; min-height: 90px; }
  .deck-pile { right: 10px; top: 55%; }
  .trunfo-area { top: 10px; left: 10px; }
  .mark-dot { width: 10px; height: 10px; }
  .result-card { width: 95%; }
}

/* ANIMAÇÕES */
.hand-anim-move, .hand-anim-enter-active, .hand-anim-leave-active { transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1); }
.hand-anim-enter-from { opacity: 0; transform: translateY(30px) scale(0.9); }
.hand-anim-leave-to { opacity: 0; transform: translateY(-50px) scale(0.5); }
.hand-anim-leave-active { position: relative; }
.table-anim-enter-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.table-anim-enter-from { opacity: 0; transform: scale(0.5) translateY(50px); }

.waiting-overlay { background: rgba(46, 125, 50, 0.98) !important; z-index: 200; }
.waiting-box {
  background: white; padding: 40px; border-radius: 16px;
  text-align: center; color: #333;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
.pop-enter-active, .pop-leave-active { transition: all 0.4s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.9); }
.spinner { font-size: 3rem; margin-bottom: 20px; display: inline-block; animation: spin 2s infinite linear; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
