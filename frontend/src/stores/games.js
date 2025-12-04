import { defineStore } from 'pinia'
import axios from 'axios'
import { getErrorMessage, safeAsync, errorLogger } from '@/utils/errorHandling'

export const useGamesStore = defineStore('games', {
  state: () => ({
    // Dados dos jogos
    recentGames: [], // Top 10 Jogos para o perfil
    games: [], // Histórico completo (paginado)
    currentGame: null, // Detalhes de um jogo específico

    // Estatísticas
    gameStats: {},

    // Estados de loading
    loadingGames: false,
    loadingRecentGames: false,
    loadingStats: false,
    loadingDetails: false,

    // Controlo de erros
    errors: {
      games: null,
      recentGames: null,
      stats: null,
      details: null,
    },

    // Paginação
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  }),

  getters: {
    // Verificadores de dados
    hasRecentGames: (state) => state.recentGames.length > 0,
    hasGames: (state) => state.games.length > 0,

    // Estados de loading
    isLoadingAny: (state) =>
      state.loadingGames || state.loadingRecentGames || state.loadingStats || state.loadingDetails,

    // Estatísticas processadas
    gameWinRate: (state) => {
      const stats = state.gameStats
      return stats.total_games > 0 ? Math.round((stats.won_games / stats.total_games) * 100) : 0
    },

    // Filtros úteis
    wonGames: (state) => state.recentGames.filter((game) => game.is_winner === true),
    lostGames: (state) => state.recentGames.filter((game) => game.is_winner === false),
    drawnGames: (state) => state.recentGames.filter((game) => game.is_winner === null),
  },

  actions: {
    // --- BUSCAR JOGOS RECENTES PARA O PERFIL ---
    async fetchRecentGames(userId) {
      if (!userId) {
        console.warn('fetchRecentGames: userId is required')
        return []
      }

      this.loadingRecentGames = true
      this.errors.recentGames = null

      try {
        console.log(`🔄 [GamesStore] Fetching recent games for user ${userId}...`)

        const response = await axios.get(`/users/${userId}/games/recent`)

        // Verifica se response.data é um array válido
        const gamesData = Array.isArray(response.data) ? response.data : []

        // Processa e atualiza os dados dos jogos
        this.recentGames = gamesData.map((game, index) => {
          console.log(`🎮 [GamesStore] Processing Game ${index + 1}:`, game)
          return {
            ...game,
            // Garante que o campo is_winner está definido
            is_winner: game.is_winner !== undefined ? game.is_winner : game.winner_id == userId,
            // Processa dados do oponente
            opponent: game.opponent || this.getGameOpponent(game, userId),
          }
        })

        console.log('✅ [GamesStore] Recent Games processed:', this.recentGames.length, 'items')

        if (this.recentGames.length > 0) {
          console.log('🎯 [GamesStore] First Game Sample:', this.recentGames[0])
        }

        return this.recentGames
      } catch (error) {
        errorLogger.error('Error fetching recent games', {
          userId,
          error: getErrorMessage(error),
          status: error?.response?.status,
        })

        this.errors.recentGames = getErrorMessage(error)

        // Reset dos dados em caso de erro
        this.recentGames = []

        throw error
      } finally {
        this.loadingRecentGames = false
      }
    },

    // --- HISTÓRICO COMPLETO DE JOGOS ---
    async fetchGamesByUser(userId, page = 1) {
      this.loadingGames = true
      this.errors.games = null

      try {
        // Nota: Este endpoint pode não existir ainda, mas está preparado para expansões futuras
        const response = await axios.get(`/users/${userId}/games`, {
          params: { page },
        })

        const data = response.data || {}
        this.games = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []

        // Atualiza informação de paginação se disponível
        if (data.current_page) {
          this.pagination = {
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total,
          }
        }

        return this.games
      } catch (error) {
        errorLogger.error('Error fetching user games', {
          userId,
          page,
          error: getErrorMessage(error),
        })
        this.errors.games = getErrorMessage(error)
        throw error
      } finally {
        this.loadingGames = false
      }
    },

    // --- DETALHES DE UM JOGO ESPECÍFICO ---
    async fetchGameDetails(gameId) {
      if (!gameId) return

      this.loadingDetails = true
      this.errors.details = null

      try {
        const response = await axios.get(`/games/${gameId}`)
        this.currentGame = response.data || null
        return this.currentGame
      } catch (error) {
        errorLogger.error('Error fetching game details', {
          gameId,
          error: getErrorMessage(error),
        })
        this.errors.details = getErrorMessage(error)
        throw error
      } finally {
        this.loadingDetails = false
      }
    },

    // --- ESTATÍSTICAS DE JOGOS ---
    async fetchGameStats(userId) {
      if (!userId) return

      this.loadingStats = true
      this.errors.stats = null

      try {
        const response = await axios.get(`/users/${userId}/games/stats`)
        this.gameStats = response.data || {}
        return this.gameStats
      } catch (error) {
        errorLogger.error('Error fetching game stats', {
          userId,
          error: getErrorMessage(error),
        })
        this.errors.stats = getErrorMessage(error)
        throw error
      } finally {
        this.loadingStats = false
      }
    },

    // --- OPERAÇÕES DE JOGOS ---
    async createGame(gameData) {
      try {
        const response = await axios.post('/games', gameData)
        const newGame = response.data || {}

        // Adiciona o novo jogo ao início da lista se estivermos na primeira página
        if (this.pagination.current_page === 1 && Array.isArray(this.games)) {
          this.games.unshift(newGame)
        }

        return newGame
      } catch (error) {
        errorLogger.error('Error creating game', {
          gameData,
          error: getErrorMessage(error),
        })
        throw error
      }
    },

    async updateGame(gameId, updates) {
      try {
        const response = await axios.patch(`/games/${gameId}`, updates)
        const updatedGame = response.data || {}

        // Atualiza o jogo na lista local
        if (Array.isArray(this.games)) {
          const index = this.games.findIndex((g) => g.id === gameId)
          if (index !== -1) {
            this.games[index] = { ...this.games[index], ...updatedGame }
          }
        }

        // Atualiza também o jogo atual se for o mesmo
        if (this.currentGame && this.currentGame.id === gameId) {
          this.currentGame = { ...this.currentGame, ...updatedGame }
        }

        return updatedGame
      } catch (error) {
        errorLogger.error('Error updating game', {
          gameId,
          updates,
          error: getErrorMessage(error),
        })
        throw error
      }
    },

    // --- MÉTODOS DE LIMPEZA ---
    clearRecentGames() {
      this.recentGames = []
      this.errors.recentGames = null
    },

    clearAllData() {
      this.recentGames = []
      this.games = []
      this.currentGame = null
      this.gameStats = {}
      this.errors = {
        games: null,
        recentGames: null,
        stats: null,
        details: null,
      }
    },

    clearErrors() {
      this.errors = {
        games: null,
        recentGames: null,
        stats: null,
        details: null,
      }
    },

    // --- MÉTODOS AUXILIARES ---
    getGameById(gameId) {
      return (
        this.games.find((g) => g.id === gameId) || this.recentGames.find((g) => g.id === gameId)
      )
    },

    // Método auxiliar para obter oponente de um jogo
    getGameOpponent(game, userId) {
      if (!game || !userId) return null

      // Se já tem dados do oponente processados
      if (game.opponent) return game.opponent

      // Determina quem é o oponente baseado no player1_id e player2_id
      if (game.player1_id == userId && game.player2) {
        return {
          id: game.player2.id,
          name: game.player2.name,
          nickname: game.player2.nickname,
          photo_avatar_filename: game.player2.photo_avatar_filename,
        }
      } else if (game.player2_id == userId && game.player1) {
        return {
          id: game.player1.id,
          name: game.player1.name,
          nickname: game.player1.nickname,
          photo_avatar_filename: game.player1.photo_avatar_filename,
        }
      }

      return null
    },

    // Método para refrescar dados de jogos
    async refreshGames(userId) {
      if (!userId) return

      const [error, result] = await safeAsync(
        () => Promise.all([this.fetchRecentGames(userId), this.fetchGameStats(userId)]),
        `Refresh games for user ${userId}`,
      )

      if (error) {
        this.errors.recentGames = error.message
        this.errors.stats = error.message
      }

      return result
    },

    // Método para buscar jogos por partida (match)
    async fetchGamesByMatch(matchId) {
      if (!matchId) return []

      try {
        const response = await axios.get(`/matches/${matchId}/games`)
        const gamesData = response.data || []
        return Array.isArray(gamesData) ? gamesData : []
      } catch (error) {
        errorLogger.error('Error fetching games by match', {
          matchId,
          error: getErrorMessage(error),
        })
        return [] // Return empty array instead of throwing error
      }
    },
  },
})
