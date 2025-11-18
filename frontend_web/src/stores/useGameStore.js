// src/stores/useGameStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'

export const useGameStore = defineStore('game', () => {
  // Estado
  const socket = ref(null)
  const playerName = ref('Jogador')
  const gameId = ref(null)
  const playerCards = ref([])
  const trumpSuit = ref('')
  const currentTurn = ref('')
  const deckCount = ref('-')
  const playerScore = ref(0)
  const botScore = ref(0)
  const playerRoundCard = ref(null)
  const botRoundCard = ref(null)
  const roundWinner = ref(null)
  const statusMessage = ref('Desconectado')
  const logContent = ref('')
  const timeRemaining = ref(0)  // ← Timer do turno

  // Flags
  const isConnected = ref(false)
  const canStart = ref(false)

  // Log
  const log = (msg) => {
    const t = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    logContent.value += `[${t}] ${msg}<br>`
  }

  // ============== CONECTAR ==============
  const connect = () => {
    if (socket.value?.connected) return

    if (!playerName.value.trim()) {
      alert('Escreve o teu nome!')
      return
    }

    log('A conectar ao servidor...')
    statusMessage.value = 'A conectar...'

    socket.value = io('ws://localhost:3000', {
      autoConnect: false,
      transports: ['websocket']
    })

    // Todos os listeners (ANTES de conectar!)
    socket.value.on('connect', () => {
      log('Conectado! A autenticar...')
      socket.value.emit('auth', { playerName: playerName.value })
    })

    socket.value.on('authSuccess', () => {
      isConnected.value = true
      canStart.value = true
      statusMessage.value = `Conectado como ${playerName.value}`
      log('Autenticado com sucesso!')
    })

    socket.value.on('authError', (err) => {
      log(`Erro: ${err.message || 'Autenticação falhou'}`)
      statusMessage.value = 'Erro ao autenticar'
    })

    socket.value.on('gameStarted', (data) => {
      gameId.value = data.gameId
      updateGameState(data.state)
      timeRemaining.value = (data.turnTime || 120) * 1000
      log('JOGO INICIADO! Boa sorte!')
      statusMessage.value = 'Jogo a decorrer...'
    })

    socket.value.on('playerTimer', (data) => {
      timeRemaining.value = data.timeLeft
    })

    socket.value.on('timerWarning', () => log('⏰ Tempo a acabar!'))
    socket.value.on('playerTimeout', () => log('⏰ Tempo esgotado! Perdeu a vez.'))

    socket.value.on('cardPlayed', (data) => {
      log(`${data.player === playerName.value ? 'Tu' : 'Bot'} jogou → ${data.card}`)
      if (data.player === playerName.value) {
        playerCards.value = playerCards.value.filter(c => c !== data.card)
      }
    })

    socket.value.on('roundResult', (data) => {
      playerRoundCard.value = data.playerCard
      botRoundCard.value = data.botCard
      roundWinner.value = data.winner
      updateScores(data.scores)
      log(`Rodada ganha por: ${data.winner}`)

      setTimeout(() => {
        playerRoundCard.value = null
        botRoundCard.value = null
        roundWinner.value = null
      }, 4000)
    })

    socket.value.on('gameEnded', (data) => {
      log(`FIM DO JOGO! Vencedor: ${data.winner}`)
      statusMessage.value = 'Jogo terminado'
      gameId.value = null
      canStart.value = true
    })

    socket.value.on('gameStateUpdate', (data) => updateGameState(data.state))

    // Conecta agora
    socket.value.connect()
  }

  // ============== INICIAR JOGO ==============
  const startGame = () => {
    if (!isConnected.value) return log('Ainda não conectado!')
    log('A pedir novo jogo...')
    socket.value.emit('startSingleplayerGame', {
      playerName: playerName.value,
      turnTime: 120
    })
    canStart.value = false
  }

  // ============== JOGAR CARTA ==============
  const playCard = (card) => {
    if (!gameId.value) return log('Nenhum jogo ativo')
    socket.value.emit('playCard', {
      gameId: gameId.value,
      playerName: playerName.value,
      cardFace: card
    })
  }

  // ============== UTILIDADES ==============
  const updateGameState = (state) => {
    trumpSuit.value = state.trump.charAt(0).toUpperCase()
    currentTurn.value = state.currentTurn
    deckCount.value = state.remaining
    if (state.hands?.[playerName.value]) {
      playerCards.value = [...state.hands[playerName.value]]
    }
  }

  const updateScores = (scores) => {
    playerScore.value = scores[playerName.value] || 0
    botScore.value = scores['Bot'] || 0
  }

  // ============== COMPUTEDS ==============
  const gameInfoVisible = computed(() => !!gameId.value)
  const scoresVisible = computed(() => !!gameId.value)
  const roundCardsVisible = computed(() => !!playerRoundCard.value || !!botRoundCard.value)
  const statusClass = computed(() => {
    if (isConnected.value && gameId.value) return 'connected'
    if (isConnected.value) return 'waiting'
    return 'disconnected'
  })

  const formattedTime = computed(() => {
    const s = Math.max(0, Math.floor(timeRemaining.value / 1000))
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  })

  return {
    // Estado
    playerName, playerCards, trumpSuit, currentTurn, deckCount,
    playerScore, botScore, playerRoundCard, botRoundCard, roundWinner,
    statusMessage, logContent, timeRemaining, formattedTime,

    // Flags
    isConnected, canStart,
    gameInfoVisible, scoresVisible, roundCardsVisible, statusClass,

    // Ações
    connect, startGame, playCard, log
  }
})