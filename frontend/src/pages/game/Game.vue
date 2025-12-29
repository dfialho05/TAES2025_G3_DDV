<script setup>
import { onMounted, onUnmounted, computed, watch, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDeckStore } from '@/stores/deck'
import { useBiscaStore } from '@/stores/biscaStore'
import { useSocketStore } from '@/stores/socket'
import Card from '@/components/game/Card.vue'

const route = useRoute()
const router = useRouter()

const gameStore = useBiscaStore()
const deckStore = useDeckStore()
const socketStore = useSocketStore()

const {
  playerHand,
  opponentHandCount: botCardCount,
  trunfo,
  tableCards,
  opponentName,
  isWaiting,
  score,
  gameMode, // <-- Certifica-te que está aqui
  logs,
  currentTurn,
  cardsLeft,
  gameID,
  sessionScore,
  gameTarget,
  popupData,
  isGameOver,
  isRoundOver,
} = storeToRefs(gameStore)

const isConnected = computed(() => socketStore.isConnected)

// TIMER VISUAL
const timerProgress = ref(100)
let timerInterval = null

const startLocalTimer = () => {
  clearInterval(timerInterval)
  timerProgress.value = 100

  if (isGameOver.value || isRoundOver.value) return
  if (!currentTurn.value) return

  const totalTime = 20000
  const step = 100
  const decrement = 100 / (totalTime / step)

  timerInterval = setInterval(() => {
    timerProgress.value -= decrement
    if (timerProgress.value <= 0) {
      timerProgress.value = 0
      clearInterval(timerInterval)
    }
  }, step)
}

watch([currentTurn, tableCards], () => {
  setTimeout(startLocalTimer, 50)
})

// URL SYNC - A MÁGICA ACONTECE AQUI
watch(
  [gameID, gameTarget, gameMode],
  ([newId, newTarget, newMode]) => {
    if (newId) {
      const currentId = route.query.id
      const currentWins = route.query.wins
      const currentMode = route.query.mode

      // Verifica se precisa atualizar o URL
      if (
        String(currentId) !== String(newId) ||
        String(currentWins) !== String(newTarget) ||
        String(currentMode) !== String(newMode)
      ) {
        console.log(`🔗 Atualizar URL: ID=${newId}, Wins=${newTarget}, Mode=${newMode}`)
        router.replace({
          query: {
            ...route.query,
            id: newId,
            wins: newTarget,
            mode: newMode,
          },
        })
      }
    }
  },
  { immediate: true }, // Garante execução imediata
)

// SCROLL LOGIC
const playerHandRef = ref(null)
const showLeftScroll = ref(false)
const showRightScroll = ref(false)

const checkScrollIndicators = () => {
  if (!playerHandRef.value) return
  const element = playerHandRef.value
  const scrollLeft = element.scrollLeft
  const scrollWidth = element.scrollWidth
  const clientWidth = element.clientWidth
  showLeftScroll.value = scrollLeft > 0
  showRightScroll.value = scrollLeft < scrollWidth - clientWidth
}

watch(playerHand, async () => {
  await nextTick()
  checkScrollIndicators()
})

const scrollLeft = () => {
  if (playerHandRef.value) playerHandRef.value.scrollBy({ left: -60, behavior: 'smooth' })
}

const scrollRight = () => {
  if (playerHandRef.value) playerHandRef.value.scrollBy({ left: 60, behavior: 'smooth' })
}

// SETUP
onMounted(async () => {
  const isPractice = route.query.practice === 'true'
  socketStore.handleConnection(isPractice)

  if (deckStore.decks.length === 0) await deckStore.fetchDecks()

  // 1. Criar novo jogo (vem do Lobby com mode+wins)
  if (route.query.mode && route.query.wins && !route.query.id) {
    const cards = parseInt(route.query.mode)
    const targetWins = parseInt(route.query.wins) || 1

    if (!gameID.value) {
      setTimeout(() => {
        gameStore.startGame(cards, 'singleplayer', targetWins, isPractice)
      }, 500)
    }
  }
  // 2. Entrar em jogo existente (Link partilhado ou Refresh)
  else if (route.query.id) {
    const targetId = route.query.id

    if (!socketStore.isConnected) {
      const unwatch = watch(isConnected, (connected) => {
        if (connected) {
          gameStore.joinGame(targetId)
          unwatch()
        }
      })
    } else {
      if (gameID.value !== targetId) {
        gameStore.joinGame(targetId)
      }
    }
  } else if (!gameID.value) {
    router.push('/games/lobby')
  }
})

