import { defineStore } from 'pinia'
import { ref, inject } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

export const useBiscaStore = defineStore('bisca', () => {
  const API_BASE_URL = inject('apiBaseURL') || 'http://localhost:8000/api'

  const socket = ref(null)
  const isConnected = ref(false)

  // Estado do Jogo (Reativo)
  const game = ref(null) // <--- NOVO: Guarda os dados da API (incluindo deck_slug)
  
  const playerHand = ref([])
  const botCardCount = ref(0)
  const trunfo = ref(null)
  const tableCards = ref([])
  const score = ref({ user: 0, bot: 0 })
  const logs = ref('A conectar...')
  const currentTurn = ref(null)
  const isGameOver = ref(false)
  const cardsLeft = ref(0)
  const trunfoNaipe = ref(null)

  let contadorLogs = 0

  // Ligar ao servidor Socket
  const connect = () => {
    if (socket.value) return

    // Ajusta a porta se o teu socket server não for 3000
    socket.value = io('http://localhost:3000')

    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('Conectado ao servidor Socket!')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      logs.value = 'Desconectado do servidor.'
    })

    // Receber atualizações do jogo
    socket.value.on('game_state', (data) => {
      contadorLogs++

      // Logs na consola para debug
      console.groupCollapsed(
        contadorLogs,
        ' - PACOTE SOCKET - USER:', data.score.user, ' | BOT: ', data.score.bot
      )
      console.log('Estado:', data)
      console.groupEnd()

      // Atualização do Estado
      playerHand.value = data.playerHand
      botCardCount.value = data.botCardCount
      trunfo.value = data.trunfo
      tableCards.value = data.tableCards
      score.value = data.score
      logs.value = data.logs
      currentTurn.value = data.turn
      isGameOver.value = data.gameOver
      cardsLeft.value = data.cardsLeft
      trunfoNaipe.value = data.trunfoNaipe
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  // --- AQUI ESTÁ A LÓGICA MÁGICA ---
  const startGame = async (type = 3) => {
    
    // 1. Tentar criar o jogo no Laravel para obter o BARALHO
    try {
        console.log("A contactar API Laravel para obter baralho...")
        
        // POST para /api/games
        const response = await axios.post(`${API_BASE_URL}/games`, {
            type: 'S',    // Singleplayer
            status: 'PL'  // Playing
        })

        // Guardamos a resposta (que traz o 'deck_slug') na variavel game
        game.value = response.data.data
        console.log("✅ Jogo Criado! Baralho detectado:", game.value.deck_slug)

    } catch (error) {
        console.error("⚠️ Erro ao criar jogo na API (Usando baralho default):", error)
        // Se a API falhar, usamos um objeto dummy para o jogo não travar
        game.value = { deck_slug: 'default' }
    }

    // 2. Iniciar a lógica no Socket (Node.js)
    if (socket.value) {
      socket.value.emit('join_game', type)
      console.log(`Pedindo para iniciar jogo de Bisca de ${type}...`)
    }
  }

  const playCard = (index) => {
    if (currentTurn.value === 'user' && socket.value) {
      socket.value.emit('play_card', index)
    }
  }

  return {
    connect,
    disconnect,
    startGame,
    playCard,
    
    // State
    isConnected,
    game, // <--- FUNDAMENTAL: Exportar isto para o componente ler
    playerHand,
    botCardCount,
    trunfo,
    tableCards,
    score,
    logs,
    currentTurn,
    isGameOver,
    cardsLeft,
  }
})