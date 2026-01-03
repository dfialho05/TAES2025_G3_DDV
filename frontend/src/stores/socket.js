import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'
import { useBiscaStore } from './biscaStore'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10

  const guestUserId = ref(null)

  const authStore = useAuthStore()
  const biscaStore = useBiscaStore()

  const SOCKET_URL = 'http://localhost:3000'

  const connect = (allowAnonymous = false) => {
    const token = allowAnonymous ? null : authStore.token || localStorage.getItem('api_token')

    if (socket.value) socket.value.disconnect()

    socket.value = io(SOCKET_URL, {
      auth: { token: token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      forceNew: true,
      withCredentials: true,
    })

    setupListeners()
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      isReconnecting.value = false
      reconnectAttempts.value = 0
    }
  }

  // Função centralizada para anunciar quem é o utilizador ao servidor
  const announceUser = () => {
    if (!socket.value) return

    let userData = authStore.currentUser
    const hasToken = authStore.token || localStorage.getItem('api_token')

    // DEBUG: Log do token
    console.log('\n[Socket announceUser DEBUG]')
    console.log(
      '  authStore.token:',
      authStore.token ? `PRESENTE (${authStore.token.substring(0, 20)}...)` : 'AUSENTE',
    )
    console.log(
      '  localStorage api_token:',
      localStorage.getItem('api_token')
        ? `PRESENTE (${localStorage.getItem('api_token').substring(0, 20)}...)`
        : 'AUSENTE',
    )
    console.log('  hasToken:', hasToken ? 'SIM' : 'NÃO')
    console.log('  userData:', userData ? userData.name : 'AUSENTE')

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
    // Incluir token (se existir) no payload para o servidor persistir
    const payload = {
      ...userData,
      token: authStore.token || localStorage.getItem('token') || null,
    }
    socket.value.emit('join', payload)
  }

  const setupListeners = () => {
    if (!socket.value) return

    socket.value.on('connect', () => {
      console.log(`[Socket] Conectado! ID: ${socket.value.id}`)
      isConnected.value = true

      // Tenta anunciar imediatamente (caso seja guest ou user já esteja em cache)
      announceUser()
    })

    socket.value.on('disconnect', (reason) => {
      console.log(`[Socket] Desconectado. Razão: ${reason}`)
      isConnected.value = false

      if (reason === 'io server disconnect') {
        console.log('[Socket] Servidor forçou desconexão, tentando reconectar...')
        socket.value.connect()
      }
    })

    socket.value.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Socket] Tentativa de reconexão ${attemptNumber}/${maxReconnectAttempts}`)
      isReconnecting.value = true
      reconnectAttempts.value = attemptNumber
    })

    socket.value.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconectado após ${attemptNumber} tentativas`)
      isReconnecting.value = false
      reconnectAttempts.value = 0
      isConnected.value = true

      const token = authStore.token || localStorage.getItem('api_token')
      if (token && socket.value.auth) {
        socket.value.auth.token = token
      }

      announceUser()

      if (biscaStore.gameID) {
        console.log('[Socket] Re-entrando no jogo após reconexão:', biscaStore.gameID)
        socket.value.emit('join-game', biscaStore.gameID)
      }
    })

    socket.value.on('reconnect_error', (error) => {
      console.error('[Socket] Erro de reconexão:', error.message)
    })

    socket.value.on('reconnect_failed', () => {
      console.error('[Socket] Falha ao reconectar após todas as tentativas')
      isReconnecting.value = false
      reconnectAttempts.value = 0

      if (biscaStore.gameID) {
        console.log('[Socket] Limpando jogo devido a falha de reconexão')
        biscaStore.resetGameState()
      }
    })

    socket.value.on('connect_error', (error) => {
      console.error('[Socket] Erro de conexão:', error.message)
    })

    socket.value.on('game-joined', (data) => {
      console.log('[Socket] Entrei no jogo:', data.id)
      biscaStore.processGameState(data)
    })

    socket.value.on('game_state', (data) => {
      biscaStore.processGameState(data)
    })

    socket.value.on('games', (list) => biscaStore.setAvailableGames(list))

    socket.value.on('game_annulled', (data) => {
      console.log('[Socket] Jogo anulado pelo servidor:', data)
      biscaStore.handleGameAnnulled(data)
    })

    socket.value.on('game_timeout', (data) => {
      console.log('[Socket] Jogo expirado por timeout:', data)
      biscaStore.handleGameAnnulled(data)
    })

    socket.value.on('recovery_error', (data) => {
      console.error('[Socket] Erro de recuperação:', data)
      biscaStore.resetGameState()

      if (data.shouldRedirect && data.redirectTo) {
        console.log('[Socket] Redirecionando para:', data.redirectTo)
        const router = window?.$router
        if (router) {
          router.push(data.redirectTo)
        } else {
          window.location.href = data.redirectTo
        }
      }
    })

    socket.value.on('game_recovered', (data) => {
      console.log('[Socket] Jogo recuperado com sucesso:', data)
      if (data.gameState) {
        biscaStore.processGameState(data.gameState)
      }
    })

    socket.value.on('reconnection_complete', (data) => {
      console.log('[Socket] Reconexão completa:', data)
      if (data.hasActiveGame && data.gameId) {
        console.log('[Socket] Jogo ativo detectado:', data.gameId)
      }
    })

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
    isReconnecting,
    reconnectAttempts,
    guestUserId,
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
