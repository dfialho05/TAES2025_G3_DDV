<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useBiscaStore } from '@/stores/biscaStore'; // Verifica se o caminho está certo
import { storeToRefs } from 'pinia';

const store = useBiscaStore();
// Extrair refs para usar no template
const {
  playerHand, botCardCount, trunfo, tableCards,
  score, logs, currentTurn, isGameOver, isConnected, cardsLeft,
} = storeToRefs(store);

onMounted(() => {
  store.connect();
});

onUnmounted(() => {
  store.disconnect();
});
</script>

<template>
  <div class="game-container">

    <div v-if="!isConnected" class="overlay">
      <h2>A ligar ao servidor...</h2>
      <p>Certifica-te que o backend está a correr na porta 3000</p>
    </div>

    <div class="bot-area">
      <div class="avatar">🤖 Bot</div>
      <div class="bot-hand">
        <div v-for="n in botCardCount" :key="n" class="card-back"></div>
      </div>
      <div class="score-badge">Pontos: {{ score.bot }}</div>
    </div>

    <div class="table-area">

      <div v-if="cardsLeft > 0" class="card-back deck-pile">
          <span class="deck-count">{{ cardsLeft }}</span>
        </div>

      <div class="trunfo-area" v-if="trunfo">
        <span>Trunfo:</span>
        <div class="mini-card" :class="trunfo.color" style="color: green; font-weight: 900; font-size: 1.3rem;">
          {{ trunfo.rank }}{{ trunfo.naipe }}
        </div>
      </div>

      <div class="played-cards">
        <div v-for="move in tableCards" :key="move.player" class="move-wrapper">
          <div class="card" :class="move.card.color">
            <span class="rank-top">{{ move.card.rank }}</span>
            <span class="suit">{{ move.card.naipe }}</span>
            <span class="rank-bottom">{{ move.card.rank }}</span>
          </div>
          <span class="label">{{ move.player === 'user' ? 'Tu' : 'Bot' }}</span>
        </div>
      </div>

      <div class="game-log">{{ logs }}</div>

      <button v-if="isGameOver" @click="store.startGame()" class="restart-btn">
        Jogar Novamente
      </button>
    </div>

    <div class="player-area">
      <div class="score-badge" :class="{ 'active-turn': currentTurn === 'user' }">
        Teus Pontos: {{ score.user }}
        <span v-if="currentTurn === 'user'" class="turn-text">(Sua vez!)</span>
      </div>

      <div class="player-hand">
        <div
          v-for="(card, index) in playerHand"
          :key="card.id"
          class="card interactable"
          :class="[card.color, { 'disabled': currentTurn !== 'user' }]"
          @click="store.playCard(index)"
        >
          <span class="rank-top">{{ card.rank }}</span>
          <span class="suit">{{ card.naipe }}</span>
          <span class="rank-bottom">{{ card.rank }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* CONTAINER GERAL */
.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #2e7d32; /* Verde Mesa */
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* ÁREAS */
.bot-area, .player-area {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.table-area {
  flex: 1;
  background: rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* CARTAS */
.card {
  width: 70px;
  height: 100px;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  font-weight: bold;
  font-size: 1.2rem;
  user-select: none;
  position: relative;
}

.card.red { color: #d32f2f; }
.card.black { color: #212121; }
.card .suit { align-self: center; font-size: 2rem; }
.rank-bottom { transform: rotate(180deg); }

.card-back {
  width: 50px;
  height: 75px;
  background: repeating-linear-gradient(45deg, #1565c0, #1565c0 10px, #0d47a1 10px, #0d47a1 20px);
  border-radius: 5px;
  border: 2px solid white;
}

/* MÃOS */
.player-hand, .bot-hand {
  display: flex;
  gap: -10px; /* Efeito de leque simples */
  justify-content: center;
}
.player-hand { gap: 5px; }

.interactable { cursor: pointer; transition: transform 0.2s; }
.interactable:hover { transform: translateY(-15px); z-index: 10; }
.interactable.disabled { filter: grayscale(0.6); cursor: not-allowed; transform: none; }

/* MESA */
.played-cards {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}
.move-wrapper { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.label { font-size: 0.8rem; opacity: 0.8; }

.trunfo-area {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.3);
  padding: 5px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.mini-card {
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.mini-card.red { color: red; }

/* UI */
.game-log {
  background: rgba(0,0,0,0.6);
  color: white;
  font-weight: 900;
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

.score-badge { font-weight: bold; font-size: 1.1rem; }
.active-turn { color: #ffeb3b; text-shadow: 0 0 5px rgba(255,235,59,0.5); }
.turn-text { font-size: 0.9rem; margin-left: 5px; }
</style>
