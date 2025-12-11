// stores/biscaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSocketStore } from './socket'

export const useBiscaStore = defineStore('bisca', () => {
  const socketStore = useSocketStore()

  // =========================================
  // 1. ESTADO
  // =========================================
  const gameID = ref(null)
  const mySide = ref('player1')
  const opponentName = ref('Oponente')
  const isWaiting = ref(false)

  const playerHand = ref([])
  const opponentHandCount = ref(0)
  const trunfo = ref(null)
  const trunfoNaipe = ref(null)
  const tableCards = ref([])
  const cardsLeft = ref(0)

  const score = ref({ me: 0, opponent: 0 })
  const currentTurn = ref(null)
  const sessionScore = ref({ me: 0, opponent: 0 })

  // [NOVO] Para o frontend saber se desenha 1 ou 4 bolas brancas
  const gameTarget = ref(1)

  const isGameOver = ref(false)
  const logs = ref('À espera de jogo...')
  const availableGames = ref([])

  const botCardCount = computed(() => opponentHandCount.value)

  // =========================================
  // 2. LÓGICA DE DADOS
  // =========================================
  const processGameState = (data) => {
      // Proteção Fantasma
      if (gameID.value && data.id && String(data.id) !== String(gameID.value)) return;
      if (data.id) gameID.value = data.id

      // A. Gestão de Mãos e Nomes
      if (mySide.value === 'player1') {
          playerHand.value = data.player1Hand || []
          if (data.p2Name === null) {
              isWaiting.value = true
              opponentName.value = "Aguardando..."
          } else {
              isWaiting.value = false
              opponentName.value = data.p2Name
          }
          opponentHandCount.value = (data.player2Hand || []).length || data.botCardCount || 0
      } else {
          isWaiting.value = false
          opponentName.value = data.p1Name || 'Player 1'
          playerHand.value = data.player2Hand || []
          opponentHandCount.value = (data.player1Hand || []).length || 0
      }

      // B. Dados Gerais
      trunfo.value = data.trunfo
      trunfoNaipe.value = data.trunfoNaipe
      tableCards.value = data.tableCards
      cardsLeft.value = data.cardsLeft
      isGameOver.value = data.gameOver
      logs.value = data.logs

      // C. Pontuação
      const p1 = data.score.player1 || 0
      const p2 = data.score.player2 || 0
      const p1Wins = data.matchWins?.player1 || 0;
      const p2Wins = data.matchWins?.player2 || 0;

      if (mySide.value === 'player1') {
          score.value = { user: p1, bot: p2, me: p1, opponent: p2 } // mantem keys antigas por segurança
          sessionScore.value = { me: p1Wins, opponent: p2Wins }
      } else {
          score.value = { user: p2, bot: p1, me: p2, opponent: p1 }
          sessionScore.value = { me: p2Wins, opponent: p1Wins }
      }

      // D. Turno
      if (data.turn === mySide.value) currentTurn.value = 'user'
      else if (data.turn) currentTurn.value = 'bot'
      else currentTurn.value = null
  }

  const setAvailableGames = (games) => {
      availableGames.value = games
  }

  // =========================================
  // 3. AÇÕES
  // =========================================

  const fetchGames = () => { socketStore.emitGetGames() }

  // [CORREÇÃO AQUI] Adicionado 'targetWins'
  const startGame = (type = 3, mode = 'singleplayer', targetWins = 1) => {
      mySide.value = 'player1'
      logs.value = "A criar sala..."
      isGameOver.value = false
      gameTarget.value = targetWins // Guardamos localmente para usar no template

      // Enviamos os 3 argumentos para o socket
      socketStore.emitCreateGame(type, mode, targetWins)
  }

  const joinGame = (id) => {
      mySide.value = 'player2'
      logs.value = "A entrar..."
      socketStore.emitJoinGame(id)
  }

  const playCard = (index) => {
    if (currentTurn.value === 'user' && gameID.value) {
        socketStore.emitPlayCard(gameID.value, index)
    } else {
        console.warn("⛔ Não é a tua vez.")
    }
  }

  const quitGame = () => {
    if (gameID.value) {
        socketStore.emitLeaveGame(gameID.value)
        gameID.value = null
        playerHand.value = []
        tableCards.value = []
        availableGames.value = []
        logs.value = 'Saiu do jogo.'
    }
  }

  return {
    gameID, mySide, playerHand, opponentHandCount, botCardCount, opponentName, isWaiting,
    trunfo, trunfoNaipe, tableCards, score, logs, currentTurn,
    isGameOver, cardsLeft, availableGames,
    sessionScore, gameTarget, // <--- Exportar gameTarget
    processGameState, setAvailableGames,
    startGame, joinGame, fetchGames, playCard, quitGame
  }
})
