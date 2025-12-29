<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBiscaStore } from '@/stores/biscaStore'
import { useSocketStore } from '@/stores/socket'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const biscaStore = useBiscaStore()
const socketStore = useSocketStore()
const authStore = useAuthStore()

// Extraímos gameID e availableGames para serem reativos
const { availableGames, gameID, logs } = storeToRefs(biscaStore)

onMounted(() => {
  console.log('Lobby Montado')

  // Se não estiver conectado, força conexão
  if (!socketStore.isConnected) {
    socketStore.handleConnection(true) // true = permite anónimo se necessário
  }

  // Pedir lista de jogos
  socketStore.emitGetGames()
  console.log('Lista de jogos pedida.')
})

// --- ALTERAÇÃO AQUI ---
// Agora aceita o numero de vitórias (targetWins)
const create = (tipoJogo, targetWins = 1) => {
  const modeName = targetWins > 1 ? 'Match' : 'Jogo Rápido'
  console.log(`Criar ${modeName}: Tipo ${tipoJogo}, Wins ${targetWins}`)

  // Argumentos: (tipo, modo, wins, isPractice)
  biscaStore.startGame(tipoJogo, 'multiplayer', targetWins, false)
}

// Entrar Jogo (Player 2)
const join = (id) => {
  console.log('Cliquei em Entrar no jogo', id)
  biscaStore.joinGame(id)
}

