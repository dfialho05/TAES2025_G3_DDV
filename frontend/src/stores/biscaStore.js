// stores/biscaStore.js
import { defineStore } from 'pinia'
import { ref, computed, inject } from 'vue'
import axios from 'axios'
import { useSocketStore } from './socket' // <--- A nova store de sockets

export const useBiscaStore = defineStore('bisca', () => {
  // Injeção da URL da API (Vem da tua versão local)
  const API_BASE_URL = inject('apiBaseURL') || 'http://localhost:8000/api'
  
  // Acesso à store de comunicação (Vem da versão do servidor)
  const socketStore = useSocketStore()

  // =========================================
  // 1. ESTADO (A Memória do Jogo)
  // =========================================
  // [NOVO] Guarda os dados da API Laravel (incluindo deck_slug para as skins)
  const game = ref(null) 

  // Estado Multiplayer (Vem da versão do servidor)
  const gameID = ref(null)             // Em que sala estou?
  const mySide = ref('player1')        // Sou o Jogador 1 ou 2?
  const opponentName = ref('Oponente') // Nome do Player 2
  const isWaiting = ref(false)         // Estou à espera de adversário?

  const playerHand = ref([])           // As minhas cartas visíveis
  const opponentHandCount = ref(0)     // Quantas cartas o inimigo tem
  
  const trunfo = ref(null)             // Carta do trunfo
  const trunfoNaipe = ref(null)        // Naipe do trunfo
  const tableCards = ref([])           // Cartas na mesa
  const cardsLeft = ref(0)             // Cartas no baralho
  
  const score = ref({ me: 0, opponent: 0 }) 
  const currentTurn = ref(null)        // 'user' ou 'bot'/'opponent'
  
  const isGameOver = ref(false)
  const logs = ref('À espera de jogo...')
  const availableGames = ref([])       // Lista de salas do Lobby

  // Alias para compatibilidade com componentes antigos
  const botCardCount = computed(() => opponentHandCount.value)

  // =========================================
  // 2. LÓGICA DE DADOS (Processar o que vem do Socket)
  // =========================================
  const processGameState = (data) => {
      // Proteção contra pacotes de jogos antigos
      if (gameID.value && data.id && String(data.id) !== String(gameID.value)) {
          return
      }

      if (data.id) gameID.value = data.id

      // A. Gestão de Mãos
      if (mySide.value === 'player1') {
          playerHand.value = data.player1Hand || []
          
          // Lógica de Espera (Se não há P2, estamos à espera)
          if (data.p2Name === null) {
              isWaiting.value = true
              opponentName.value = "Aguardando..."
          } else {
              isWaiting.value = false
              opponentName.value = data.p2Name
          }

          opponentHandCount.value = (data.player2Hand || []).length || data.botCardCount || 0
      } else {
          // Sou Player 2
          playerHand.value = data.player2Hand || []
          opponentHandCount.value = (data.player1Hand || []).length || 0
          isWaiting.value = false
          opponentName.value = data.p1Name || 'Player 1'
      }

      // B. Atualizar Mesa
      trunfo.value = data.trunfo
      trunfoNaipe.value = data.trunfoNaipe
      tableCards.value = data.tableCards
      cardsLeft.value = data.cardsLeft
      isGameOver.value = data.gameOver
      logs.value = data.logs

      // C. Pontuação
      const p1 = data.score.player1 || 0
      const p2 = data.score.player2 || 0

      if (mySide.value === 'player1') {
          score.value = { user: p1, bot: p2, me: p1, opponent: p2 }
      } else {
          score.value = { user: p2, bot: p1, me: p2, opponent: p1 }
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
  // 3. AÇÕES (Comandos)
  // =========================================

  // [FUSÃO] Cria jogo no Laravel (para Skins) E no Socket (para Multiplayer)
  const startGame = async (type = 3, mode = 'singleplayer') => {
      mySide.value = 'player1'
      logs.value = "A criar sala..."
      isGameOver.value = false

      // 1. Tentar criar o jogo na API Laravel (Tua lógica Local)
      // Isto garante que sabemos qual é o baralho (deck_slug)
      try {
        console.log("A contactar API Laravel para obter baralho...")
        const response = await axios.post(`${API_BASE_URL}/games`, {
            type: mode === 'singleplayer' ? 'S' : 'M',
            status: 'PL'
        })
        game.value = response.data.data
        console.log("✅ Jogo Criado! Baralho detectado:", game.value.deck_slug)
      } catch (error) {
        console.error("⚠️ Erro ao criar jogo na API (Usando default):", error)
        game.value = { deck_slug: 'default' }
      }

      // 2. Emitir evento para o Socket (Lógica do Servidor)
      socketStore.emitCreateGame(type, mode)
  }

  const joinGame = (id) => {
      mySide.value = 'player2'
      logs.value = "A entrar..."
      socketStore.emitJoinGame(id)
  }

  const fetchGames = () => {
      socketStore.emitGetGames()
  }

  const playCard = (index) => {
    if ((currentTurn.value === 'user' || currentTurn.value === 'me') && gameID.value) {
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
    // State
    game, // <--- O teu objeto importante
    gameID, mySide, playerHand, opponentHandCount, botCardCount, 
    opponentName, isWaiting, trunfo, trunfoNaipe, tableCards, 
    score, logs, currentTurn, isGameOver, cardsLeft, availableGames,
    
    // Actions
    processGameState, setAvailableGames,
    startGame, joinGame, fetchGames, playCard, quitGame
  }
})