watch(gameID, (newVal) => {
  if (!newVal) console.log('Jogo terminado ou saiu.')
})

onUnmounted(() => {
  clearInterval(timerInterval)
  if (gameID.value) gameStore.quitGame()
})

const handleNextRound = () => gameStore.closeRoundPopup()

const handleRestart = () => {
  const isPractice = route.query.practice === 'true'
  gameStore.startGame(route.query.mode || 3, 'singleplayer', route.query.wins || 1, isPractice)
}

const handleExit = () => {
  gameStore.quitGame()
  router.push('/')
}
</script>

<template>
  <div class="game-container">
    <div v-if="isWaiting" class="overlay waiting-overlay">
      <div class="waiting-box">
        <div class="spinner">🔄</div>
        <h2>A preparar Jogo...</h2>
      </div>
    </div>

    <div v-if="!isConnected" class="overlay">
      <h2>A ligar ao servidor...</h2>
    </div>

    <Transition name="pop">
      <div v-if="popupData" class="overlay result-overlay">
        <div
          class="result-card"
          :class="{ 'win-card': popupData.isWin, 'lose-card': !popupData.isWin }"
        >
          <div class="result-header">
            <h1>{{ popupData.title }}</h1>
            <div class="stars" v-if="popupData.isWin">WIN</div>
            <div class="stars" v-else>LOSS</div>
          </div>

          <div class="result-body">
            <div class="match-score" v-if="gameTarget > 1">
              <p>PLACAR GERAL</p>
              <div class="big-score">{{ popupData.sessionResult }}</div>
            </div>

            <hr v-if="gameTarget > 1" />

            <div class="hand-details">
              <p>Pontos desta Mão:</p>
              <div class="round-points-display">{{ popupData.finalScore }}</div>

              <div
                v-if="popupData.achievement"
                class="achievement-badge"
                :class="popupData.achievement.toLowerCase().replace(' ', '-')"
              >
                {{ popupData.achievement }}
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button v-if="!popupData.isMatchEnd" @click="handleNextRound" class="btn-primary">
              Próxima Ronda ->
            </button>

            <template v-else>
              <button @click="handleExit" class="btn-secondary">Sair</button>
              <button @click="handleRestart" class="btn-primary">Jogar Novamente</button>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <div class="bot-area">
      <div class="avatar-group">
        <div class="avatar">🤖 {{ opponentName }}</div>

        <div class="marks-container" v-if="gameTarget > 1">
          <div
            v-for="n in gameTarget"
            :key="n"
            class="mark-dot"
            :class="{ filled: n <= sessionScore.opponent }"
          ></div>
        </div>
      </div>

      <div class="bot-hand-container">
        <div class="bot-hand">
          <Card v-for="n in botCardCount" :key="n" :face-down="true" class="small-card" />
        </div>
      </div>

      <div class="score-badge">Pontos: {{ score.opponent }}</div>
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
        </div>
      </TransitionGroup>

      <div class="game-log">
        <div class="game-log-text">{{ logs }}</div>
      </div>
    </div>

    <div class="player-area">
      <div class="player-info-row">
        <div class="marks-container" v-if="gameTarget > 1">
          <div
            v-for="n in gameTarget"
            :key="n"
            class="mark-dot"
            :class="{ filled: n <= sessionScore.me }"
          ></div>
        </div>

        <div class="score-badge" :class="{ 'active-turn': currentTurn === 'user' }">
          Teus Pontos: {{ score.me }}
          <span v-if="currentTurn === 'user'" class="turn-text">(Sua vez!)</span>
        </div>

        <div class="timer-bar-container" v-if="!isGameOver && !isRoundOver">
          <div
            class="timer-bar"
            :style="{
              width: timerProgress + '%',
              backgroundColor: timerProgress < 30 ? '#ef4444' : '#fbbf24',
            }"
          ></div>
        </div>
      </div>

      <div class="player-hand-container">
        <TransitionGroup
          name="hand-anim"
          tag="div"
          class="player-hand"
          ref="playerHandRef"
          @scroll="checkScrollIndicators"
        >
          <Card
            v-for="(card, index) in playerHand"
            :key="card.id"
            :card="card"
            :interactable="currentTurn === 'user' && tableCards.length < 2"
            :class="{ disabled: currentTurn !== 'user' || tableCards.length >= 2 }"
            @click="gameStore.playCard(index)"
          />
        </TransitionGroup>
        <div class="scroll-indicator left" v-show="showLeftScroll" @click="scrollLeft">‹</div>
        <div class="scroll-indicator right" v-show="showRightScroll" @click="scrollRight">›</div>
      </div>
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

