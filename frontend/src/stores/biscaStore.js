// stores/biscaStore.js
import { defineStore } from 'pinia'
import { ref, inject } from 'vue'

export const useBiscaStore = defineStore('bisca', () => {
  // 1. INJEÇÃO: Recuperamos o socket criado no main.js
  const socket = inject('socket')

  // --- ESTADO (STATE) ---
  const gameID = ref(null) // <--- NOVO: Guardamos o ID numérico do jogo

  const playerHand = ref([])
  const botCardCount = ref(0)
  const trunfo = ref(null)
  const trunfoNaipe = ref(null)
  const tableCards = ref([])
  const score = ref({ user: 0, bot: 0 })
  const logs = ref('À espera de iniciar jogo...')
  const currentTurn = ref(null)
  const isGameOver = ref(false)
  const cardsLeft = ref(0)

  // Variável auxiliar para debugging
  let contadorLogs = 0

  // --- AÇÕES (ACTIONS) ---

  const bindEvents = () => {
    // Removemos listeners antigos para evitar duplicados
    socket.off('game_state')
    socket.off('game-joined')

    // 1. RESPOSTA AO CRIAR JOGO: Recebemos o ID e o estado inicial
    socket.on('game-joined', (data) => {
        console.log('[BiscaStore] Entrei na sala! ID:', data.id)
        if (data.id) gameID.value = data.id
        processGameState(data)
    })

    // 2. ATUALIZAÇÕES DO JOGO (Jogadas, Bot, etc.)
    socket.on('game_state', (data) => {
      contadorLogs++
      console.log(`[Update #${contadorLogs}] Estado recebido`, data)
      processGameState(data)
    })
  }

  // Função auxiliar para traduzir os dados do Backend (P1/P2) para o Frontend (User/Bot)
  const processGameState = (data) => {
      // Atualiza ID se vier no pacote
      if (data.id) gameID.value = data.id

      // --- TRADUÇÃO DE DADOS ---

      // No Singleplayer, tu és sempre o Player 1 (Criador)
      // O Backend manda 'player1Hand' -> Frontend usa 'playerHand'
      playerHand.value = data.player1Hand || []

      // O Backend manda 'player2Hand' -> Frontend usa 'botCardCount'
      // (Se o backend mandar botCardCount diretamente, usamos esse, senão calculamos)
      if (data.botCardCount !== undefined) {
          botCardCount.value = data.botCardCount
      } else if (data.player2Hand) {
          botCardCount.value = data.player2Hand.length
      }

      trunfo.value = data.trunfo
      trunfoNaipe.value = data.trunfoNaipe
      tableCards.value = data.tableCards

      // Pontuação: Player 1 é User, Player 2 é Bot
      score.value = {
          user: data.score.player1 || 0,
          bot: data.score.player2 || 0
      }

      logs.value = data.logs

      // Turno: Se for 'player1' é 'user', se for 'player2' é 'bot'
      if (data.turn === 'player1') currentTurn.value = 'user'
      else if (data.turn === 'player2') currentTurn.value = 'bot'
      else currentTurn.value = null // Game Over

      isGameOver.value = data.gameOver
      cardsLeft.value = data.cardsLeft
  }

  const unbindEvents = () => {
    if (socket) {
      socket.off('game_state')
      socket.off('game-joined')
    }
  }

  const startGame = (type = 3) => {
    if (!socket) return console.error("Socket não encontrado!")

    // 1. Ativa os ouvintes
    bindEvents()

    // 2. Pede para criar jogo (NOVO EVENTO: create-game)
    socket.emit('create-game', type)
    console.log(`[BiscaStore] A pedir criação de jogo de ${type} cartas...`)

    // Reset visual imediato
    logs.value = "A criar sala..."
    isGameOver.value = false
    gameID.value = null
  }

  const playCard = (index) => {
    // Debug: Ver por que razão pode não estar a enviar
    console.log(`[Frontend Play] Click na carta ${index}.`);
    console.log(`   > Turno atual: ${currentTurn.value}`);
    console.log(`   > GameID: ${gameID.value}`);
    console.log(`   > Socket ligado: ${!!socket}`);

    if (currentTurn.value === 'user' && socket && gameID.value) {
      console.log('   > A enviar pedido para o servidor...'); // <--- LOG NOVO
      socket.emit('play_card', {
          gameID: gameID.value,
          cardIndex: index
      })
    } else {
        console.warn("   > Jogada ignorada (Não é a tua vez ou falta dados)");
    }
  }

  const resetState = () => {
    gameID.value = null
    playerHand.value = []
    tableCards.value = []
    score.value = { user: 0, bot: 0 }
    logs.value = 'Jogo reiniciado.'
    isGameOver.value = false
    botCardCount.value = 0
  }

  // Função para sair do jogo corretamente
  const quitGame = () => {
    if (socket) {
        console.log('[BiscaStore] A sair do jogo...')
        socket.emit('leave_game') // Avisa o servidor (opcional nesta fase, mas bom ter)
        resetState()
        unbindEvents()
    }
  }

  return {
    // State
    gameID,
    playerHand,
    botCardCount,
    trunfo,
    trunfoNaipe,
    tableCards,
    score,
    logs,
    currentTurn,
    isGameOver,
    cardsLeft,

    // Actions
    startGame,
    playCard,
    resetState,
    unbindEvents,
    quitGame
  }
})
