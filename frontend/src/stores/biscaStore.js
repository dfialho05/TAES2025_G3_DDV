import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSocketStore } from './socket'
import { useAuthStore } from './auth'

export const useBiscaStore = defineStore('bisca', () => {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()

  // =========================================
  // 1. ESTADO (STATE)
  // =========================================
  const gameID = ref(null)
  const mySide = ref('player1') // Será atualizado dinamicamente
  const opponentName = ref('Oponente')
  const isWaiting = ref(false)

  const playerHand = ref([])
  const opponentHandCount = ref(0)
  const trunfo = ref(null)
  const trunfoNaipe = ref(null)
  const tableCards = ref([])
  const cardsLeft = ref(0)

  // Pontuações
  const score = ref({ me: 0, opponent: 0 })
  const lastRoundScore = ref({ me: 0, opponent: 0 })
  const sessionScore = ref({ me: 0, opponent: 0 }) // Placar de vitórias (ex: 2-1)

  const currentTurn = ref(null)
  const gameTarget = ref(1) // Quantas vitórias para ganhar a match

  const isGameOver = ref(false)
  const isRoundOver = ref(false)
  const logs = ref('À espera de jogo...')

  const availableGames = ref([])

  // Computeds auxiliares
  const botCardCount = computed(() => opponentHandCount.value)

  // =========================================
  // 2. LÓGICA CENTRAL (PROCESSAR DADOS DO SERVIDOR)
  // =========================================
  const processGameState = (data) => {
    // Validação básica de ID do jogo
    if (gameID.value && data.id && String(data.id) !== String(gameID.value)) return
    if (data.id) gameID.value = data.id

    // ---------------------------------------------------------
    // AQUI ESTÁ A CORREÇÃO PRINCIPAL: QUEM SOU EU?
    // ---------------------------------------------------------
    const myId = String(authStore.currentUser?.id || '');
    const p1Id = String(data.player1Id || ''); // Vem do backend agora

    // Se o meu ID for igual ao do Dono da Sala (P1), eu sou P1.
    // Caso contrário, assumo que sou o P2.
    if (myId === p1Id) {
        mySide.value = 'player1';
    } else {
        mySide.value = 'player2';
    }

    console.log(`🔍 Perspetiva definida: Sou ${mySide.value} (Meu ID: ${myId}, P1 ID: ${p1Id})`);

    // ---------------------------------------------------------
    // MAPEAMENTO DE DADOS COM BASE NA PERSPETIVA
    // ---------------------------------------------------------
    if (mySide.value === 'player1') {
      // VISÃO DO JOGADOR 1
      playerHand.value = data.player1Hand || []

      // Nome do oponente
      opponentName.value = data.p2Name
        ? data.p2Name
        : (data.p2Name === null ? 'Aguardando...' : 'Bot')

      // Estado de espera (só P1 espera por P2)
      isWaiting.value = data.p2Name === null

      // Cartas do oponente (P2 ou Bot)
      opponentHandCount.value = (data.player2Hand || []).length || data.botCardCount || 0

    } else {
      // VISÃO DO JOGADOR 2
      isWaiting.value = false // P2 nunca espera, o jogo já existe

      // Nome do oponente (que é o P1)
      opponentName.value = data.p1Name || 'Player 1'

      // Minha mão é a mão do P2
      playerHand.value = data.player2Hand || []

      // Cartas do oponente (P1)
      opponentHandCount.value = (data.player1Hand || []).length || 0
    }

    // Dados Comuns
    trunfo.value = data.trunfo
    trunfoNaipe.value = data.trunfoNaipe
    tableCards.value = data.tableCards
    cardsLeft.value = data.cardsLeft
    isGameOver.value = data.gameOver
    isRoundOver.value = data.roundOver
    logs.value = data.logs

    // ---------------------------------------------------------
    // MAPEAMENTO DE PONTUAÇÕES
    // ---------------------------------------------------------
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

    // Turno
    if (data.turn === mySide.value) currentTurn.value = 'user'
    else if (data.turn) currentTurn.value = 'bot' // ou opponent
    else currentTurn.value = null
  }

  // =========================================
  // 3. COMPUTED: POPUP DE FINAL DE JOGO/RONDA
  // =========================================
  const popupData = computed(() => {
    if (!isGameOver.value && !isRoundOver.value) return null

    const pointsMe = lastRoundScore.value.me
    const pointsOpp = lastRoundScore.value.opponent

    // Venceu a ronda?
    const roundWin = pointsMe > pointsOpp

    // Venceu o Jogo Completo (Match)?
    const matchWin =
      sessionScore.value.me >= gameTarget.value ||
      (isGameOver.value && sessionScore.value.me > sessionScore.value.opponent)

    let title = ''
    if (isGameOver.value) {
      title = matchWin ? 'VITÓRIA DA PARTIDA!' : 'DERROTA NA PARTIDA'
    } else {
      title = roundWin ? 'VENCESTE A RONDA!' : 'PERDESTE A RONDA'
    }

    // Conquistas (Bandeira, Capote, etc)
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

  // =========================================
  // 4. AÇÕES (ACTIONS)
  // =========================================
  const startGame = (type, mode, wins, isPractice = false) => {
    gameID.value = null
    playerHand.value = []
    tableCards.value = []
    score.value = { me: 0, opponent: 0 }
    sessionScore.value = { me: 0, opponent: 0 }
    isGameOver.value = false
    isRoundOver.value = false
    gameTarget.value = parseInt(wins) || 1

    socketStore.emitCreateGame(type, mode, wins, isPractice)
  }

  // Avança para a próxima ronda (fecha popup)
  const closeRoundPopup = () => {
    if (gameID.value) {
      socketStore.emitNextRound(gameID.value)
    }
    isRoundOver.value = false
  }

  const quitGame = () => {
    if (gameID.value) {
      socketStore.emitLeaveGame(gameID.value)
      gameID.value = null
      playerHand.value = []
      tableCards.value = []
      score.value = { me: 0, opponent: 0 }
      isGameOver.value = false
      isRoundOver.value = false
    }
  }

  const joinGame = (id) => {
    socketStore.emitJoinGame(id)
  }

  const playCard = (index) => {
    if (currentTurn.value === 'user') {
        socketStore.emitPlayCard(gameID.value, index)
    }
  }

  const fetchGames = () => {
    socketStore.emitGetGames()
  }

  const setAvailableGames = (l) => {
    availableGames.value = l
  }

  return {
    // State
    gameID,
    mySide,
    playerHand,
    opponentHandCount,
    botCardCount,
    opponentName,
    isWaiting,
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

    // Computed
    popupData,

    // Actions
    processGameState,
    setAvailableGames,
    startGame,
    joinGame,
    fetchGames,
    playCard,
    quitGame,
    closeRoundPopup,
  }
})
