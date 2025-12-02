import { defineStore } from 'pinia'
import axios from 'axios'

export const useMatchesStore = defineStore('matches', {
  state: () => ({
    matches: [],
    totalMatches: 0,
    loading: false,
    error: null,
  }),

  getters: {
    hasMatches: (state) => state.matches.length > 0,
  },

  actions: {
    async fetchMatchesByUser(userId) {
      this.loading = true
      this.error = null
      try {
        // Chama a rota pública que criámos no Laravel
        const response = await axios.get(`/matches/user/${userId}`)

        // Assume que o Laravel retorna paginação (response.data.data) ou lista direta
        this.matches = response.data.data || response.data
        this.totalMatches = response.data.total || this.matches.length

        return this.matches
      } catch (err) {
        this.error = err.response?.data?.message || 'Erro ao carregar histórico.'
        console.error('MatchesStore Error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