// --- REDIRECIONAMENTO ---
watch(gameID, (newID) => {
  console.log('O gameID mudou para:', newID)
  if (newID) {
    console.log('Jogo detetado! Redirecionando para a mesa...')
    router.push('/games/singleplayer')
  }
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="lobby-wrapper">
    <div class="background-overlay"></div>

    <div class="lobby-container">
      <header class="lobby-header">
        <button @click="goHome" class="btn-back"><span class="icon">-</span> Voltar</button>
        <div class="title-group">
          <h1>Lobby Multiplayer</h1>
          <span class="subtitle">Desafia jogadores em tempo real</span>
        </div>
        <div class="placeholder"></div>
      </header>

      <section class="action-area-wrapper">
        <div class="action-column">
          <h3 class="column-title">Jogo Rápido <small>(1 Vitória)</small></h3>
          <div class="buttons-grid">
            <button @click="create(3, 1)" class="btn-create btn-green">
              <div class="icon-wrapper">🃏</div>
              <div class="text-wrapper">
                <span class="btn-title">Bisca de 3</span>
                <span class="btn-desc">Partida Única</span>
              </div>
            </button>

            <button @click="create(9, 1)" class="btn-create btn-green">
              <div class="icon-wrapper">🃏</div>
              <div class="text-wrapper">
                <span class="btn-title">Bisca de 9</span>
                <span class="btn-desc">Partida Única</span>
              </div>
            </button>
          </div>
        </div>

        <div class="action-column">
          <h3 class="column-title gold-text">MATCH <small>(4 Vitórias)</small></h3>
          <div class="buttons-grid">
            <button @click="create(3, 4)" class="btn-create btn-gold">
              <div class="icon-wrapper">🃏</div>
              <div class="text-wrapper">
                <span class="btn-title">Match de 3</span>
                <span class="btn-desc">Ganha quem tiver 4 vitórias</span>
              </div>
            </button>

            <button @click="create(9, 4)" class="btn-create btn-gold">
              <div class="icon-wrapper">🃏</div>
              <div class="text-wrapper">
                <span class="btn-title">Match de 9</span>
                <span class="btn-desc">Ganha quem tiver 4 vitórias</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <section class="games-area">
        <h2 class="section-title">Salas Disponíveis</h2>

        <div v-if="availableGames.length === 0" class="empty-state">
          <div v-if="!socketStore.isConnected" class="loading-pulse">
            <span class="spinner"></span> A ligar ao servidor...
          </div>
          <div v-else class="empty-content">
            <span class="ghost-icon"></span>
            <p>Nenhuma sala aberta no momento.</p>
            <small>Sê o primeiro a criar um jogo!</small>
          </div>
        </div>

        <transition-group name="list" tag="div" class="games-list">
          <div v-for="game in availableGames" :key="game.id" class="game-card">
            <div class="card-left">
              <div class="game-avatar">
                {{ game.creator ? game.creator.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="game-info">
                <span class="game-host">Sala de {{ game.creator || 'Anónimo' }}</span>
                <div class="badges">
                  <span class="badge id-badge">#{{ game.id }}</span>
                  <span class="badge type-badge">{{ game.type }}</span>
                </div>
              </div>
            </div>

            <button @click="join(game.id)" class="btn-join">
              Entrar <span class="arrow">-></span>
            </button>
          </div>
        </transition-group>
      </section>
    </div>

    <footer class="status-bar">
      <div class="status-item">
        <span class="indicator" :class="{ online: socketStore.isConnected }"></span>
        {{ socketStore.isConnected ? 'Conectado' : 'A ligar...' }}
      </div>
      <div class="status-divider">|</div>
      <div class="status-item">
        User: {{ authStore.currentUser ? authStore.currentUser.id : 'Visitante' }}
      </div>
      <div class="status-divider">|</div>
      <div class="status-item logs">{{ logs }}</div>
    </footer>
  </div>
</template>

<style scoped>
/* ================= LAYOUT & FUNDO ================= */
.lobby-wrapper {
  min-height: 100vh;
  width: 100%;
  position: relative;
  background: radial-gradient(circle at top, #1e4d3b, #0f2920);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: white;
  overflow-x: hidden;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.lobby-container {
  max-width: 1000px; /* Aumentei um pouco para caber as 2 colunas */
  margin: 0 auto;
  padding: 2rem 1rem;
  position: relative;
  z-index: 10;
}

/* ================= HEADER ================= */
.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-3px);
}

.title-group {
  text-align: center;
}

.title-group h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(to right, #ffffff, #a7f3d0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.subtitle {
  color: #6ee7b7;
  font-size: 0.9rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.placeholder {
  width: 80px;
}

/* ================= ACTIONS ================= */
.action-area-wrapper {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.action-column {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.column-title {
  text-align: center;
  margin: 0;
  font-size: 1.1rem;
  color: #a7f3d0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.column-title small {
  font-size: 0.7rem;
  opacity: 0.8;
  display: block;
  text-transform: none;
}

.column-title.gold-text {
  color: #fcd34d;
}

.buttons-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn-create {
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* Estilo Verde (Jogo Rápido) */
.btn-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}
.btn-green:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 25px rgba(16, 185, 129, 0.4);
}

/* Estilo Dourado (Match) */
.btn-gold {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.btn-gold:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 25px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%);
}

.icon-wrapper {
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.2);
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-wrapper {
  text-align: left;
  flex: 1;
}

.btn-title {
  display: block;
  font-size: 1.1rem;
  font-weight: bold;
}

.btn-desc {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
}

/* ================= LIST AREA ================= */
.games-area {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 300px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: #d1fae5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
}

.ghost-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.loading-pulse {
  font-style: italic;
  color: #6ee7b7;
}

.spinner {
  display: inline-block;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Cards List */
.games-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.game-card:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-avatar {
  width: 45px;
  height: 45px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-host {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.id-badge {
  background: #e5e7eb;
  color: #4b5563;
}

.type-badge {
  background: #dbeafe;
  color: #2563eb;
}

.btn-join {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-join:hover {
  background: #1d4ed8;
}

.btn-join .arrow {
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.btn-join:hover .arrow {
  transform: translateX(3px);
}

/* ================= STATUS BAR ================= */
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-family: monospace;
  z-index: 100;
}

.indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  margin-right: 5px;
}

.indicator.online {
  background: #10b981;
  box-shadow: 0 0 5px #10b981;
}

.status-divider {
  color: #4b5563;
}
.logs {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .action-area-wrapper {
    flex-direction: column;
    gap: 1rem;
  }
  .lobby-header {
    flex-direction: column;
    gap: 1rem;
  }
  .title-group h1 {
    font-size: 2rem;
  }
  .game-card {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .btn-join {
    width: 100%;
    justify-content: center;
  }
  .placeholder {
    display: none;
  }
}
</style>
