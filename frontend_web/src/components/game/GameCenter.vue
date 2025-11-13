<template>
  <div class="game-center">
    <div class="center-grid">
      <!-- Deck & Trump Area -->
      <div class="deck-trump-area">
        <div class="deck-trump-container">
          <!-- Deck -->
          <div class="deck-section">
            <BiscaCard
              :suit="deckCardSuit"
              :value="deckCardValue"
              :visible="false"
              :size="centerCardSize"
              class="deck-card"
            />
            <p class="section-label">{{ deckLabel }}</p>
            <p v-if="showDeckCount" class="deck-count">{{ deckCount }} cartas</p>
          </div>

          <!-- Trump Card -->
          <div class="trump-section">
            <BiscaCard
              v-if="trumpCard"
              :suit="trumpCard.suit"
              :value="trumpCard.value"
              :visible="true"
              :size="centerCardSize"
              class="trump-card"
            />
            <div v-else class="trump-placeholder">
              <span class="placeholder-text">Sem Trunfo</span>
            </div>
            <p class="section-label">
              {{ trumpLabel }}: {{ trumpCard ? getSuitSymbol(trumpCard.suit) : '?' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Played Cards Area -->
      <div class="played-cards-area">
        <div class="played-cards-container">
          <!-- Bot's played card -->
          <div class="played-card-section">
            <BiscaCard
              v-if="playedCards.opponent"
              :suit="playedCards.opponent.suit"
              :value="playedCards.opponent.value"
              :visible="true"
              :size="centerCardSize"
              class="opponent-card"
            />
            <div v-else class="card-placeholder">
              <span class="placeholder-text">{{ opponentLabel }}</span>
            </div>
            <p class="card-label">{{ opponentLabel }}</p>
          </div>

          <!-- Player's played card -->
          <div class="played-card-section">
            <BiscaCard
              v-if="playedCards.player"
              :suit="playedCards.player.suit"
              :value="playedCards.player.value"
              :visible="true"
              :size="centerCardSize"
              class="player-card"
            />
            <div v-else class="card-placeholder">
              <span class="placeholder-text">{{ playerLabel }}</span>
            </div>
            <p class="card-label">{{ playerLabel }}</p>
          </div>
        </div>
      </div>

      <!-- Score/Info Area -->
      <div class="score-info-area">
        <div class="score-panel">
          <h3 class="panel-title">{{ scorePanelTitle }}</h3>
          <div class="scores-grid">
            <div class="score-item">
              <span class="score-label">{{ opponentLabel }}:</span>
              <span class="score-value">{{ scores.opponent }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">{{ playerLabel }}:</span>
              <span class="score-value">{{ scores.player }}</span>
            </div>
          </div>

          <div v-if="showGameInfo" class="game-info-section">
            <div class="info-item">
              <span class="info-label">Cartas restantes:</span>
              <span class="info-value">{{ deckCount }}</span>
            </div>
            <div v-if="currentRound" class="info-item">
              <span class="info-label">Rodada:</span>
              <span class="info-value">{{ currentRound }}</span>
            </div>
          </div>

          <!-- Round Winner Indicator -->
          <div v-if="roundWinner" class="round-winner">
            <p class="winner-text">
              🏆 {{ roundWinner === 'player' ? playerLabel : opponentLabel }} venceu!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BiscaCard from '../ui/BiscaCard.vue'
import { getSuitSymbol } from '../../utils/cardUtils.js'

export default {
  name: 'GameCenter',
  components: {
    BiscaCard,
  },
  props: {
    trumpCard: {
      type: Object,
      default: null,
    },
    playedCards: {
      type: Object,
      default: () => ({ player: null, opponent: null }),
    },
    scores: {
      type: Object,
      default: () => ({ player: 0, opponent: 0 }),
    },
    deckCount: {
      type: Number,
      default: 0,
    },
    centerCardSize: {
      type: String,
      default: 'xlarge',
    },
    playerLabel: {
      type: String,
      default: 'Você',
    },
    opponentLabel: {
      type: String,
      default: 'Bot',
    },
    deckLabel: {
      type: String,
      default: 'Deck',
    },
    trumpLabel: {
      type: String,
      default: 'Trunfo',
    },
    scorePanelTitle: {
      type: String,
      default: 'Pontuação',
    },
    showDeckCount: {
      type: Boolean,
      default: true,
    },
    showGameInfo: {
      type: Boolean,
      default: true,
    },
    currentRound: {
      type: Number,
      default: null,
    },
    roundWinner: {
      type: String,
      default: null,
    },
    deckCardSuit: {
      type: String,
      default: 'c',
    },
    deckCardValue: {
      type: Number,
      default: 1,
    },
  },
  methods: {
    getSuitSymbol,
  },
}
</script>

<style scoped>
.game-center {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.center-grid {
  width: 100%;
  max-width: 80rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: center;
}

/* Deck & Trump Area */
.deck-trump-area {
  display: flex;
  justify-content: center;
  order: 2;
}

.deck-trump-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.deck-section,
.trump-section {
  text-align: center;
}

.deck-card,
.trump-card {
  margin-bottom: 0.5rem;
}

.trump-placeholder {
  background-color: rgba(209, 213, 219, 0.2);
  border: 2px dashed rgba(156, 163, 175, 0.5);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  width: 120px;
  height: 168px;
}

.section-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.deck-count {
  color: white;
  font-size: 0.75rem;
  opacity: 0.75;
  margin-top: 0.25rem;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Played Cards Area */
.played-cards-area {
  display: flex;
  justify-content: center;
  order: 1;
}

.played-cards-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.played-card-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-placeholder {
  background-color: rgba(229, 231, 235, 0.2);
  border: 2px dashed rgba(209, 213, 219, 0.5);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
  width: 120px;
  height: 168px;
}

.card-label {
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
}

.opponent-card,
.player-card {
  margin-bottom: 0.25rem;
}

/* Score/Info Area */
.score-info-area {
  display: flex;
  justify-content: center;
  order: 3;
}

.score-panel {
  color: white;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.scores-grid {
  margin-bottom: 0.75rem;
}

.scores-grid > * + * {
  margin-top: 0.25rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-label {
  font-size: 0.75rem;
}

.score-value {
  font-size: 0.875rem;
  font-weight: 700;
}

.game-info-section {
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.game-info-section > * + * {
  margin-top: 0.25rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.75rem;
  opacity: 0.75;
}

.info-value {
  font-size: 0.75rem;
  font-family: monospace;
}

.round-winner {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(245, 158, 11, 0.2);
  border-radius: 0.25rem;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.winner-text {
  color: #fde68a;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Desktop optimizations */
@media (min-width: 768px) {
  .game-center {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .center-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .deck-trump-area {
    order: 1;
  }

  .played-cards-area {
    order: 2;
  }

  .deck-trump-container {
    gap: 1.5rem;
  }

  .played-cards-container {
    gap: 1rem;
  }

  .deck-card,
  .trump-card {
    margin-bottom: 0.75rem;
  }

  .section-label {
    font-size: 0.875rem;
  }

  .card-placeholder,
  .opponent-card,
  .player-card {
    margin-bottom: 0.5rem;
  }

  .score-panel {
    padding: 1rem;
  }

  .panel-title {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
  }

  .scores-grid > * + * {
    margin-top: 0.5rem;
  }

  .score-label {
    font-size: 0.875rem;
  }

  .score-value {
    font-size: 1.125rem;
  }

  .game-info-section {
    padding-top: 0.75rem;
  }
}

/* Large desktop optimizations */
@media (min-width: 1024px) {
  .center-grid {
    gap: 2rem;
  }

  .deck-trump-container {
    gap: 2rem;
  }

  .played-cards-container {
    gap: 1.5rem;
  }
}

@media (min-width: 1280px) {
  .center-grid {
    gap: 3rem;
  }

  .deck-trump-container {
    gap: 3rem;
  }

  .played-cards-container {
    gap: 2rem;
  }
}

/* Mobile Responsive Adjustments */
@media (max-width: 767px) {
  .center-grid {
    gap: 0.75rem;
  }

  .deck-trump-container {
    gap: 0.75rem;
  }

  .played-cards-container {
    gap: 0.5rem;
  }

  .card-placeholder,
  .trump-placeholder {
    width: 100px;
    height: 140px;
  }

  .score-panel {
    padding: 0.5rem;
  }

  .deck-trump-area {
    order: 1;
  }

  .played-cards-area {
    order: 2;
  }

  .score-info-area {
    order: 3;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .center-grid {
    gap: 0.5rem;
  }

  .deck-trump-container {
    gap: 0.5rem;
  }

  .card-placeholder,
  .trump-placeholder {
    width: 80px;
    height: 112px;
  }
}

/* Landscape mobile optimization */
@media (max-width: 1024px) and (orientation: landscape) {
  .center-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .deck-trump-area {
    order: 1;
  }

  .played-cards-area {
    order: 2;
  }

  .score-info-area {
    order: 3;
  }
}
</style>