/* TIMER BAR STYLES */
.timer-bar-container {
  width: 100%;
  max-width: 300px;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  margin-top: 5px;
  border-radius: 3px;
  overflow: hidden;
}

.timer-bar {
  height: 100%;
  background-color: #fbbf24;
  transition:
    width 0.1s linear,
    background-color 0.3s;
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

/* =========================================
   POPUP DE RESULTADO
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
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  text-align: center;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.result-header {
  padding: 20px;
  color: white;
}
.win-card .result-header {
  background: linear-gradient(135deg, #fbc02d, #f57f17);
}
.lose-card .result-header {
  background: linear-gradient(135deg, #546e7a, #37474f);
}
.result-header h1 {
  margin: 0;
  font-size: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}
.result-body {
  padding: 20px;
}
.big-score {
  font-size: 3rem;
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
.hand-details p {
  font-size: 1rem;
  margin-top: 10px;
  color: #555;
}
.round-points-display {
  font-size: 2.2rem;
  font-weight: bold;
  color: #2e7d32;
  margin: 5px 0 15px 0;
}

/* Badge de Conquistas */
.achievement-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 50px;
  font-weight: bold;
  color: white;
  margin-top: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}
.achievement-badge.capote {
  background: #d32f2f;
}
.achievement-badge.bandeira {
  background: #7b1fa2;
}
.achievement-badge.risca {
  background: #1976d2;
}
.achievement-badge.sofreu-bandeira,
.achievement-badge.levou-capote {
  background: #424242;
}

.result-actions {
  padding: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  background: #f5f5f5;
}
.btn-primary,
.btn-secondary {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s;
}
.btn-primary {
  background: #2e7d32;
  color: white;
  flex: 2;
}
.btn-secondary {
  background: #cfd8dc;
  color: #333;
  flex: 1;
}
.btn-primary:hover {
  transform: scale(1.05);
  background: #1b5e20;
}
.btn-secondary:hover {
  transform: scale(1.05);
}

/* =========================================
   UI DO JOGO
   ========================================= */
.avatar-group,
.player-info-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.avatar {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px black;
}
.marks-container {
  display: flex;
  gap: 6px;
  background: rgba(0, 0, 0, 0.3);
  padding: 5px 10px;
  border-radius: 10px;
  margin-bottom: 5px;
}
.mark-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1b5e20;
  border: 1px solid #81c784;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}
