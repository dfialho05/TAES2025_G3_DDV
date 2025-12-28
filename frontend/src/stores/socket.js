import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { useBiscaStore } from './biscaStore'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)

  // NOVO: Guardar o ID temporário de convidado
  const guestUserId = ref(null)

  const authStore = useAuthStore()
  const biscaStore = useBiscaStore()

  // Ajusta a porta conforme o teu servidor (3000, 3001, etc.)
  const SOCKET_URL = 'http://localhost:3000'

  const connect = (allowAnonymous = false) => {
    // Obtém token se existir
    const token = allowAnonymous ? null : authStore.token || localStorage.getItem('token')

    if (socket.value) socket.value.disconnect()

    socket.value = io(SOCKET_URL, {
      auth: { token: token },
      transports: ['websocket'],
      reconnection: true,
      forceNew: true,
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

  // Função centralizada para anunciar quem é o utilizador ao servidor
  const announceUser = () => {
    if (!socket.value) return

    let userData = authStore.currentUser
    const hasToken = authStore.token || localStorage.getItem('token')

    // CASO 1: Temos token, mas o user ainda não carregou (está a fazer fetch)
    // NÃO enviamos nada agora. Esperamos pelo watch do currentUser.
    if (!userData && hasToken) {
      console.log('[Socket] Aguardando dados do utilizador autenticado...')
      return
    }

    // CASO 2: Modo Convidado / Anónimo (sem token)
    if (!userData) {
      // Cria o ID baseado no Socket ID
      const gId = `guest-${socket.value.id.substring(0, 5)}`

      userData = {
        id: gId,
        name: `Convidado ${socket.value.id.substring(0, 4)}`,
        isGuest: true,
      }

      // IMPORTANTE: Guardamos este ID no state para o biscaStore o conseguir ler
      guestUserId.value = gId
    } else {
      // Se for login real, limpamos o guestId
      guestUserId.value = null
    }

    // CASO 3: Utilizador autenticado e carregado
    console.log('[Socket] Enviando identidade (JOIN):', userData)
    socket.value.emit('join', userData)
  }

  const setupListeners = () => {
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log(`[Socket] Conectado! ID: ${socket.value.id}`)
      isConnected.value = true

      // Tenta anunciar imediatamente (caso seja guest ou user já esteja em cache)
      announceUser()
    })

    socket.value.on('disconnect', () => {
      console.log(`[Socket] Desconectado`)
      isConnected.value = false
    })

    socket.value.on('game-joined', (data) => {
      console.log('[Socket] Entrei no jogo:', data.id)
      biscaStore.processGameState(data)
    })

    socket.value.on('game_state', (data) => biscaStore.processGameState(data))
    socket.value.on('games', (list) => biscaStore.setAvailableGames(list))

    socket.value.on('balance_update', ({ userId, balance }) => {
      console.log(`[Socket] Balance atualizada para user ${userId}: ${balance} coins`)
      // Atualizar balance no authStore se for o utilizador atual
      if (authStore.currentUser && String(authStore.currentUser.id) === String(userId)) {
        authStore.currentUser.coins_balance = balance
      }
    })

    socket.value.on('error', (err) => {
      console.error('[Socket] Erro do Socket:', err)
    })
  }

  // --- O FIX PRINCIPAL ---
  // Observa mudanças no utilizador. Assim que o login/fetch acabar, atualiza o socket.
  watch(
    () => authStore.currentUser,
    (newUser) => {
      if (newUser && isConnected.value) {
        console.log('[Socket] Dados de utilizador atualizados. Reenviando identidade...')
        // Atualiza token interno do socket para reconexões futuras
        if (socket.value && socket.value.auth) {
          socket.value.auth.token = authStore.token
        }
        announceUser()
      }
    },
  )

  // --- AÇÕES ---
  const emitCreateGame = (type, mode, targetWins, isPractice = false) => {
    if (!socket.value) return
    console.log(`Criando jogo: Tipo ${type}, Wins ${targetWins}`)
    socket.value.emit('create-game', type, mode, targetWins, isPractice)
  }

  const emitPlayCard = (gameID, cardIndex) => {
    socket.value?.emit('play_card', { gameID, cardIndex })
  }

  const emitLeaveGame = (gameID) => {
    socket.value?.emit('leave_game', gameID)
  }

  const emitGetGames = () => socket.value?.emit('get-games')
  const emitJoinGame = (gameID) => socket.value?.emit('join-game', gameID)

  const emitNextRound = (gameID) => {
    socket.value?.emit('next_round', gameID)
  }

  const handleConnection = (allowAnonymous = false) => {
    if (!isConnected.value) {
      connect(allowAnonymous)
    }
  }

  return {
    socket,
    isConnected,
    guestUserId, // <--- Exportado para ser usado no biscaStore
    connect,
    disconnect,
    handleConnection,
    emitCreateGame,
    emitPlayCard,
    emitLeaveGame,
    emitGetGames,
    emitJoinGame,
    emitNextRound,
  }
})
