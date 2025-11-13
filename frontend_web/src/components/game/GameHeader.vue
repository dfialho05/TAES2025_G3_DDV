<template>
  <div class="game-header">
    <div class="container mx-auto flex items-center justify-between">
      <!-- Game Info -->
      <div class="game-info">
        <p class="game-mode">{{ gameMode }}</p>
        <p class="game-title">{{ gameTitle }}</p>
      </div>

      <!-- Score Display -->
      <div class="score-display">
        <div class="score-item">
          <p class="score-value">{{ scores.opponent }}</p>
          <p class="score-label">{{ opponentLabel }}</p>
        </div>

        <div class="timer-display" v-if="showTimer">
          <p class="timer-label">{{ timerLabel }}</p>
          <p class="timer-value">{{ formattedTime }}</p>
        </div>

        <div class="score-item">
          <p class="score-value">{{ scores.player }}</p>
          <p class="score-label">{{ playerLabel }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          v-if="showPauseButton"
          @click="$emit('pause')"
          class="action-btn pause-btn"
          :disabled="!canPause"
        >
          <span v-if="!isPaused" class="btn-icon">⏸</span>
          <span v-else class="btn-icon">▶</span>
          <span class="btn-text">{{ isPaused ? 'Continuar' : 'Pausar' }}</span>
        </button>

        <button
          v-if="showRestartButton"
          @click="$emit('restart')"
          class="action-btn restart-btn"
          :disabled="isLoading"
        >
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Reiniciar</span>
        </button>

        <button @click="$emit('exit')" class="action-btn exit-btn">
          <span class="btn-icon">✕</span>
          <span class="btn-text">Sair</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameHeader',
  props: {
    gameMode: {
      type: String,
      default: 'Bisca de 3 - Single Player',
    },
    gameTitle: {
      type: String,
      default: 'Você vs Bot',
    },
    scores: {
      type: Object,
      default: () => ({ player: 0, opponent: 0 }),
    },
    playerLabel: {
      type: String,
      default: 'Você',
    },
    opponentLabel: {
      type: String,
      default: 'Bot',
    },
    gameTime: {
      type: Number,
      default: 0,
    },
    showTimer: {
      type: Boolean,
      default: true,
    },
    timerLabel: {
      type: String,
      default: 'Tempo',
    },
    showPauseButton: {
      type: Boolean,
      default: true,
    },
    showRestartButton: {
      type: Boolean,
      default: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    canPause: {
      type: Boolean,
      default: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['pause', 'restart', 'exit'],
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.gameTime / 60)
      const seconds = this.gameTime % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
  },
}
</script>

<style scoped>
.game-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(4px);
  padding: 0.5rem;
  z-index: 10;
}

.game-info {
  color: white;
}

.game-mode {
  font-size: 0.75rem;
  opacity: 0.75;
}

.game-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.score-item {
  text-align: center;
}

.score-value {
  font-size: 1.125rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.75rem;
  opacity: 0.75;
}

.timer-display {
  padding: 0.25rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  text-align: center;
}

.timer-label {
  font-size: 0.75rem;
  opacity: 0.75;
}

.timer-value {
  font-size: 0.875rem;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.pause-btn {
  background-color: #d97706;
  color: white;
}

.pause-btn:hover {
  background-color: #b45309;
}

.pause-btn:disabled {
  background-color: #fbbf24;
  cursor: not-allowed;
  opacity: 0.5;
}

.restart-btn {
  background-color: #2563eb;
  color: white;
}

.restart-btn:hover {
  background-color: #1d4ed8;
}

.restart-btn:disabled {
  background-color: #60a5fa;
  cursor: not-allowed;
  opacity: 0.5;
}

.exit-btn {
  background-color: #dc2626;
  color: white;
}

.exit-btn:hover {
  background-color: #b91c1c;
}

.btn-icon {
  font-size: 0.875rem;
}

.btn-text {
  display: none;
}

/* Desktop optimizations */
@media (min-width: 768px) {
  .game-header {
    padding: 0.75rem;
  }

  .game-mode {
    font-size: 0.875rem;
  }

  .game-title {
    font-size: 1rem;
  }

  .score-display {
    gap: 1rem;
  }

  .score-value {
    font-size: 1.5rem;
  }

  .timer-display {
    padding: 0.5rem 1rem;
  }

  .timer-label {
    font-size: 0.875rem;
  }

  .timer-value {
    font-size: 1.25rem;
  }

  .action-btn {
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
  }

  .btn-icon {
    font-size: 1rem;
  }

  .btn-text {
    display: inline;
  }
}

/* Large desktop optimizations */
@media (min-width: 1024px) {
  .score-display {
    gap: 1.5rem;
  }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .score-display {
    gap: 0.25rem;
  }

  .action-buttons {
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
  }

  .timer-display {
    padding: 0.25rem 0.375rem;
  }
}

/* Compact header for very small screens */
@media (max-width: 480px) {
  .game-info .game-mode {
    display: none;
  }

  .timer-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