.mark-dot.filled {
  background-color: #ffeb3b;
  border-color: #fff;
  box-shadow: 0 0 5px #ffeb3b;
  transform: scale(1.2);
}
.bot-area,
.player-area {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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
.small-card {
  width: 50px;
  height: 75px;
}
.mini-card {
  width: 60px;
  height: 85px;
}
.player-hand,
.bot-hand-container {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.bot-hand {
  display: flex;
  gap: 5px;
  justify-content: center;
  min-height: 100px;
  flex-wrap: nowrap;
  align-items: center;
  max-width: 100%;
}

.player-hand-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.player-hand {
  display: flex;
  gap: 5px;
  justify-content: center;
  min-height: 100px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scroll-behavior: smooth;
  padding: 0 10px;
}

.scroll-indicator {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  z-index: 10;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.scroll-indicator:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.9);
}

.scroll-indicator.left {
  left: 5px;
}

.scroll-indicator.right {
  right: 5px;
}
.disabled {
  filter: grayscale(0.6);
  cursor: not-allowed !important;
}

.played-cards {
  display: flex;
  gap: 40px;
  margin: 20px 0;
  min-height: 120px;
  align-items: center;
}

.move-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

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
.game-log {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 15px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 85%;
  margin: 10px auto;
  box-sizing: border-box;
}

.game-log-text {
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.3;
  white-space: pre-wrap;
  font-size: 0.9rem;
  max-width: 100%;
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

/* MEDIA QUERIES */
@media (max-width: 600px) {
  .game-container {
    height: 100vh;
    height: 100dvh; /* Use dynamic viewport height for mobile browsers */
    min-height: 600px; /* Minimum height for playability */
  }

  .small-card {
    width: 35px;
    height: 55px;
  }
  .mini-card {
    width: 45px;
    height: 65px;
  }
  .played-cards {
    gap: 15px;
    margin: 10px 0;
    min-height: 90px;
  }
  .deck-pile {
    right: 10px;
    top: 55%;
  }
  .trunfo-area {
    top: 10px;
    left: 10px;
  }
  .mark-dot {
    width: 10px;
    height: 10px;
  }
  .result-card {
    width: 95%;
  }

  /* Player area improvements for mobile */
  .player-area {
    padding: 5px;
    min-height: 110px;
    overflow: visible;
    flex-shrink: 0;
  }

  /* Player hand mobile improvements */
  .player-hand-container {
    width: 100%;
    padding: 0 5px;
  }

  .player-hand {
    gap: 2px;
    justify-content: flex-start;
    min-height: 90px;
    overflow-x: auto;
    overflow-y: visible;
    padding: 5px 30px 5px 5px;
    width: 100%;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    min-width: 0; /* Allow shrinking */
  }

  .scroll-indicator {
    width: 25px;
    height: 25px;
    font-size: 14px;
  }

  .scroll-indicator.left {
    left: 0px;
  }

  .scroll-indicator.right {
    right: 0px;
  }

  /* Custom scrollbar for webkit browsers */
  .player-hand::-webkit-scrollbar {
    height: 4px;
  }

  .player-hand::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }

  .player-hand::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .player-hand::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  /* Reduce bot area spacing */
  .bot-area {
    padding: 5px;
    gap: 4px;
  }

  .bot-hand-container {
    padding: 0 10px;
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .bot-hand-container::-webkit-scrollbar {
    display: none;
  }

  .bot-hand {
    gap: 2px;
    justify-content: flex-start;
    min-width: max-content;
    padding: 0;
  }

  /* Adjust table area for better mobile spacing */
  .table-area {
    padding: 5px;
    flex: 1;
    min-height: 200px;
  }

  .game-log {
    padding: 6px 8px;
    font-size: 0.75rem;
    min-height: 32px;
    max-width: 98%;
    margin: 8px auto;
    border-radius: 12px;
  }

  .game-log-text {
    font-size: 0.75rem;
    line-height: 1.4;
    letter-spacing: 0.2px;
  }

  /* Score badges mobile styling */
  .score-badge {
    font-size: 1rem;
    text-align: center;
  }

  .avatar {
    font-size: 1rem;
  }
}

/* Extra small screens (very small phones) */
@media (max-width: 380px) {
  .game-container {
    min-height: 550px;
  }

  .player-hand {
    gap: 1px;
    padding: 3px 25px 3px 3px;
  }

  .scroll-indicator {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }

  .table-area {
    min-height: 180px;
  }

  .played-cards {
    gap: 10px;
    min-height: 70px;
  }

  .game-log {
    padding: 4px 6px;
    font-size: 0.65rem;
    min-height: 28px;
    max-width: 99%;
    border-radius: 10px;
  }

  .game-log-text {
    font-size: 0.65rem;
    line-height: 1.5;
    letter-spacing: 0.1px;
  }

  .score-badge {
    font-size: 0.9rem;
  }

  .avatar {
    font-size: 0.9rem;
  }

  .bot-area,
  .player-area {
    padding: 3px;
    gap: 2px;
  }

  .bot-hand-container {
    padding: 0 5px;
  }

  .bot-hand {
    gap: 1px;
  }
}

/* ANIMAÇÕES */
.hand-anim-move,
.hand-anim-enter-active,
.hand-anim-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.hand-anim-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
.hand-anim-leave-to {
  opacity: 0;
  transform: translateY(-50px) scale(0.5);
}
.hand-anim-leave-active {
  position: relative;
}
.table-anim-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.table-anim-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(50px);
}
.waiting-overlay {
  background: rgba(46, 125, 50, 0.98) !important;
  z-index: 200;
}
.waiting-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  color: #333;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
.pop-enter-active,
.pop-leave-active {
  transition: all 0.4s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.spinner {
  font-size: 3rem;
  margin-bottom: 20px;
  display: inline-block;
  animation: spin 2s infinite linear;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
