import { watch, onBeforeUnmount } from 'vue'
import { useBiscaStore } from '@/stores/biscaStore'
import { useSocketStore } from '@/stores/socket'

export function useGameRecovery() {
  const biscaStore = useBiscaStore()
  const socketStore = useSocketStore()

  let recoveryTimeout = null

  const attemptRecovery = async () => {
    if (recoveryTimeout) {
      clearTimeout(recoveryTimeout)
    }

    const persistedState = biscaStore.loadPersistedState()

    if (!persistedState || !persistedState.gameID) {
      console.log('[useGameRecovery] Nenhum jogo ativo para recuperar')
      return false
    }

    if (!socketStore.isConnected) {
      console.log('[useGameRecovery] Socket não conectado, aguardando conexão')
      return false
    }

    console.log('[useGameRecovery] Iniciando recuperação do jogo:', persistedState.gameID)

    const success = await biscaStore.attemptRecovery()

    if (success) {
      console.log('[useGameRecovery] Jogo recuperado com sucesso')
      return true
    } else {
      console.warn('[useGameRecovery] Falha ao recuperar jogo')
      return false
    }
  }

  const setupRecoveryWatchers = () => {
    const unwatchConnection = watch(
      () => socketStore.isConnected,
      async (connected, wasConnected) => {
        if (connected && !wasConnected && biscaStore.gameID) {
          console.log('[useGameRecovery] Reconexão detectada com jogo ativo')
          await attemptRecovery()
        }
      },
    )

    const unwatchGameID = watch(
      () => biscaStore.gameID,
      (newGameID, oldGameID) => {
        if (newGameID && !oldGameID) {
          console.log('[useGameRecovery] Novo jogo iniciado, persistindo estado')
        } else if (!newGameID && oldGameID) {
          console.log('[useGameRecovery] Jogo encerrado, limpando estado persistido')
        }
      },
    )

    return () => {
      unwatchConnection()
      unwatchGameID()
    }
  }

  const handlePageReload = async () => {
    const state = biscaStore.loadPersistedState()

    if (!state || !state.gameID) {
      return false
    }

    console.log('[useGameRecovery] Recarregamento de página detectado, tentando recuperar')

    if (!socketStore.isConnected) {
      recoveryTimeout = setTimeout(async () => {
        if (socketStore.isConnected) {
          await attemptRecovery()
        } else {
          console.warn('[useGameRecovery] Timeout esperando conexão para recuperação')
          biscaStore.resetGameState()
        }
      }, 5000)

      const unwatchConnection = watch(
        () => socketStore.isConnected,
        async (connected) => {
          if (connected) {
            clearTimeout(recoveryTimeout)
            await attemptRecovery()
            unwatchConnection()
          }
        },
      )

      return true
    }

    return await attemptRecovery()
  }

  const cleanup = () => {
    if (recoveryTimeout) {
      clearTimeout(recoveryTimeout)
      recoveryTimeout = null
    }
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    attemptRecovery,
    setupRecoveryWatchers,
    handlePageReload,
    cleanup,
  }
}
