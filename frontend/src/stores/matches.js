import { defineStore } from 'pinia'
import axios from 'axios'

export const useMatchesStore = defineStore('matches', {
  state: () => ({
    // Dados das partidas (matches)
    recentMatches: [], // Top 5 Partidas para o perfil
    matches: [], // Histórico completo (paginado)
    currentMatch: null, // Detalhes de uma partida específica

    // Estatísticas
    matchStats: {},

    // Estados de loading
    loadingMatches: false,
    loadingRecentMatches: false,
    loadingStats: false,
    loadingDetails: false,

    // Controlo de erros
    errors: {
      matches: null,
      recentMatches: null,
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
    hasRecentMatches: (state) => state.recentMatches.length > 0,
    hasMatches: (state) => state.matches.length > 0,

    // Estados de loading
    isLoadingAny: (state) =>
      state.loadingMatches ||
      state.loadingRecentMatches ||
      state.loadingStats ||
      state.loadingDetails,

    // Estatísticas processadas
    matchWinRate: (state) => {
      const stats = state.matchStats
      return stats.total_matches > 0
        ? Math.round((stats.won_matches / stats.total_matches) * 100)
        : 0
    },

    // Filtros úteis
    wonMatches: (state) => state.recentMatches.filter((match) => match.is_winner),
    lostMatches: (state) => state.recentMatches.filter((match) => !match.is_winner),
  },

  actions: {
    // --- BUSCAR PARTIDAS RECENTES PARA O PERFIL ---
    async fetchRecentMatches(userId) {
      if (!userId) {
        console.warn('fetchRecentMatches: userId is required')
        return []
      }

      this.loadingRecentMatches = true
      this.errors.recentMatches = null

      try {
        console.log(`[MatchesStore] Fetching recent matches for user ${userId}...`)

        const response = await axios.get(`/users/${userId}/matches/recent`)

        // Verifica se response.data é um array válido
        const matchesData = Array.isArray(response.data) ? response.data : []

        // Processa e atualiza os dados das partidas
        this.recentMatches = matchesData.map((match, index) => {
          console.log(`[MatchesStore] Processing Match ${index + 1}:`, match)
          return {
            ...match,
            // Garante que o campo is_winner está definido
            is_winner:
              match.is_winner !== undefined ? match.is_winner : match.winner_user_id == userId,
            // Processa dados do oponente
            opponent: match.opponent || this.getMatchOpponent(match, userId),
            // Processa jogos internos se existirem
            games: Array.isArray(match.games)
              ? match.games.map((game) => ({
                  ...game,
                  is_winner:
                    game.is_winner !== undefined ? game.is_winner : game.winner_id == userId,
                }))
              : [],
          }
        })

        console.log('[MatchesStore] Recent Matches processed:', this.recentMatches.length, 'items')

        if (this.recentMatches.length > 0) {
          console.log('[MatchesStore] First Match Sample:', this.recentMatches[0])
        }

        return this.recentMatches
      } catch (error) {
        console.error('[MatchesStore] Error fetching recent matches:', error)

        this.errors.recentMatches =
          error.response?.data?.message || 'Erro ao carregar partidas recentes.'

        // Reset dos dados em caso de erro
        this.recentMatches = []

        throw error
      } finally {
        this.loadingRecentMatches = false
      }
    },

    // --- HISTÓRICO COMPLETO DE PARTIDAS ---
    async fetchMatchesByUser(userId, page = 1) {
      this.loadingMatches = true
      this.errors.matches = null

      try {
        const response = await axios.get(`/matches/user/${userId}`, {
          params: { page },
        })

        const data = response.data || {}
        this.matches = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []

        // Atualiza informação de paginação se disponível
        if (data.current_page) {
          this.pagination = {
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total,
          }
        }

        return this.matches
      } catch (error) {
        console.error('❌ [MatchesStore] Error fetching user matches:', error)
        this.errors.matches =
          error.response?.data?.message || 'Erro ao carregar histórico de partidas.'
        throw error
      } finally {
        this.loadingMatches = false
      }
    },

    // --- DETALHES DE UMA PARTIDA ESPECÍFICA ---
    async fetchMatchDetails(matchId) {
      if (!matchId) return

      this.loadingDetails = true
      this.errors.details = null

      try {
        const response = await axios.get(`/matches/${matchId}`)
        this.currentMatch = response.data || null
        return this.currentMatch
      } catch (error) {
        console.error('[MatchesStore] Error fetching match details:', error)
        this.errors.details =
          error.response?.data?.message || 'Erro ao carregar detalhes da partida.'
        throw error
      } finally {
        this.loadingDetails = false
      }
    },

    // --- ESTATÍSTICAS DE PARTIDAS ---
    async fetchMatchStats(userId) {
      if (!userId) return

      this.loadingStats = true
      this.errors.stats = null

      try {
        const response = await axios.get(`/users/${userId}/matches/stats`)
        this.matchStats = response.data || {}
        return this.matchStats
      } catch (error) {
        console.error('[MatchesStore] Error fetching match stats:', error)
        this.errors.stats =
          error.response?.data?.message || 'Erro ao carregar estatísticas de partidas.'
        throw error
      } finally {
        this.loadingStats = false
      }
    },

    // --- HISTÓRICO PESSOAL (Autenticado) ---
    async fetchMyHistory() {
      this.loadingMatches = true
      this.errors.matches = null

      try {
        const response = await axios.get('/matches/me')
        const data = response.data

        this.matches = data.data || data

        if (data.current_page) {
          this.pagination = {
            current_page: data.current_page,
            last_page: data.last_page,
            per_page: data.per_page,
            total: data.total,
          }
        }

        return this.matches
      } catch (error) {
        console.error('[MatchesStore] Error fetching my history:', error)
        this.errors.matches = error.response?.data?.message || 'Erro ao carregar seu histórico.'
        throw error
      } finally {
        this.loadingMatches = false
      }
    },

    // --- OPERAÇÕES DE PARTIDAS ---
    async createMatch(matchData) {
      try {
        const response = await axios.post('/matches', matchData)
        const newMatch = response.data || {}

        // Adiciona a nova partida ao início da lista se estivermos na primeira página
        if (this.pagination.current_page === 1 && Array.isArray(this.matches)) {
          this.matches.unshift(newMatch)
        }

        return newMatch
      } catch (error) {
        console.error('[MatchesStore] Error creating match:', error)
        throw error
      }
    },

    async updateMatch(matchId, updates) {
      try {
        const response = await axios.patch(`/matches/${matchId}`, updates)
        const updatedMatch = response.data || {}

        // Atualiza a partida na lista local
        if (Array.isArray(this.matches)) {
          const index = this.matches.findIndex((m) => m.id === matchId)
          if (index !== -1) {
            this.matches[index] = { ...this.matches[index], ...updatedMatch }
          }
        }

        // Atualiza também a partida atual se for a mesma
        if (this.currentMatch && this.currentMatch.id === matchId) {
          this.currentMatch = { ...this.currentMatch, ...updatedMatch }
        }

        return updatedMatch
      } catch (error) {
        console.error('[MatchesStore] Error updating match:', error)
        throw error
      }
    },

    // --- MÉTODOS DE LIMPEZA ---
    clearRecentMatches() {
      this.recentMatches = []
      this.errors.recentMatches = null
    },

    clearAllData() {
      this.recentMatches = []
      this.matches = []
      this.currentMatch = null
      this.matchStats = {}
      this.errors = {
        matches: null,
        recentMatches: null,
        stats: null,
        details: null,
      }
    },

    clearErrors() {
      this.errors = {
        matches: null,
        recentMatches: null,
        stats: null,
        details: null,
      }
    },

    // --- MÉTODOS AUXILIARES ---
    getMatchById(matchId) {
      return (
        (Array.isArray(this.matches) ? this.matches.find((m) => m.id === matchId) : null) ||
        (Array.isArray(this.recentMatches)
          ? this.recentMatches.find((m) => m.id === matchId)
          : null)
      )
    },

    // Método auxiliar para obter oponente de uma partida
    getMatchOpponent(match, userId) {
      if (!match || !userId) return null

      // Se já tem dados do oponente processados
      if (match.opponent) return match.opponent

      // Determina quem é o oponente baseado no player1_user_id e player2_user_id
      if (match.player1_user_id == userId && match.player2) {
        return {
          id: match.player2.id,
          name: match.player2.name,
          nickname: match.player2.nickname,
          photo_avatar_filename: match.player2.photo_avatar_filename,
        }
      } else if (match.player2_user_id == userId && match.player1) {
        return {
          id: match.player1.id,
          name: match.player1.name,
          nickname: match.player1.nickname,
          photo_avatar_filename: match.player1.photo_avatar_filename,
        }
      }

      return null
    },

    // Método para refrescar dados de partidas
    async refreshMatches(userId) {
      if (!userId) return

      try {
        await Promise.all([this.fetchRecentMatches(userId), this.fetchMatchStats(userId)])
      } catch (error) {
        console.error('[MatchesStore] Error during refresh:', error)
      }
    },
  },
})
