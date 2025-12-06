// stores/biscaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSocketStore } from './socket' // <--- A nossa "Lista de Contactos" para o servidor

export const useBiscaStore = defineStore('bisca', () => {
  // Acesso à store de comunicação (para enviarmos ordens)
  const socketStore = useSocketStore()

  // =========================================
  // 1. ESTADO (A Memória do Jogo)
  // =========================================
  const gameID = ref(null)             // Em que sala estou?
  const mySide = ref('player1')        // Sou o Jogador 1 ou 2?

  const playerHand = ref([])           // As minhas cartas visíveis
  const opponentHandCount = ref(0)     // Quantas cartas o inimigo tem (não vemos quais são)

  const trunfo = ref(null)             // Carta do trunfo
  const trunfoNaipe = ref(null)        // Naipe do trunfo (importante se o trunfo for puxado)
  const tableCards = ref([])           // Cartas jogadas na mesa
  const cardsLeft = ref(0)             // Cartas no baralho

  const score = ref({ me: 0, opponent: 0 }) // Pontuação
  const currentTurn = ref(null)        // De quem é a vez? ('user' ou 'bot')

  const isGameOver = ref(false)        // O jogo acabou?
  const logs = ref('À espera de jogo...') // Mensagens de texto (ex: "Player 1 jogou...")
  const availableGames = ref([])       // Lista de salas do Lobby

  // Alias para compatibilidade com o teu template antigo (Singleplayer)
  const botCardCount = computed(() => opponentHandCount.value)

  // =========================================
  // 2. LÓGICA DE DADOS (O Cérebro)
  // =========================================

  // Recebe os dados brutos do servidor e organiza nas gavetas certas
  const processGameState = (data) => {
      // 🛡️ PROTEÇÃO ANTI-FANTASMA:
      // Se recebermos dados de um jogo (data.id) diferente do nosso (gameID), ignoramos.
      if (gameID.value && data.id && String(data.id) !== String(gameID.value)) {
          console.warn("👻 Ignorando dados de jogo antigo/fantasma.")
          return
      }

      // Atualiza o ID se for novo
      if (data.id) gameID.value = data.id

      // A. Gestão de Mãos (Perspetiva)
      // O servidor envia as duas mãos. Nós decidimos qual mostramos baseados no 'mySide'.
      if (mySide.value === 'player1') {
          playerHand.value = data.player1Hand || []
          // Se houver Player 2, pegamos o tamanho da mão dele. Se for Bot, idem.
          opponentHandCount.value = (data.player2Hand || []).length || data.botCardCount || 0
      } else {
          // Sou Player 2
          playerHand.value = data.player2Hand || []
          opponentHandCount.value = (data.player1Hand || []).length || 0
      }

      // B. Atualizar Mesa e Regras
      trunfo.value = data.trunfo
      trunfoNaipe.value = data.trunfoNaipe
      tableCards.value = data.tableCards
      cardsLeft.value = data.cardsLeft
      isGameOver.value = data.gameOver
      logs.value = data.logs

      // C. Pontuação (Mapear Player1/2 para Eu/Oponente)
      const p1 = data.score.player1 || 0
      const p2 = data.score.player2 || 0

      if (mySide.value === 'player1') {
          score.value = { user: p1, bot: p2, me: p1, opponent: p2 }
      } else {
          score.value = { user: p2, bot: p1, me: p2, opponent: p1 }
      }

      // D. De quem é a vez?
      // O template espera 'user' ou 'bot'.
      if (data.turn === mySide.value) currentTurn.value = 'user'
      else if (data.turn) currentTurn.value = 'bot'
      else currentTurn.value = null
  }

  // Atualiza a lista do Lobby
  const setAvailableGames = (games) => {
      availableGames.value = games
  }

  // =========================================
  // 3. AÇÕES DO UTILIZADOR (O Comando Remoto)
  // =========================================

  // Pede a lista de jogos ao servidor
  const fetchGames = () => {
      socketStore.emitGetGames()
  }

  // Cria um jogo novo (Sou Player 1)
  const startGame = (type = 3, mode = 'singleplayer') => {
      mySide.value = 'player1'
      logs.value = "A criar sala..."
      isGameOver.value = false
      socketStore.emitCreateGame(type, mode)
  }

  // Entra num jogo existente (Sou Player 2)
  const joinGame = (id) => {
      mySide.value = 'player2'
      logs.value = "A entrar..."
      socketStore.emitJoinGame(id)
  }

  // Joga uma carta
  const playCard = (index) => {
    // Validação Local: Só enviamos se for a nossa vez (Evita spam no servidor)
    if ((currentTurn.value === 'user' || currentTurn.value === 'me') && gameID.value) {
        socketStore.emitPlayCard(gameID.value, index)
    } else {
        console.warn("⛔ Não é a tua vez.")
    }
  }

  // Sai do jogo (A "Faxina")
  const quitGame = () => {
    if (gameID.value) {
        // 1. Avisa o servidor para nos tirar da sala
        socketStore.emitLeaveGame(gameID.value)

        // 2. Limpa a memória local
        gameID.value = null
        playerHand.value = []
        tableCards.value = []
        availableGames.value = []
        logs.value = 'Saiu do jogo.'
    }
  }

  return {
    gameID, mySide, playerHand, opponentHandCount, botCardCount,
    trunfo, trunfoNaipe, tableCards, score, logs, currentTurn,
    isGameOver, cardsLeft, availableGames,
    processGameState, setAvailableGames,
    startGame, joinGame, fetchGames, playCard, quitGame
  }
})
