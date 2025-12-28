import { ref, computed } from 'vue'
import { useGamesStore } from '@/stores/games'
import { useMatchesStore } from '@/stores/matches'

/**
 * Composable para gerenciar dados de perfil (jogos e partidas)
 * Facilita o uso das duas stores em conjunto
 */
export function useProfileData() {
  const gamesStore = useGamesStore()
  const matchesStore = useMatchesStore()

  // Estados locais
  const isLoadingProfile = ref(false)
  const profileError = ref(null)

  // Computed properties que combinam dados das duas stores
  const isLoading = computed(
    () =>
      isLoadingProfile.value || gamesStore.loadingRecentGames || matchesStore.loadingRecentMatches,
  )

  const hasAnyData = computed(() => gamesStore.hasRecentGames || matchesStore.hasRecentMatches)

  const profileStats = computed(() => ({
    totalRecentGames: gamesStore.recentGames.length,
    totalRecentMatches: matchesStore.recentMatches.length,
    gamesWinRate: gamesStore.gameWinRate,
    matchesWinRate: matchesStore.matchWinRate,
    wonGames: gamesStore.wonGames.length,
    lostGames: gamesStore.lostGames.length,
    wonMatches: matchesStore.wonMatches.length,
    lostMatches: matchesStore.lostMatches.length,
  }))

  // Função principal para carregar dados do perfil
  const loadProfileData = async (userId) => {
    if (!userId) {
      console.warn('useProfileData: userId is required')
      return { success: false, error: 'User ID is required' }
    }

    isLoadingProfile.value = true
    profileError.value = null

    try {
      console.log(`[useProfileData] Loading profile data for user ${userId}...`)

      // Executar as duas operações em paralelo
      await Promise.all([
        gamesStore.fetchRecentGames(userId),
        matchesStore.fetchRecentMatches(userId),
      ])

      // Logs detalhados
      console.log('[useProfileData] Profile data loaded successfully')
      console.log('Recent Games:', gamesStore.recentGames.length)
      console.log('Recent Matches:', matchesStore.recentMatches.length)

      return {
        success: true,
        data: {
          games: gamesStore.recentGames,
          matches: matchesStore.recentMatches,
          stats: profileStats.value,
        },
      }
    } catch (error) {
      console.error('[useProfileData] Error loading profile data:', error)
      profileError.value = error.response?.data?.message || 'Erro ao carregar dados do perfil'

      return {
        success: false,
        error: profileError.value,
      }
    } finally {
      isLoadingProfile.value = false
    }
  }

  // Função para carregar estatísticas completas
  const loadProfileStats = async (userId) => {
    if (!userId) return { success: false, error: 'User ID is required' }

    try {
      await Promise.all([gamesStore.fetchGameStats(userId), matchesStore.fetchMatchStats(userId)])

      return {
        success: true,
        data: {
          gameStats: gamesStore.gameStats,
          matchStats: matchesStore.matchStats,
        },
      }
    } catch (error) {
      console.error('[useProfileData] Error loading profile stats:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao carregar estatísticas',
      }
    }
  }

  // Função para limpar dados
  const clearProfileData = () => {
    gamesStore.clearRecentGames()
    matchesStore.clearRecentMatches()
    profileError.value = null
  }

  // Função para refrescar dados
  const refreshProfileData = async (userId) => {
    clearProfileData()
    return await loadProfileData(userId)
  }

  // Função para obter jogo por ID (busca em ambas as stores)
  const findGameById = (gameId) => {
    // Primeiro busca nos jogos recentes
    let game = gamesStore.getGameById(gameId)
    if (game) return game

    // Depois busca nos jogos das partidas
    for (const match of matchesStore.recentMatches) {
      if (match.games) {
        game = match.games.find((g) => g.id === gameId)
        if (game) return game
      }
    }

    return null
  }

  // Função para obter partida por ID
  const findMatchById = (matchId) => {
    return matchesStore.getMatchById(matchId)
  }

  // Função para obter dados do oponente de um jogo
  const getGameOpponent = (game, userId) => {
    return gamesStore.getGameOpponent(game, userId)
  }

  // Função para obter dados do oponente de uma partida
  const getMatchOpponent = (match, userId) => {
    return matchesStore.getMatchOpponent(match, userId)
  }

  return {
    // Estados
    isLoading,
    isLoadingProfile,
    profileError,

    // Dados computados
    hasAnyData,
    profileStats,

    // Dados das stores
    recentGames: computed(() => gamesStore.recentGames),
    recentMatches: computed(() => matchesStore.recentMatches),
    gameStats: computed(() => gamesStore.gameStats),
    matchStats: computed(() => matchesStore.matchStats),

    // Métodos principais
    loadProfileData,
    loadProfileStats,
    clearProfileData,
    refreshProfileData,

    // Métodos auxiliares
    findGameById,
    findMatchById,
    getGameOpponent,
    getMatchOpponent,

    // Acesso direto às stores (se necessário)
    gamesStore,
    matchesStore,
  }
}

// Exemplo de uso:
/*
// Em qualquer componente Vue:
import { useProfileData } from '@/composables/useProfileData'

export default {
  setup() {
    const {
      isLoading,
      recentGames,
      recentMatches,
      loadProfileData,
      profileStats
    } = useProfileData()

    // Carregar dados
    const loadData = async (userId) => {
      const result = await loadProfileData(userId)
      if (result.success) {
        console.log('Dados carregados:', result.data)
      } else {
        console.error('Erro:', result.error)
      }
    }

    return {
      isLoading,
      recentGames,
      recentMatches,
      profileStats,
      loadData
    }
  }
}
*/
