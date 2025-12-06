// stores/socket.js
import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'
import { useBiscaStore } from './biscaStore' // <--- Conexão inversa (PDF Pág. 5)

export const useSocketStore = defineStore('socket', () => {
  const socket = inject('socket')
  const authStore = useAuthStore()
  // Nota: Instanciamos a store aqui para podermos chamar as ações dela
  const biscaStore = useBiscaStore()

  const joined = ref(false)

  // --- CONEXÃO GERAL ---
  const handleConnection = () => {
    socket.on('connect', () => {
      console.log(`[Socket] Connected -- ${socket.id}`)
    })

    socket.on('disconnect', () => {
      joined.value = false
      console.log(`[Socket] Disconnected`)
    })
  }

  const emitJoin = (user) => {
    if (joined.value) return
    console.log(`[Socket] Joining Server as ${user.name}`)
    socket.emit('join', user)
    joined.value = true

    // Assim que entra, configura os ouvintes do jogo
    bindGameEvents()
  }

  const emitLeave = () => {
    socket.emit('leave')
    joined.value = false
    unbindGameEvents()
  }

  // --- AÇÕES DE JOGO (Emits) ---
  // Estas funções correspondem às setas que saem do Cliente no diagrama do PDF [cite: 483, 484, 486]

  const emitGetGames = () => {
      socket.emit('get-games')
  }

  const emitCreateGame = (difficulty, mode = 'singleplayer') => {
    console.log(`[Socket] A criar jogo: Tipo=${difficulty}, Modo=${mode}`);
      socket.emit('create-game', difficulty, mode)
  }

  const emitJoinGame = (gameID) => {
      // O PDF sugere enviar ID do user, mas o socket.id já identifica no servidor.
      // Se o teu backend pede, podes passar authStore.user.id também.
      socket.emit('join-game', gameID)
  }

  const emitPlayCard = (gameID, cardIndex) => {
      socket.emit('play_card', { gameID, cardIndex })
  }

  const emitLeaveGame = (gameID) => {
      console.log(`[Socket] A abandonar o jogo ${gameID}...`)
      socket.emit('leave_game', gameID)
  }

  // --- OUVINTES (Receção) ---
  // O PDF sugere centralizar isto [cite: 149, 196]

  const bindGameEvents = () => {
      // Listener 1: Lista de Jogos
      socket.off('games') // Garante que não duplica
      socket.on('games', (gamesList) => {
          biscaStore.setAvailableGames(gamesList)
      })

      // Listener 2: Estado do Jogo (O mais importante)
      socket.off('game_state')
      socket.on('game_state', (data) => {
          console.log("🔥 [Socket] Dados recebidos, enviando para BiscaStore...")
          biscaStore.processGameState(data)
      })

      // Listener 3: Confirmação de entrada
      socket.off('game-joined')
      socket.on('game-joined', (data) => {
          console.log("[Socket] Entrei/Criei jogo com sucesso.")
          biscaStore.processGameState(data)
      })
  }

  const unbindGameEvents = () => {
      socket.off('games')
      socket.off('game_state')
      socket.off('game-joined')
  }

  return {
    socket,
    joined,
    handleConnection,
    emitJoin,
    emitLeave,
    // Métodos de Jogo
    emitGetGames,
    emitCreateGame,
    emitJoinGame,
    emitPlayCard,
    emitLeaveGame,
    bindGameEvents
  }
})
