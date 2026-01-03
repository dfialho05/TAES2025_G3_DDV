import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useSocketStore } from './socket'
import { useAuthStore } from './auth'

const GAME_STATE_KEY = 'bisca_game_state'

export const useBiscaStore = defineStore('bisca', () => {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()

  const isRecovering = ref(false)
  const connectionLost = ref(false)
  const showAnnulledModal = ref(false)
  const annulledReason = ref('')
  const annulledMessage = ref('')

  const gameID = ref(null)
  const mySide = ref('player1')
  const opponentName = ref('Oponente')
  const isWaiting = ref(false)
  const gameMode = ref(3)

  const playerHand = ref([])
  const opponentHandCount = ref(0)
  const trunfo = ref(null)
  const trunfoNaipe = ref(null)
  const tableCards = ref([])
  const cardsLeft = ref(0)

  const score = ref({ me: 0, opponent: 0 })
  const lastRoundScore = ref({ me: 0, opponent: 0 })
  const sessionScore = ref({ me: 0, opponent: 0 })

  const currentTurn = ref(null)
  const gameTarget = ref(1)

  const isGameOver = ref(false)
  const isRoundOver = ref(false)
  const logs = ref('À espera de jogo...')

  const availableGames = ref([])

  const botCardCount = computed(() => opponentHandCount.value)

  const persistGameState = () => {
    if (!gameID.value) return

    const state = {
      gameID: gameID.value,
      mySide: mySide.value,
      gameMode: gameMode.value,
      gameTarget: gameTarget.value,
      timestamp: Date.now(),
    }

    try {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('[BiscaStore] Erro ao persistir estado:', error)
    }
  }

  const loadPersistedState = () => {
    try {
      const stored = localStorage.getItem(GAME_STATE_KEY)
      if (!stored) return null

      const state = JSON.parse(stored)
      const age = Date.now() - state.timestamp

      if (age > 300000) {
        clearPersistedState()
        return null
      }

      return state
    } catch (error) {
      console.error('[BiscaStore] Erro ao carregar estado persistido:', error)
      clearPersistedState()
      return null
    }
  }

  const clearPersistedState = () => {
    try {
      localStorage.removeItem(GAME_STATE_KEY)
    } catch (error) {
      console.error('[BiscaStore] Erro ao limpar estado:', error)
    }
  }

  const attemptRecovery = async () => {
    const state = loadPersistedState()
    if (!state || !state.gameID) {
      console.log('[BiscaStore] Nenhum estado de jogo para recuperar')
      return false
    }

    console.log('[BiscaStore] Tentando recuperar jogo:', state.gameID)
    isRecovering.value = true

    try {
      gameID.value = state.gameID
      gameMode.value = state.gameMode
      gameTarget.value = state.gameTarget
      mySide.value = state.mySide

      socketStore.emitJoinGame(state.gameID)

      setTimeout(() => {
        if (isRecovering.value) {
          console.warn('[BiscaStore] Timeout na recuperação do jogo')
          isRecovering.value = false
          resetGameState()
        }
      }, 5000)

      return true
    } catch (error) {
      console.error('[BiscaStore] Erro ao recuperar jogo:', error)
      isRecovering.value = false
      resetGameState()
      return false
    }
  }

  watch(
    () => gameID.value,
    (newGameID) => {
      if (newGameID) {
        persistGameState()
      } else {
        clearPersistedState()
      }
    },
  )

  watch(
    () => socketStore.isConnected,
    (connected) => {
      if (!connected && gameID.value) {
        connectionLost.value = true
        console.log('[BiscaStore] Conexão perdida durante o jogo')
      } else if (connected && connectionLost.value && gameID.value) {
        console.log('[BiscaStore] Conexão restaurada, tentando recuperar jogo')
        attemptRecovery()
      }
    },
  )

  const processGameState = (data) => {
    if (gameID.value && data.id && String(data.id) !== String(gameID.value)) return

    if (data.id) {
      gameID.value = data.id
      if (isRecovering.value) {
        console.log('[BiscaStore] Jogo recuperado com sucesso')
        isRecovering.value = false
        connectionLost.value = false
      }
    }

    if (data.gameOver || data.roundOver) {
      console.log('[Store] Estado Final Recebido. Pontos Ronda:', data.lastRoundPoints)
    }

    if (data.winsNeeded) gameTarget.value = parseInt(data.winsNeeded)
    if (data.gameType) gameMode.value = parseInt(data.gameType)

    let myId = String(authStore.currentUser?.id || '')

    if (!myId && socketStore.guestUserId) {
      myId = String(socketStore.guestUserId)
    }

    const p1Id = String(data.player1Id || '')

    if (myId === p1Id) {
      mySide.value = 'player1'
    } else {
      mySide.value = 'player2'
    }

    console.log(`Perspetiva definida: Sou ${mySide.value} (Meu ID: ${myId}, P1 ID: ${p1Id})`)

    if (mySide.value === 'player1') {
      playerHand.value = data.player1Hand || []
      opponentName.value = data.p2Name
        ? data.p2Name
        : data.p2Name === null
          ? 'Aguardando...'
          : 'Bot'
      isWaiting.value = data.p2Name === null
      opponentHandCount.value = (data.player2Hand || []).length || data.botCardCount || 0
    } else {
      isWaiting.value = false
      opponentName.value = data.p1Name || 'Player 1'
      playerHand.value = data.player2Hand || []
      opponentHandCount.value = (data.player1Hand || []).length || 0
    }

    trunfo.value = data.trunfo
    trunfoNaipe.value = data.trunfoNaipe
    tableCards.value = data.tableCards
    cardsLeft.value = data.cardsLeft
    isGameOver.value = data.gameOver
    isRoundOver.value = data.roundOver
    logs.value = data.logs

    const p1Score = data.score?.player1 || 0
    const p2Score = data.score?.player2 || 0
    const p1Last = data.lastRoundPoints?.player1 || 0
    const p2Last = data.lastRoundPoints?.player2 || 0
    const p1Wins = data.matchWins?.player1 || 0
    const p2Wins = data.matchWins?.player2 || 0

    if (mySide.value === 'player1') {
      score.value = { me: p1Score, opponent: p2Score }
      lastRoundScore.value = { me: p1Last, opponent: p2Last }
      sessionScore.value = { me: p1Wins, opponent: p2Wins }
    } else {
      score.value = { me: p2Score, opponent: p1Score }
      lastRoundScore.value = { me: p2Last, opponent: p1Last }
      sessionScore.value = { me: p2Wins, opponent: p1Wins }
    }

    if (data.turn === mySide.value) currentTurn.value = 'user'
    else if (data.turn) currentTurn.value = 'bot'
    else currentTurn.value = null
  }

  const popupData = computed(() => {
    if (!isGameOver.value && !isRoundOver.value) return null

    const pointsMe = lastRoundScore.value.me
    const pointsOpp = lastRoundScore.value.opponent
    const roundWin = pointsMe > pointsOpp
    const matchWin =
      sessionScore.value.me >= gameTarget.value ||
      (isGameOver.value && sessionScore.value.me > sessionScore.value.opponent)

    let title = ''
    if (isGameOver.value) {
      title = matchWin ? 'VITÓRIA DA PARTIDA!' : 'DERROTA NA PARTIDA'
    } else {
      title = roundWin ? 'VENCESTE A RONDA!' : 'PERDESTE A RONDA'
    }

    let achievement = null
    if (pointsMe === 120) achievement = 'BANDEIRA'
    else if (pointsMe >= 91) achievement = 'CAPOTE'
    else if (pointsMe > 60) achievement = 'RISCA'
    else if (pointsOpp === 120) achievement = 'SOFREU BANDEIRA'
    else if (pointsOpp >= 91) achievement = 'LEVOU CAPOTE'

    return {
      title,
      isWin: isGameOver.value ? matchWin : roundWin,
      isMatchEnd: isGameOver.value,
      finalScore: `${pointsMe} - ${pointsOpp}`,
      sessionResult: `${sessionScore.value.me} - ${sessionScore.value.opponent}`,
      achievement,
    }
  })

  const startGame = (type, mode, wins, isPractice = false) => {
    clearPersistedState()
    gameID.value = null
    playerHand.value = []
    tableCards.value = []
    score.value = { me: 0, opponent: 0 }
    sessionScore.value = { me: 0, opponent: 0 }
    isGameOver.value = false
    isRoundOver.value = false
    gameTarget.value = parseInt(wins) || 1
    gameMode.value = type

    socketStore.emitCreateGame(type, mode, wins, isPractice)
  }

  const closeRoundPopup = () => {
    if (gameID.value) socketStore.emitNextRound(gameID.value)
    isRoundOver.value = false
  }

  const quitGame = () => {
    if (gameID.value) {
      socketStore.emitLeaveGame(gameID.value)
      resetGameState()
    }
  }

  const resetGameState = () => {
    gameID.value = null
    playerHand.value = []
    tableCards.value = []
    score.value = { me: 0, opponent: 0 }
    sessionScore.value = { me: 0, opponent: 0 }
    isGameOver.value = false
    isRoundOver.value = false
    isRecovering.value = false
    connectionLost.value = false
    showAnnulledModal.value = false
    annulledReason.value = ''
    annulledMessage.value = ''
    clearPersistedState()
  }

  const handleGameAnnulled = (data) => {
    console.log('[BiscaStore] Jogo anulado:', data)

    annulledMessage.value =
      data?.message || 'O jogo foi encerrado devido a inatividade ou erro no servidor.'
    annulledReason.value = data?.reason || ''
    showAnnulledModal.value = true

    resetGameState()
  }

  const closeAnnulledModal = () => {
    showAnnulledModal.value = false
    annulledReason.value = ''
    annulledMessage.value = ''
  }

  const joinGame = (id) => socketStore.emitJoinGame(id)
  const playCard = (index) => {
    if (currentTurn.value === 'user') socketStore.emitPlayCard(gameID.value, index)
  }
  const fetchGames = () => socketStore.emitGetGames()
  const setAvailableGames = (l) => (availableGames.value = l)

  return {
    gameID,
    mySide,
    playerHand,
    opponentHandCount,
    botCardCount,
    opponentName,
    isWaiting,
    isRecovering,
    connectionLost,
    showAnnulledModal,
    annulledReason,
    annulledMessage,
    trunfo,
    trunfoNaipe,
    tableCards,
    score,
    logs,
    currentTurn,
    isGameOver,
    isRoundOver,
    cardsLeft,
    availableGames,
    sessionScore,
    gameTarget,
    gameMode,
    popupData,
    processGameState,
    setAvailableGames,
    startGame,
    joinGame,
    fetchGames,
    playCard,
    quitGame,
    closeRoundPopup,
    attemptRecovery,
    resetGameState,
    handleGameAnnulled,
    closeAnnulledModal,
    loadPersistedState,
  }
})
