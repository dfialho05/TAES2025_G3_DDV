// stores/biscaStore.js
import { defineStore } from 'pinia'
import { ref, inject, computed } from 'vue' // <--- Importar computed
import { useAuthStore } from './auth'

export const useBiscaStore = defineStore('bisca', () => {
  const socket = inject('socket')
  const authStore = useAuthStore()

  // --- ESTADO (STATE) ---
  const gameID = ref(null)
  const mySide = ref('player1')

  const playerHand = ref([])
  const opponentHandCount = ref(0) // O novo nome oficial

  const trunfo = ref(null)
  const trunfoNaipe = ref(null)
  const tableCards = ref([])
  const score = ref({ me: 0, opponent: 0 })
  const logs = ref('À espera de jogo...')

  const currentTurn = ref(null)
  const isGameOver = ref(false)
  const cardsLeft = ref(0)
  const availableGames = ref([])

  // --- COMPATIBILIDADE (O Segredo para corrigir o teu erro) ---
  // Criamos uma referência 'botCardCount' que aponta para o mesmo valor
  const botCardCount = computed(() => opponentHandCount.value)

  // --- AÇÕES (ACTIONS) ---

  const bindEvents = () => {
    socket.off('game_state')
    socket.off('game-joined')
    socket.off('games')

    socket.on('games', (gamesList) => {
        availableGames.value = gamesList
    })

    socket.on('game-joined', (data) => {
        console.log('[Store] Entrei no jogo:', data.id)
        if (data.id) gameID.value = data.id
        processGameState(data)
    })

    socket.on('game_state', (data) => {
      // console.log('[Store] Estado recebido:', data)
      processGameState(data)
    })
  }

  const processGameState = (data) => {
      if (data.id) gameID.value = data.id

      // 1. Mãos
      if (mySide.value === 'player1') {
          playerHand.value = data.player1Hand || []
          // Calcula quantas cartas o oponente tem
          if (data.player2Hand) {
              opponentHandCount.value = data.player2Hand.length
          } else if (data.botCardCount !== undefined) {
              opponentHandCount.value = data.botCardCount
          }
      } else {
          // Sou Player 2
          playerHand.value = data.player2Hand || []
          if (data.player1Hand) {
              opponentHandCount.value = data.player1Hand.length
          }
      }

      // 2. Dados Comuns
      trunfo.value = data.trunfo
      trunfoNaipe.value = data.trunfoNaipe
      tableCards.value = data.tableCards
      cardsLeft.value = data.cardsLeft
      isGameOver.value = data.gameOver
      logs.value = data.logs

      // 3. Pontuação
      const p1Score = data.score.player1 || 0
      const p2Score = data.score.player2 || 0

      if (mySide.value === 'player1') {
          score.value = { user: p1Score, bot: p2Score, me: p1Score, opponent: p2Score } // Compatibilidade user/bot
      } else {
          score.value = { user: p2Score, bot: p1Score, me: p2Score, opponent: p1Score }
      }

      // 4. Turno
      if (data.turn === mySide.value) {
          currentTurn.value = 'user' // Mantemos 'user' para o Singleplayer.vue não quebrar
      } else if (data.turn) {
          currentTurn.value = 'bot'  // Mantemos 'bot' para o Singleplayer.vue não quebrar
      } else {
          currentTurn.value = null
      }
  }

  const unbindEvents = () => {
    if (socket) {
      socket.off('game_state')
      socket.off('game-joined')
      socket.off('games')
    }
  }

  // --- INTERAÇÕES ---

  const fetchGames = () => {
      if(socket) socket.emit('get-games')
  }

  const startGame = (type = 3) => {
    if (!socket) return
    bindEvents()
    mySide.value = 'player1'
    socket.emit('create-game', type)
    logs.value = "A criar sala..."
    isGameOver.value = false
  }

  const joinGame = (id) => {
      if (!socket) return
      bindEvents()
      mySide.value = 'player2'
      socket.emit('join-game', id)
      logs.value = "A entrar..."
  }

  const playCard = (index) => {
    // Aceita 'user' ou 'me' como turno válido
    if ((currentTurn.value === 'user' || currentTurn.value === 'me') && socket && gameID.value) {
      socket.emit('play_card', {
          gameID: gameID.value,
          cardIndex: index
      })
    }
  }

  const quitGame = () => {
    if (socket) {
        socket.emit('leave_game')
        gameID.value = null
        playerHand.value = []
        tableCards.value = []
        availableGames.value = []
        unbindEvents()
    }
  }

  return {
    gameID,
    mySide,
    playerHand,
    opponentHandCount,
    botCardCount, // <--- EXPORTAR O ALIAS AQUI
    trunfo,
    trunfoNaipe,
    tableCards,
    score,
    logs,
    currentTurn,
    isGameOver,
    cardsLeft,
    availableGames,
    startGame,
    joinGame,
    fetchGames,
    playCard,
    quitGame,
    unbindEvents
  }
})
