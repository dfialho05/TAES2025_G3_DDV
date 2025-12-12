import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { useBiscaStore } from './biscaStore'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const authStore = useAuthStore()
  const biscaStore = useBiscaStore()

  const SOCKET_URL = 'http://localhost:3000'

  const connect = () => {
    const token = localStorage.getItem('token') || authStore.token

    if (socket.value) socket.value.disconnect()

    socket.value = io(SOCKET_URL, {
      auth: { token: token },
      transports: ['websocket'],
      reconnection: true,
      forceNew: true
    })

    setupListeners()
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const setupListeners = () => {
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log(`✅ [Socket] Conectado! ID: ${socket.value.id}`)
      isConnected.value = true
      if (authStore.currentUser) {
          socket.value.emit('join', authStore.currentUser)
      }
    })

    socket.value.on('disconnect', () => {
      console.log(`❌ [Socket] Desconectado`)
      isConnected.value = false
    })

    socket.value.on('game-joined', (data) => {
        biscaStore.processGameState(data)
    })

    socket.value.on('game_state', (data) => biscaStore.processGameState(data))
    socket.value.on('games', (list) => biscaStore.setAvailableGames(list))
  }

  // --- AÇÕES ---
  const emitCreateGame = (type, mode, targetWins) => {
    socket.value?.emit('create-game', type, mode, targetWins)
  }
  const emitPlayCard = (gameID, cardIndex) => {
    socket.value?.emit('play_card', { gameID, cardIndex })
  }
  const emitLeaveGame = (gameID) => {
    socket.value?.emit('leave_game', gameID)
  }
  const emitGetGames = () => socket.value?.emit('get-games')
  const emitJoinGame = (gameID) => socket.value?.emit('join-game', gameID)

  // NOVO: Função para avançar ronda
  const emitNextRound = (gameID) => {
    socket.value?.emit('next_round', gameID)
  }

  const handleConnection = () => {
      connect();
  }

  return {
    socket, isConnected, connect, disconnect, handleConnection,
    emitCreateGame, emitPlayCard, emitLeaveGame, emitGetGames, emitJoinGame, emitNextRound
  }
})
